from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    ClassRoom,
    LearningArea,
    TeachingAssignment,
    TimetablePeriod,
    TimetableRequirement,
    TimetableRoom,
    TimetableSlot,
    User,
    UserRole,
    is_teacher_role,
)
from ..schemas import TimetablePeriodCreate, TimetableRequirementCreate, TimetableRoomCreate, TimetableSlotCreate
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/timetable", tags=["timetable"])

SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"]


def _can_view_timetable(current_user: User) -> bool:
    return current_user.role in {UserRole.ADMIN, UserRole.HEAD_TEACHER} or is_teacher_role(current_user.role)


def _room_payload(room: TimetableRoom) -> dict:
    return {"id": room.id, "name": room.name, "room_type": room.room_type, "capacity": room.capacity}


def _period_payload(period: TimetablePeriod) -> dict:
    return {
        "id": period.id,
        "name": period.name,
        "start_time": period.start_time,
        "end_time": period.end_time,
        "sort_order": period.sort_order,
        "is_break": period.is_break,
    }


def _slot_payload(slot: TimetableSlot) -> dict:
    return {
        "id": slot.id,
        "day_of_week": slot.day_of_week,
        "period_id": slot.period_id,
        "class_id": slot.class_id,
        "learning_area_id": slot.learning_area_id,
        "teacher_user_id": slot.teacher_user_id,
        "room_id": slot.room_id,
        "requirement_id": slot.requirement_id,
        "is_locked": slot.is_locked,
        "notes": slot.notes,
    }


def _requirement_payload(requirement: TimetableRequirement) -> dict:
    return {
        "id": requirement.id,
        "class_id": requirement.class_id,
        "learning_area_id": requirement.learning_area_id,
        "teacher_user_id": requirement.teacher_user_id,
        "periods_per_week": requirement.periods_per_week,
        "max_periods_per_day": requirement.max_periods_per_day,
        "preferred_room_id": requirement.preferred_room_id,
        "allow_double_periods": requirement.allow_double_periods,
        "notes": requirement.notes,
    }


def _validate_requirement(payload: TimetableRequirementCreate, db: Session, requirement_id: int | None = None) -> None:
    class_room = db.query(ClassRoom).filter(ClassRoom.id == payload.class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    learning_area = (
        db.query(LearningArea)
        .filter(LearningArea.id == payload.learning_area_id, LearningArea.class_id == payload.class_id)
        .first()
    )
    if learning_area is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Learning area is not mapped to this class.")

    teacher = db.query(User).filter(User.id == payload.teacher_user_id).first()
    if teacher is None or not is_teacher_role(teacher.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a teacher for this requirement.")

    assignment = (
        db.query(TeachingAssignment)
        .filter(
            TeachingAssignment.teacher_user_id == payload.teacher_user_id,
            TeachingAssignment.class_id == payload.class_id,
            TeachingAssignment.learning_area_id == payload.learning_area_id,
        )
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher is not assigned to this class and learning area.")

    if payload.preferred_room_id is not None and db.query(TimetableRoom).filter(TimetableRoom.id == payload.preferred_room_id).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Preferred room not found.")

    duplicate_query = db.query(TimetableRequirement).filter(
        TimetableRequirement.class_id == payload.class_id,
        TimetableRequirement.learning_area_id == payload.learning_area_id,
        TimetableRequirement.teacher_user_id == payload.teacher_user_id,
    )
    if requirement_id is not None:
        duplicate_query = duplicate_query.filter(TimetableRequirement.id != requirement_id)
    if duplicate_query.first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This lesson requirement already exists.")


def _validate_slot(payload: TimetableSlotCreate, db: Session, slot_id: int | None = None) -> None:
    day = payload.day_of_week.strip().title()
    if day not in SCHOOL_DAYS:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Use a school day from Monday to Friday.")

    period = db.query(TimetablePeriod).filter(TimetablePeriod.id == payload.period_id).first()
    if period is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Period not found.")
    if period.is_break:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Break periods cannot hold lessons.")

    class_room = db.query(ClassRoom).filter(ClassRoom.id == payload.class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    learning_area = (
        db.query(LearningArea)
        .filter(LearningArea.id == payload.learning_area_id, LearningArea.class_id == payload.class_id)
        .first()
    )
    if learning_area is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Learning area is not mapped to this class.")

    teacher = db.query(User).filter(User.id == payload.teacher_user_id).first()
    if teacher is None or not is_teacher_role(teacher.role):
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Choose a teacher for this lesson.")

    assignment = (
        db.query(TeachingAssignment)
        .filter(
            TeachingAssignment.teacher_user_id == payload.teacher_user_id,
            TeachingAssignment.class_id == payload.class_id,
            TeachingAssignment.learning_area_id == payload.learning_area_id,
        )
        .first()
    )
    if assignment is None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Teacher is not assigned to this class and learning area.")

    if payload.room_id is not None and db.query(TimetableRoom).filter(TimetableRoom.id == payload.room_id).first() is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Room not found.")

    if payload.requirement_id is not None:
        requirement = db.query(TimetableRequirement).filter(TimetableRequirement.id == payload.requirement_id).first()
        if requirement is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson requirement not found.")
        if (
            requirement.class_id != payload.class_id
            or requirement.learning_area_id != payload.learning_area_id
            or requirement.teacher_user_id != payload.teacher_user_id
        ):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Placed lesson does not match its lesson requirement.")

    conflict_query = db.query(TimetableSlot).filter(
        TimetableSlot.day_of_week == day,
        TimetableSlot.period_id == payload.period_id,
    )
    if slot_id is not None:
        conflict_query = conflict_query.filter(TimetableSlot.id != slot_id)
    conflict_filters = [
        TimetableSlot.class_id == payload.class_id,
        TimetableSlot.teacher_user_id == payload.teacher_user_id,
    ]
    if payload.room_id is not None:
        conflict_filters.append(TimetableSlot.room_id == payload.room_id)
    conflicts = conflict_query.filter(or_(*conflict_filters)).all()
    if conflicts:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="This lesson clashes with an existing class, teacher, or room booking.")


def _timetable_checks(db: Session) -> list[dict]:
    checks: list[dict] = []
    requirements = db.query(TimetableRequirement).all()
    slots = db.query(TimetableSlot).all()
    periods = {period.id: period for period in db.query(TimetablePeriod).all()}
    slot_counts: dict[int, int] = {}
    daily_counts: dict[tuple[int, str], int] = {}

    for slot in slots:
        if slot.requirement_id is not None:
            slot_counts[slot.requirement_id] = slot_counts.get(slot.requirement_id, 0) + 1
            daily_counts[(slot.requirement_id, slot.day_of_week)] = daily_counts.get((slot.requirement_id, slot.day_of_week), 0) + 1

        period = periods.get(slot.period_id)
        if period is not None and period.is_break:
            checks.append({"severity": "error", "message": "A lesson is placed inside a break period.", "slot_id": slot.id})

    for requirement in requirements:
        placed = slot_counts.get(requirement.id, 0)
        if placed < requirement.periods_per_week:
            checks.append(
                {
                    "severity": "warning",
                    "message": f"Requirement {requirement.id} needs {requirement.periods_per_week - placed} more period(s).",
                    "requirement_id": requirement.id,
                }
            )
        if placed > requirement.periods_per_week:
            checks.append(
                {
                    "severity": "error",
                    "message": f"Requirement {requirement.id} has {placed - requirement.periods_per_week} extra placed period(s).",
                    "requirement_id": requirement.id,
                }
            )
        for day in SCHOOL_DAYS:
            day_count = daily_counts.get((requirement.id, day), 0)
            if day_count > requirement.max_periods_per_day:
                checks.append(
                    {
                        "severity": "warning",
                        "message": f"Requirement {requirement.id} has too many periods on {day}.",
                        "requirement_id": requirement.id,
                    }
                )

    seen_cells: dict[tuple[str, int], list[TimetableSlot]] = {}
    for slot in slots:
        seen_cells.setdefault((slot.day_of_week, slot.period_id), []).append(slot)
    for cell_slots in seen_cells.values():
        for index, first in enumerate(cell_slots):
            for second in cell_slots[index + 1 :]:
                if first.class_id == second.class_id:
                    checks.append({"severity": "error", "message": "A class has two lessons in the same period.", "slot_id": second.id})
                if first.teacher_user_id == second.teacher_user_id:
                    checks.append({"severity": "error", "message": "A teacher has two lessons in the same period.", "slot_id": second.id})
                if first.room_id is not None and first.room_id == second.room_id:
                    checks.append({"severity": "error", "message": "A room is booked twice in the same period.", "slot_id": second.id})

    if not requirements:
        checks.append({"severity": "warning", "message": "Create weekly lesson requirements before generating a timetable."})
    if not db.query(TimetablePeriod).filter(TimetablePeriod.is_break.is_(False)).first():
        checks.append({"severity": "warning", "message": "Create teaching periods before placing lessons."})
    return checks


@router.get("/rooms")
def list_rooms(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _can_view_timetable(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view timetable rooms.")
    rooms = db.query(TimetableRoom).order_by(TimetableRoom.name.asc()).all()
    return [_room_payload(room) for room in rooms]


@router.post("/rooms")
def create_room(
    payload: TimetableRoomCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    name = payload.name.strip()
    if db.query(TimetableRoom).filter(TimetableRoom.name == name).first() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Room already exists.")
    room = TimetableRoom(name=name, room_type=payload.room_type.strip() if payload.room_type else None, capacity=payload.capacity)
    db.add(room)
    db.commit()
    db.refresh(room)
    return {"message": "Room created.", **_room_payload(room)}


@router.get("/periods")
def list_periods(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _can_view_timetable(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view timetable periods.")
    periods = db.query(TimetablePeriod).order_by(TimetablePeriod.sort_order.asc(), TimetablePeriod.start_time.asc()).all()
    return [_period_payload(period) for period in periods]


@router.post("/periods")
def create_period(
    payload: TimetablePeriodCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    period = TimetablePeriod(
        name=payload.name.strip(),
        start_time=payload.start_time.strip(),
        end_time=payload.end_time.strip(),
        sort_order=payload.sort_order,
        is_break=payload.is_break,
    )
    db.add(period)
    db.commit()
    db.refresh(period)
    return {"message": "Period created.", **_period_payload(period)}


@router.get("/requirements")
def list_requirements(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _can_view_timetable(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view timetable requirements.")
    query = db.query(TimetableRequirement)
    if is_teacher_role(current_user.role) and current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        query = query.filter(TimetableRequirement.teacher_user_id == current_user.id)
    requirements = query.order_by(TimetableRequirement.class_id.asc(), TimetableRequirement.learning_area_id.asc()).all()
    return [_requirement_payload(requirement) for requirement in requirements]


@router.post("/requirements")
def create_requirement(
    payload: TimetableRequirementCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    _validate_requirement(payload, db)
    requirement = TimetableRequirement(
        class_id=payload.class_id,
        learning_area_id=payload.learning_area_id,
        teacher_user_id=payload.teacher_user_id,
        periods_per_week=payload.periods_per_week,
        max_periods_per_day=payload.max_periods_per_day,
        preferred_room_id=payload.preferred_room_id,
        allow_double_periods=payload.allow_double_periods,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(requirement)
    db.commit()
    db.refresh(requirement)
    return {"message": "Lesson requirement created.", **_requirement_payload(requirement)}


@router.delete("/requirements/{requirement_id}")
def delete_requirement(
    requirement_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    requirement = db.query(TimetableRequirement).filter(TimetableRequirement.id == requirement_id).first()
    if requirement is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Lesson requirement not found.")
    placed_count = db.query(TimetableSlot).filter(TimetableSlot.requirement_id == requirement_id).count()
    if placed_count:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Remove placed lessons before deleting this requirement.")
    db.delete(requirement)
    db.commit()
    return {"message": "Lesson requirement removed."}


@router.get("/slots")
def list_slots(
    class_id: int | None = None,
    teacher_user_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not _can_view_timetable(current_user):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="You cannot view timetable slots.")
    query = db.query(TimetableSlot)
    if class_id is not None:
        query = query.filter(TimetableSlot.class_id == class_id)
    if teacher_user_id is not None:
        query = query.filter(TimetableSlot.teacher_user_id == teacher_user_id)
    if is_teacher_role(current_user.role) and current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        query = query.filter(TimetableSlot.teacher_user_id == current_user.id)
    slots = query.order_by(TimetableSlot.day_of_week.asc(), TimetableSlot.period_id.asc()).all()
    return [_slot_payload(slot) for slot in slots]


@router.post("/slots")
def create_slot(
    payload: TimetableSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    _validate_slot(payload, db)
    slot = TimetableSlot(
        day_of_week=payload.day_of_week.strip().title(),
        period_id=payload.period_id,
        class_id=payload.class_id,
        learning_area_id=payload.learning_area_id,
        teacher_user_id=payload.teacher_user_id,
        room_id=payload.room_id,
        requirement_id=payload.requirement_id,
        is_locked=payload.is_locked,
        notes=payload.notes.strip() if payload.notes else None,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return {"message": "Lesson added to timetable.", **_slot_payload(slot)}


@router.put("/slots/{slot_id}")
def update_slot(
    slot_id: int,
    payload: TimetableSlotCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    slot = db.query(TimetableSlot).filter(TimetableSlot.id == slot_id).first()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable slot not found.")
    _validate_slot(payload, db, slot_id=slot_id)
    slot.day_of_week = payload.day_of_week.strip().title()
    slot.period_id = payload.period_id
    slot.class_id = payload.class_id
    slot.learning_area_id = payload.learning_area_id
    slot.teacher_user_id = payload.teacher_user_id
    slot.room_id = payload.room_id
    slot.requirement_id = payload.requirement_id
    slot.is_locked = payload.is_locked
    slot.notes = payload.notes.strip() if payload.notes else None
    db.commit()
    db.refresh(slot)
    return {"message": "Timetable slot updated.", **_slot_payload(slot)}


@router.delete("/slots/{slot_id}")
def delete_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    slot = db.query(TimetableSlot).filter(TimetableSlot.id == slot_id).first()
    if slot is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Timetable slot not found.")
    db.delete(slot)
    db.commit()
    return {"message": "Lesson removed from timetable."}


@router.get("/check")
def check_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    checks = _timetable_checks(db)
    return {
        "ok": not any(check["severity"] == "error" for check in checks),
        "checks": checks,
    }


@router.post("/generate")
def generate_timetable(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    periods = db.query(TimetablePeriod).filter(TimetablePeriod.is_break.is_(False)).order_by(TimetablePeriod.sort_order.asc()).all()
    if not periods:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Create teaching periods before generating.")

    requirements = db.query(TimetableRequirement).order_by(TimetableRequirement.class_id.asc()).all()
    existing_slots = db.query(TimetableSlot).all()
    created: list[TimetableSlot] = []

    def is_free(day: str, period_id: int, requirement: TimetableRequirement) -> bool:
        for slot in existing_slots + created:
            if slot.day_of_week != day or slot.period_id != period_id:
                continue
            if slot.class_id == requirement.class_id or slot.teacher_user_id == requirement.teacher_user_id:
                return False
            room_id = requirement.preferred_room_id
            if room_id is not None and slot.room_id == room_id:
                return False
        return True

    for requirement in requirements:
        placed = [slot for slot in existing_slots if slot.requirement_id == requirement.id]
        missing_count = max(requirement.periods_per_week - len(placed), 0)
        daily_counts = {day: len([slot for slot in placed if slot.day_of_week == day]) for day in SCHOOL_DAYS}
        for _ in range(missing_count):
            placed_slot = None
            for day in SCHOOL_DAYS:
                if daily_counts.get(day, 0) >= requirement.max_periods_per_day:
                    continue
                for period in periods:
                    if is_free(day, period.id, requirement):
                        placed_slot = TimetableSlot(
                            day_of_week=day,
                            period_id=period.id,
                            class_id=requirement.class_id,
                            learning_area_id=requirement.learning_area_id,
                            teacher_user_id=requirement.teacher_user_id,
                            room_id=requirement.preferred_room_id,
                            requirement_id=requirement.id,
                            is_locked=False,
                            notes=requirement.notes,
                        )
                        db.add(placed_slot)
                        created.append(placed_slot)
                        daily_counts[day] = daily_counts.get(day, 0) + 1
                        break
                if placed_slot is not None:
                    break

    db.commit()
    for slot in created:
        db.refresh(slot)

    return {
        "message": f"Generated {len(created)} lesson card(s).",
        "created_count": len(created),
        "checks": _timetable_checks(db),
    }
