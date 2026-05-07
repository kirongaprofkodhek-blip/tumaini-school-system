from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    ClassRoom,
    Learner,
    ParentContact,
    ReportingRecord,
    SmsDeliveryLog,
    ClassResponsibility,
    TeachingAssignment,
    User,
    UserRole,
    is_teacher_role,
)
from ..schemas import ArrivalReportCreate, LearnerCreateRequest, LearnerUpdateRequest
from ..security import get_current_user, require_roles
from ..services.sms import SmsService

router = APIRouter(prefix="/reporting", tags=["reporting"])
sms_service = SmsService()


@router.post("/arrivals")
def report_arrival(
    payload: ArrivalReportCreate,
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
    learner = None
    if payload.learner_id is not None:
        learner = db.query(Learner).filter(Learner.id == payload.learner_id).first()
    elif payload.admission_no:
        learner = db.query(Learner).filter(Learner.admission_no == payload.admission_no.strip()).first()

    if learner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found.")

    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        if not is_teacher_role(current_user.role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can report learner arrivals.")
        class_assignment = (
            db.query(ClassResponsibility)
            .filter(
                ClassResponsibility.teacher_user_id == current_user.id,
                ClassResponsibility.class_id == learner.class_id,
            )
            .first()
        )
        if class_assignment is None:
            class_assignment = (
                db.query(TeachingAssignment)
                .filter(
                    TeachingAssignment.teacher_user_id == current_user.id,
                    TeachingAssignment.class_id == learner.class_id,
                    TeachingAssignment.is_class_teacher.is_(True),
                )
                .first()
            )
        if class_assignment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have class responsibility for this learner's class.",
            )

    parent = None
    if learner.parent_contact_id:
        parent = db.query(ParentContact).filter(ParentContact.id == learner.parent_contact_id).first()

    accompanied_source = payload.accompanied_source.strip().lower()
    if accompanied_source not in {"parent", "other_person"}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Accompanied source must be parent or other_person.",
        )

    if accompanied_source == "parent":
        if parent is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This learner has no registered parent contact. Register the learner fully first.",
            )
        accompanied_by = parent.full_name.strip()
        accompanied_phone = (parent.phone_number or "").strip() or None
    else:
        if payload.accompanied_by is None or not payload.accompanied_by.strip():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Enter the name of the person who accompanied the learner.",
            )
        accompanied_by = payload.accompanied_by.strip()
        accompanied_phone = None if payload.accompanied_phone is None else payload.accompanied_phone.strip() or None

    class_room = db.query(ClassRoom).filter(ClassRoom.id == learner.class_id).first()
    class_name = class_room.name if class_room is not None else f"Class {learner.class_id}"
    is_boarder = "board" in learner.boarding_status.lower()

    arrival_transport_mode = None
    if not is_boarder:
        allowed_transport_modes = {"school bus", "bicycle", "walking"}
        transport_mode = (payload.arrival_transport_mode or "").strip()
        if transport_mode.lower() not in allowed_transport_modes:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Day scholars must specify School Bus, Bicycle, or Walking.",
            )
        arrival_transport_mode = transport_mode

    reporting_record = ReportingRecord(
        learner_id=learner.id,
        report_time=datetime.utcnow(),
        accompanied_source=accompanied_source,
        accompanied_by=accompanied_by,
        accompanied_phone=accompanied_phone,
        arrival_transport_mode=arrival_transport_mode,
        learner_boarding_status=learner.boarding_status,
        class_name_snapshot=class_name,
        sms_status="skipped",
    )
    db.add(reporting_record)

    sms_result = None
    if payload.send_sms and parent and parent.phone_number:
        transport_text = ""
        if arrival_transport_mode:
            transport_text = f" Arrival mode: {arrival_transport_mode}."
        message_body = (
            f"Dear {parent.full_name}, {learner.full_name} of admission number {learner.admission_no} "
            f"from {class_name} has been reported at school successfully at "
            f"{reporting_record.report_time.strftime('%H:%M')}. Accompanied by {accompanied_by}. "
            f"Status: {learner.boarding_status}.{transport_text}"
        )
        sms_result = sms_service.send(phone_number=parent.phone_number, message_body=message_body)
        reporting_record.sms_status = "sent" if sms_result.success else "failed"
        db.add(
            SmsDeliveryLog(
                phone_number=parent.phone_number,
                audience_type="parent",
                message_body=message_body,
                provider=sms_result.provider,
                status="sent" if sms_result.success else "failed",
                created_by_user_id=current_user.id,
            )
        )
    elif payload.send_sms:
        reporting_record.sms_status = "missing-parent-phone"

    db.commit()
    db.refresh(reporting_record)

    return {
        "message": "Learner arrival recorded successfully.",
        "report_id": reporting_record.id,
        "learner": learner.full_name,
        "admission_no": learner.admission_no,
        "class_name": class_name,
        "boarding_status": learner.boarding_status,
        "accompanied_source": accompanied_source,
        "accompanied_by": accompanied_by,
        "arrival_transport_mode": arrival_transport_mode,
        "sms_status": reporting_record.sms_status,
        "sms_provider_message": None if sms_result is None else sms_result.message,
    }


@router.post("/learners")
def create_learner(
    payload: LearnerCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    existing = db.query(Learner).filter(Learner.admission_no == payload.admission_no.strip()).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists.")

    parent = ParentContact(
        full_name=payload.parent_full_name.strip(),
        phone_number=payload.parent_phone_number.strip(),
        relationship="Parent",
    )
    db.add(parent)
    db.flush()

    learner = Learner(
        admission_no=payload.admission_no.strip(),
        full_name=payload.full_name.strip(),
        class_id=payload.class_id,
        parent_contact_id=parent.id,
        boarding_status=payload.boarding_status.strip(),
        transport_mode=(
            "N/A"
            if "board" in payload.boarding_status.strip().lower()
            else ((payload.transport_mode or "").strip() or "Not Set")
        ),
    )
    db.add(learner)
    db.commit()
    db.refresh(learner)
    return {
        "message": "Learner created successfully.",
        "learner_id": learner.id,
        "admission_no": learner.admission_no,
        "full_name": learner.full_name,
    }


@router.put("/learners/{learner_id}")
def update_learner(
    learner_id: int,
    payload: LearnerUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    learner = db.query(Learner).filter(Learner.id == learner_id).first()
    if learner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found.")

    admission_no = payload.admission_no.strip()
    duplicate = db.query(Learner).filter(Learner.admission_no == admission_no, Learner.id != learner_id).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Admission number already exists.")

    class_room = db.query(ClassRoom).filter(ClassRoom.id == payload.class_id).first()
    if class_room is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Class not found.")

    parent = None
    if learner.parent_contact_id:
        parent = db.query(ParentContact).filter(ParentContact.id == learner.parent_contact_id).first()
    if parent is None:
        parent = ParentContact(full_name="", phone_number="", relationship="Parent")
        db.add(parent)
        db.flush()
        learner.parent_contact_id = parent.id

    parent.full_name = payload.parent_full_name.strip()
    parent.phone_number = payload.parent_phone_number.strip()
    parent.relationship = "Parent"

    learner.admission_no = admission_no
    learner.full_name = payload.full_name.strip()
    learner.class_id = payload.class_id
    learner.boarding_status = payload.boarding_status.strip()
    learner.transport_mode = (
        "N/A"
        if "board" in learner.boarding_status.lower()
        else ((payload.transport_mode or "").strip() or "Not Set")
    )

    db.commit()
    db.refresh(learner)
    return {
        "message": "Learner updated successfully.",
        "learner_id": learner.id,
        "admission_no": learner.admission_no,
        "full_name": learner.full_name,
    }


@router.get("/learners")
def list_learners(
    class_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Learner, ParentContact, ClassRoom).outerjoin(
        ParentContact,
        ParentContact.id == Learner.parent_contact_id,
    ).outerjoin(
        ClassRoom,
        ClassRoom.id == Learner.class_id,
    )
    if class_id is not None:
        query = query.filter(Learner.class_id == class_id)
    learners = query.order_by(Learner.full_name.asc()).all()
    return [
        {
            "id": learner.id,
            "admission_no": learner.admission_no,
            "full_name": learner.full_name,
            "class_id": learner.class_id,
            "class_name": None if class_room is None else class_room.name,
            "boarding_status": learner.boarding_status,
            "transport_mode": learner.transport_mode,
            "parent_contact_id": learner.parent_contact_id,
            "parent_full_name": None if parent is None else parent.full_name,
            "parent_phone_number": None if parent is None else parent.phone_number,
        }
        for learner, parent, class_room in learners
    ]


@router.get("/arrivals/recent")
def recent_arrivals(
    limit: int = 20,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = (
        db.query(ReportingRecord, Learner)
        .join(Learner, Learner.id == ReportingRecord.learner_id)
        .order_by(ReportingRecord.report_time.desc())
        .limit(limit)
        .all()
    )
    return [
        {
            "report_id": record.id,
            "admission_no": learner.admission_no,
            "learner_name": learner.full_name,
            "class_name": record.class_name_snapshot or (learner.class_room.name if learner.class_room else None),
            "boarding_status": record.learner_boarding_status or learner.boarding_status,
            "accompanied_source": record.accompanied_source,
            "report_time": record.report_time.isoformat(),
            "accompanied_by": record.accompanied_by,
            "accompanied_phone": record.accompanied_phone,
            "arrival_transport_mode": record.arrival_transport_mode,
            "sms_status": record.sms_status,
        }
        for record, learner in rows
    ]


@router.get("/lists/class")
def download_class_list(
    class_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learners = (
        db.query(Learner)
        .filter(Learner.class_id == class_id)
        .order_by(Learner.full_name.asc())
        .all()
    )
    return {
        "class_id": class_id,
        "total": len(learners),
        "items": [
            {
                "admission_no": learner.admission_no,
                "full_name": learner.full_name,
                "boarding_status": learner.boarding_status,
                "transport_mode": learner.transport_mode,
            }
            for learner in learners
        ],
    }


@router.get("/lists/boarders")
def download_boarders_list(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    learners = (
        db.query(Learner)
        .filter(Learner.boarding_status.ilike("%board%"))
        .order_by(Learner.full_name.asc())
        .all()
    )
    return {
        "total": len(learners),
        "items": [
            {
                "admission_no": learner.admission_no,
                "full_name": learner.full_name,
                "class_id": learner.class_id,
            }
            for learner in learners
        ],
    }
