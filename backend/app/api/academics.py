from collections import defaultdict
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_, tuple_
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    ClassRoom,
    ClassResponsibility,
    Exam,
    Learner,
    LearningArea,
    MarkEntry,
    TeachingAssignment,
    User,
    UserRole,
    is_teacher_role,
)
from ..schemas import (
    ClassCreateRequest,
    ClassSplitRequest,
    ClassResponsibilityCreate,
    ClassUpdateRequest,
    ExamBatchCreate,
    ExamCreate,
    ExamStatusUpdate,
    LearningAreaCreate,
    MarkEntryCreate,
    MeritListRequest,
    TeachingAssignmentCreate,
    TeachingAssignmentUpdate,
)
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/academics", tags=["academics"])


def _compute_level(marks: float, max_marks: float, formula: str) -> str | None:
    if not formula or max_marks <= 0:
        return None
    percent = (marks / max_marks) * 100
    entries = []
    for item in formula.split(","):
        if ":" not in item:
            continue
        threshold_text, label = item.split(":", 1)
        try:
            entries.append((float(threshold_text.strip()), label.strip()))
        except ValueError:
            continue
    entries.sort(key=lambda item: item[0], reverse=True)
    for threshold, label in entries:
        if percent >= threshold:
            return label
    return None


def _teacher_can_access_assignment(
    db: Session,
    current_user: User,
    class_id: int,
    learning_area_id: int | None = None,
    require_class_teacher: bool = False,
) -> bool:
    if current_user.role in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        return True
    if not is_teacher_role(current_user.role):
        return False

    query = db.query(TeachingAssignment).filter(
        TeachingAssignment.teacher_user_id == current_user.id,
        TeachingAssignment.class_id == class_id,
    )
    if learning_area_id is not None:
        query = query.filter(TeachingAssignment.learning_area_id == learning_area_id)
    if require_class_teacher:
        class_responsibility = (
            db.query(ClassResponsibility)
            .filter(
                ClassResponsibility.teacher_user_id == current_user.id,
                ClassResponsibility.class_id == class_id,
            )
            .first()
        )
        if class_responsibility is not None:
            return True
    assignments = query.all()
    if not assignments:
        return False
    if require_class_teacher:
        return any(item.is_class_teacher for item in assignments)
    return True


@router.post("/learning-areas")
def create_learning_area(
    payload: LearningAreaCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    area = LearningArea(
        class_id=payload.class_id,
        name=payload.name.strip(),
        min_marks=payload.min_marks,
        max_marks=payload.max_marks,
        cbc_formula=payload.cbc_formula.strip(),
    )
    db.add(area)
    db.commit()
    db.refresh(area)
    return {
        "message": "Learning area created.",
        "id": area.id,
        "name": area.name,
        "max_marks": area.max_marks,
        "cbc_formula": area.cbc_formula,
    }


@router.post("/classes")
def create_class(
    payload: ClassCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    name = payload.name.strip()
    duplicate = db.query(ClassRoom).filter(ClassRoom.name == name).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Class name already exists.")

    class_room = ClassRoom(name=name, stream=payload.stream.strip() if payload.stream else None)
    db.add(class_room)
    db.commit()
    db.refresh(class_room)
    return {"message": "Class created.", "id": class_room.id, "name": class_room.name, "stream": class_room.stream}


@router.put("/classes/{class_id}")
def update_class(
    class_id: int,
    payload: ClassUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    class_room = db.query(ClassRoom).filter(ClassRoom.id == class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    name = payload.name.strip()
    duplicate = db.query(ClassRoom).filter(ClassRoom.name == name, ClassRoom.id != class_id).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Class name already exists.")

    class_room.name = name
    class_room.stream = payload.stream.strip() if payload.stream else None
    db.commit()
    db.refresh(class_room)
    return {"message": "Class updated.", "id": class_room.id, "name": class_room.name, "stream": class_room.stream}


@router.post("/classes/{class_id}/split")
def split_class(
    class_id: int,
    payload: ClassSplitRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    source_class = db.query(ClassRoom).filter(ClassRoom.id == class_id).first()
    if source_class is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Source class not found.")

    first_name = payload.first_class_name.strip()
    second_name = payload.second_class_name.strip()
    if not first_name or not second_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Enter both split class names.")
    if first_name == second_name:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Split class names must be different.")

    existing_first = (
        db.query(ClassRoom)
        .filter(ClassRoom.name == first_name, ClassRoom.id != class_id)
        .first()
    )
    if existing_first is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="The first split class name already exists.")

    source_learners = db.query(Learner).filter(Learner.class_id == class_id).all()
    source_learner_ids = {learner.id for learner in source_learners}
    first_learner_ids = set(payload.first_class_learner_ids)
    second_learner_ids = set(payload.second_class_learner_ids)
    selected_learner_ids = first_learner_ids | second_learner_ids

    if first_learner_ids & second_learner_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="A learner can only be placed in one split class.")
    if source_learner_ids and selected_learner_ids != source_learner_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Place every learner in either the first or second split class.")
    if selected_learner_ids - source_learner_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Only learners from the selected class can be split.")

    source_class.name = first_name
    source_class.stream = None

    second_class = db.query(ClassRoom).filter(ClassRoom.name == second_name).first()
    if second_class is None:
        second_class = ClassRoom(name=second_name, stream=None)
        db.add(second_class)
        db.flush()

    moved_count = 0
    for learner in source_learners:
        if learner.id in second_learner_ids:
            learner.class_id = second_class.id
            moved_count += 1
        else:
            learner.class_id = source_class.id

    db.commit()
    return {
        "message": "Class split saved.",
        "first_class_id": source_class.id,
        "second_class_id": second_class.id,
        "moved_learners": moved_count,
    }


@router.get("/classes")
def list_classes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(ClassRoom).order_by(ClassRoom.name.asc()).all()
    return [{"id": row.id, "name": row.name, "stream": row.stream} for row in rows]


@router.get("/learning-areas")
def list_learning_areas(
    class_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(LearningArea)
    if class_id is not None:
        query = query.filter(LearningArea.class_id == class_id)
    rows = query.order_by(LearningArea.class_id.asc(), LearningArea.name.asc()).all()
    return [
        {
            "id": row.id,
            "class_id": row.class_id,
            "name": row.name,
            "min_marks": row.min_marks,
            "max_marks": row.max_marks,
            "cbc_formula": row.cbc_formula,
        }
        for row in rows
    ]


@router.post("/assignments")
def assign_teacher(
    payload: TeachingAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    teacher = db.query(User).filter(User.id == payload.teacher_user_id).first()
    if teacher is None or not is_teacher_role(teacher.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select a valid teacher account.")

    learning_area = db.query(LearningArea).filter(LearningArea.id == payload.learning_area_id).first()
    if learning_area is None or learning_area.class_id != payload.class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Learning area must belong to the selected class.")

    assignment = TeachingAssignment(
        teacher_user_id=payload.teacher_user_id,
        class_id=payload.class_id,
        learning_area_id=payload.learning_area_id,
        is_class_teacher=payload.is_class_teacher,
    )
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    return {"message": "Teacher assignment created.", "assignment_id": assignment.id}


@router.put("/assignments/{assignment_id}")
def update_assignment(
    assignment_id: int,
    payload: TeachingAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    assignment = db.query(TeachingAssignment).filter(TeachingAssignment.id == assignment_id).first()
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Teacher assignment not found.")

    teacher = db.query(User).filter(User.id == payload.teacher_user_id).first()
    if teacher is None or not is_teacher_role(teacher.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select a valid teacher account.")

    class_room = db.query(ClassRoom).filter(ClassRoom.id == payload.class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    learning_area = db.query(LearningArea).filter(LearningArea.id == payload.learning_area_id).first()
    if learning_area is None or learning_area.class_id != payload.class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Learning area must belong to the selected class.")

    assignment.teacher_user_id = payload.teacher_user_id
    assignment.class_id = payload.class_id
    assignment.learning_area_id = payload.learning_area_id
    assignment.is_class_teacher = payload.is_class_teacher
    db.commit()
    db.refresh(assignment)
    return {"message": "Teacher assignment updated.", "assignment_id": assignment.id}


@router.post("/class-responsibilities")
def assign_class_responsibility(
    payload: ClassResponsibilityCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    teacher = db.query(User).filter(User.id == payload.teacher_user_id).first()
    if teacher is None or not is_teacher_role(teacher.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select a valid teacher account.")

    class_room = db.query(ClassRoom).filter(ClassRoom.id == payload.class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    responsibility = (
        db.query(ClassResponsibility)
        .filter(ClassResponsibility.class_id == payload.class_id)
        .first()
    )
    if responsibility is None:
        responsibility = ClassResponsibility(
            teacher_user_id=payload.teacher_user_id,
            class_id=payload.class_id,
        )
        db.add(responsibility)
    else:
        responsibility.teacher_user_id = payload.teacher_user_id
    db.commit()
    db.refresh(responsibility)
    return {"message": "Class teacher responsibility saved.", "id": responsibility.id}


@router.get("/class-responsibilities")
def list_class_responsibilities(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HEAD_TEACHER,
            UserRole.TEACHER,
            UserRole.CLASS_TEACHER,
            UserRole.SUBJECT_TEACHER,
        )
    ),
):
    query = db.query(ClassResponsibility)
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        query = query.filter(ClassResponsibility.teacher_user_id == current_user.id)
    responsibilities = query.all()
    return [
        {
            "id": responsibility.id,
            "teacher_user_id": responsibility.teacher_user_id,
            "class_id": responsibility.class_id,
        }
        for responsibility in responsibilities
    ]


@router.get("/assignments/my")
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HEAD_TEACHER,
            UserRole.TEACHER,
            UserRole.CLASS_TEACHER,
            UserRole.SUBJECT_TEACHER,
        )
    ),
):
    query = db.query(TeachingAssignment)
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        query = query.filter(TeachingAssignment.teacher_user_id == current_user.id)
    assignments = query.all()
    return [
        {
            "id": assignment.id,
            "teacher_user_id": assignment.teacher_user_id,
            "class_id": assignment.class_id,
            "learning_area_id": assignment.learning_area_id,
            "is_class_teacher": assignment.is_class_teacher,
        }
        for assignment in assignments
    ]


@router.post("/exams")
def create_exam(
    payload: ExamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    exam = Exam(
        name=payload.name.strip(),
        exam_type=payload.exam_type.strip(),
        exam_month=payload.exam_month.strip() if payload.exam_month else None,
        term=payload.term.strip(),
        year=payload.year,
        marks_deadline=payload.marks_deadline,
        class_id=payload.class_id,
        learning_area_id=payload.learning_area_id,
        created_by_user_id=current_user.id,
    )
    db.add(exam)
    db.commit()
    db.refresh(exam)
    return {"message": "Exam created.", "exam_id": exam.id}


@router.post("/exams/batch")
def create_exam_batch(
    payload: ExamBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    if not payload.class_ids:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one class.")
    class_ids = sorted(set(payload.class_ids))
    class_rooms = db.query(ClassRoom).filter(ClassRoom.id.in_(class_ids)).all()
    if len(class_rooms) != len(class_ids):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="One or more classes were not found.")

    created_exams = []
    requested_names = [name.strip() for name in payload.learning_area_names if name.strip()]
    if payload.learning_area_name.strip():
        requested_names.append(payload.learning_area_name.strip())
    requested_names = list(dict.fromkeys(requested_names))

    for class_room in class_rooms:
        if payload.learning_area_scope == "all":
            learning_areas = (
                db.query(LearningArea)
                .filter(LearningArea.class_id == class_room.id)
                .order_by(LearningArea.name.asc())
                .all()
            )
        else:
            if not requested_names:
                raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Select at least one learning area.")
            learning_areas = []
            for area_name in requested_names:
                learning_area = (
                    db.query(LearningArea)
                    .filter(LearningArea.class_id == class_room.id, LearningArea.name.ilike(area_name))
                    .first()
                )
                if learning_area is None:
                    learning_area = LearningArea(
                        class_id=class_room.id,
                        name=area_name,
                        min_marks=payload.min_marks,
                        max_marks=payload.max_marks,
                        cbc_formula=payload.cbc_formula.strip(),
                    )
                    db.add(learning_area)
                    db.flush()
                learning_areas.append(learning_area)

        for learning_area in learning_areas:
            exam = Exam(
                name=payload.name.strip(),
                exam_type=payload.exam_type.strip(),
                exam_month=payload.exam_month.strip() if payload.exam_month else None,
                term=payload.term.strip(),
                year=payload.year,
                marks_deadline=payload.marks_deadline,
                class_id=class_room.id,
                learning_area_id=learning_area.id,
                created_by_user_id=current_user.id,
            )
            db.add(exam)
            db.flush()
            created_exams.append(exam.id)

    if not created_exams:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No learning areas were found for the selected classes.")

    db.commit()
    return {"message": "Exam batch created.", "exam_ids": created_exams, "count": len(created_exams)}


@router.get("/exams")
def list_exams(
    class_id: int | None = None,
    learning_area_id: int | None = None,
    year: int | None = None,
    term: str | None = None,
    exam_month: str | None = None,
    exam_type: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Exam)
    if class_id is not None:
        query = query.filter(Exam.class_id == class_id)
    if learning_area_id is not None:
        query = query.filter(Exam.learning_area_id == learning_area_id)
    if year is not None:
        query = query.filter(Exam.year == year)
    if term:
        query = query.filter(Exam.term == term)
    if exam_month:
        query = query.filter(Exam.exam_month == exam_month)
    if exam_type:
        query = query.filter(Exam.exam_type == exam_type)
    if is_teacher_role(current_user.role) and current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        assignments = (
            db.query(TeachingAssignment)
            .filter(TeachingAssignment.teacher_user_id == current_user.id)
            .all()
        )
        allowed_pairs = {(assignment.class_id, assignment.learning_area_id) for assignment in assignments}
        class_responsibilities = (
            db.query(ClassResponsibility)
            .filter(ClassResponsibility.teacher_user_id == current_user.id)
            .all()
        )
        responsible_class_ids = {responsibility.class_id for responsibility in class_responsibilities}
        if not allowed_pairs and not responsible_class_ids:
            return []
        visibility_filters = []
        if allowed_pairs:
            visibility_filters.append(tuple_(Exam.class_id, Exam.learning_area_id).in_(allowed_pairs))
        if responsible_class_ids:
            visibility_filters.append(Exam.class_id.in_(responsible_class_ids))
        query = query.filter(or_(*visibility_filters))
    exams = query.order_by(Exam.year.desc(), Exam.exam_month.asc(), Exam.term.asc(), Exam.name.asc()).all()
    return [
        {
            "id": exam.id,
            "name": exam.name,
            "exam_type": exam.exam_type,
            "exam_month": exam.exam_month,
            "term": exam.term,
            "year": exam.year,
            "marks_deadline": exam.marks_deadline.isoformat() if exam.marks_deadline else None,
            "status": exam.status,
            "class_id": exam.class_id,
            "learning_area_id": exam.learning_area_id,
            "created_by_user_id": exam.created_by_user_id,
        }
        for exam in exams
    ]


@router.patch("/exams/{exam_id}/status")
def update_exam_status(
    exam_id: int,
    payload: ExamStatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    exam = db.query(Exam).filter(Exam.id == exam_id).first()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")

    action = payload.action.strip().lower()
    status_by_action = {
        "pause": "paused",
        "end": "ended",
        "restart": "active",
    }
    next_status = status_by_action.get(action)
    if next_status is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use pause, end, or restart.")

    cycle_exams = db.query(Exam).filter(
        Exam.name == exam.name,
        Exam.exam_type == exam.exam_type,
        Exam.exam_month == exam.exam_month,
        Exam.term == exam.term,
        Exam.year == exam.year,
    ).all()
    for cycle_exam in cycle_exams:
        cycle_exam.status = next_status
        if action == "restart" and cycle_exam.marks_deadline is not None and datetime.utcnow() > cycle_exam.marks_deadline:
            cycle_exam.marks_deadline = None

    db.commit()
    return {"message": f"Exam {next_status}.", "status": next_status, "count": len(cycle_exams)}


@router.post("/marks")
def enter_marks(
    payload: MarkEntryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HEAD_TEACHER,
            UserRole.TEACHER,
            UserRole.CLASS_TEACHER,
            UserRole.SUBJECT_TEACHER,
        )
    ),
):
    exam = db.query(Exam).filter(Exam.id == payload.exam_id).first()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found.")
    if exam.status == "paused":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam is paused.")
    if exam.status == "ended":
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This exam has ended.")
    if exam.marks_deadline is not None and datetime.utcnow() > exam.marks_deadline:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Marks entry deadline has passed for this exam.")

    learner = db.query(Learner).filter(Learner.id == payload.learner_id).first()
    if learner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found.")
    if learner.class_id != exam.class_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Learner is not in this exam class.")

    if not _teacher_can_access_assignment(db, current_user, exam.class_id, exam.learning_area_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not assigned to enter marks for this class and learning area.",
        )

    learning_area = db.query(LearningArea).filter(LearningArea.id == exam.learning_area_id).first()
    if learning_area is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learning area not found.")
    if payload.marks < learning_area.min_marks or payload.marks > learning_area.max_marks:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Marks must be between {learning_area.min_marks} and {learning_area.max_marks}.",
        )

    level = _compute_level(payload.marks, learning_area.max_marks, learning_area.cbc_formula)
    mark_entry = (
        db.query(MarkEntry)
        .filter(MarkEntry.exam_id == payload.exam_id, MarkEntry.learner_id == payload.learner_id)
        .first()
    )
    if mark_entry is None:
        mark_entry = MarkEntry(
            exam_id=payload.exam_id,
            learner_id=payload.learner_id,
            marks=payload.marks,
            level=level,
            entered_by_user_id=current_user.id,
        )
        db.add(mark_entry)
    else:
        mark_entry.marks = payload.marks
        mark_entry.level = level
        mark_entry.entered_by_user_id = current_user.id

    db.commit()
    db.refresh(mark_entry)
    return {
        "message": "Marks saved successfully.",
        "mark_entry_id": mark_entry.id,
        "marks": mark_entry.marks,
        "level": mark_entry.level,
    }


@router.get("/marks")
def list_marks(
    exam_id: int | None = None,
    class_id: int | None = None,
    learning_area_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HEAD_TEACHER,
            UserRole.TEACHER,
            UserRole.CLASS_TEACHER,
            UserRole.SUBJECT_TEACHER,
        )
    ),
):
    query = db.query(MarkEntry, Exam, Learner).join(Exam, MarkEntry.exam_id == Exam.id).join(Learner, MarkEntry.learner_id == Learner.id)
    if exam_id is not None:
        query = query.filter(MarkEntry.exam_id == exam_id)
    if class_id is not None:
        query = query.filter(Exam.class_id == class_id)
    if learning_area_id is not None:
        query = query.filter(Exam.learning_area_id == learning_area_id)

    if is_teacher_role(current_user.role) and current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        assignments = (
            db.query(TeachingAssignment)
            .filter(TeachingAssignment.teacher_user_id == current_user.id)
            .all()
        )
        allowed_pairs = {(assignment.class_id, assignment.learning_area_id) for assignment in assignments}
        if not allowed_pairs:
            return []
        query = query.filter(tuple_(Exam.class_id, Exam.learning_area_id).in_(allowed_pairs))

    rows = query.order_by(Learner.full_name.asc()).all()
    return [
        {
            "id": mark.id,
            "exam_id": mark.exam_id,
            "learner_id": mark.learner_id,
            "marks": mark.marks,
            "level": mark.level,
            "entered_by_user_id": mark.entered_by_user_id,
            "entered_at": mark.entered_at.isoformat() if mark.entered_at else None,
            "class_id": exam.class_id,
            "learning_area_id": exam.learning_area_id,
            "learner_name": learner.full_name,
            "admission_no": learner.admission_no,
        }
        for mark, exam, learner in rows
    ]


@router.post("/merit-lists")
def generate_merit_list(
    payload: MeritListRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.HEAD_TEACHER,
            UserRole.TEACHER,
            UserRole.CLASS_TEACHER,
            UserRole.SUBJECT_TEACHER,
        )
    ),
):
    exam = db.query(Exam).filter(Exam.id == payload.exam_id, Exam.class_id == payload.class_id).first()
    if exam is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exam not found for the selected class.")

    if payload.learning_area_id is None:
        if not _teacher_can_access_assignment(db, current_user, payload.class_id, require_class_teacher=True):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only teachers with class responsibility or school leaders can download full class merit lists.",
            )
    else:
        if not _teacher_can_access_assignment(db, current_user, payload.class_id, payload.learning_area_id):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You are not assigned to this class and learning area.",
            )

    learners = db.query(Learner).filter(Learner.class_id == payload.class_id).all()
    exam_query = db.query(Exam).filter(
        Exam.class_id == exam.class_id,
        Exam.term == exam.term,
        Exam.year == exam.year,
    )
    if payload.learning_area_id is not None:
        exam_query = exam_query.filter(Exam.learning_area_id == payload.learning_area_id)
    cycle_exams = exam_query.all()
    cycle_exam_ids = [item.id for item in cycle_exams]
    marks = db.query(MarkEntry).filter(MarkEntry.exam_id.in_(cycle_exam_ids)).all()
    marks_by_learner = defaultdict(list)
    for item in marks:
        marks_by_learner[item.learner_id].append(item)

    ranking = []
    for learner in learners:
        learner_marks = marks_by_learner.get(learner.id, [])
        total = sum(item.marks for item in learner_marks)
        ranking.append(
            {
                "learner_id": learner.id,
                "admission_no": learner.admission_no,
                "learner_name": learner.full_name,
                "total_marks": total,
                "subject_count": len(learner_marks),
            }
        )

    ranking.sort(key=lambda item: item["total_marks"], reverse=True)
    for index, item in enumerate(ranking, start=1):
        item["position"] = index

    return {
        "class_id": payload.class_id,
        "exam_id": payload.exam_id,
        "learning_area_id": payload.learning_area_id,
        "items": ranking,
    }
