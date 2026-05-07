from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import (
    ClassResponsibility,
    Learner,
    ParentContact,
    SmsBroadcast,
    SmsDeliveryLog,
    SmsTemplate,
    TeachingAssignment,
    User,
    UserRole,
    is_teacher_role,
)
from ..schemas import ClassMessageCreate, SmsBroadcastCreate, SmsTemplateCreate
from ..security import get_current_user, require_roles
from ..services.sms import SmsService

router = APIRouter(prefix="/messaging", tags=["messaging"])
sms_service = SmsService()


def _delivery_entry(
    phone_number: str,
    message_body: str,
    audience_type: str,
    created_by_user_id: int,
) -> tuple[str, str]:
    result = sms_service.send(phone_number=phone_number, message_body=message_body)
    return result.provider, "sent" if result.success else "failed"


def _resolve_audience(db: Session, audience_filter: str, class_id: int | None = None) -> list[tuple[str, str]]:
    query = (
        db.query(Learner, ParentContact)
        .join(ParentContact, ParentContact.id == Learner.parent_contact_id)
    )
    key = audience_filter.strip().lower()

    if key == "boarding":
        query = query.filter(Learner.boarding_status.ilike("%board%"))
    elif key == "day_scholars":
        query = query.filter(Learner.boarding_status.ilike("%day%"))
    elif key == "whole_school":
        pass
    elif key == "class":
        if class_id is None:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="class_id is required for class filter.")
        query = query.filter(Learner.class_id == class_id)
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported audience filter. Use boarding, day_scholars, whole_school, or class.",
        )

    rows = query.all()
    # Deduplicate by phone number.
    seen: set[str] = set()
    recipients: list[tuple[str, str]] = []
    for learner, parent in rows:
        phone = (parent.phone_number or "").strip()
        if not phone or phone in seen:
            continue
        seen.add(phone)
        recipients.append((phone, parent.full_name))
    return recipients


@router.post("/templates")
def create_template(
    payload: SmsTemplateCreate,
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
    template = SmsTemplate(
        name=payload.name.strip(),
        scope=payload.scope.strip(),
        message_body=payload.message_body.strip(),
    )
    db.add(template)
    db.commit()
    db.refresh(template)
    return {"message": "SMS template created.", "template_id": template.id}


@router.get("/templates")
def list_templates(
    scope: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(SmsTemplate)
    if scope:
        query = query.filter(SmsTemplate.scope == scope.strip())
    templates = query.order_by(SmsTemplate.name.asc()).all()
    return [
        {
            "id": template.id,
            "name": template.name,
            "scope": template.scope,
            "message_body": template.message_body,
        }
        for template in templates
    ]


@router.post("/broadcasts")
def create_broadcast(
    payload: SmsBroadcastCreate,
    class_id: int | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    message_body = payload.message_body.strip()
    if payload.template_id is not None:
        template = db.query(SmsTemplate).filter(SmsTemplate.id == payload.template_id).first()
        if template is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="SMS template not found.")
        message_body = template.message_body

    recipients = _resolve_audience(db, payload.audience_filter, class_id=class_id)
    broadcast = SmsBroadcast(
        created_by_user_id=current_user.id,
        audience_filter=payload.audience_filter.strip(),
        message_body=message_body,
        status="queued",
    )
    db.add(broadcast)
    db.flush()

    sent_count = 0
    for phone_number, _name in recipients:
        provider, send_status = _delivery_entry(phone_number, message_body, "broadcast", current_user.id)
        db.add(
            SmsDeliveryLog(
                phone_number=phone_number,
                audience_type="broadcast",
                message_body=message_body,
                provider=provider,
                status=send_status,
                created_by_user_id=current_user.id,
            )
        )
        if send_status == "sent":
            sent_count += 1

    broadcast.status = "sent" if recipients else "empty"
    db.commit()
    db.refresh(broadcast)
    return {
        "message": "Broadcast processed.",
        "broadcast_id": broadcast.id,
        "audience_filter": broadcast.audience_filter,
        "recipient_count": len(recipients),
        "sent_count": sent_count,
    }


@router.post("/class-teacher")
def send_class_teacher_message(
    payload: ClassMessageCreate,
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
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        if not is_teacher_role(current_user.role):
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only teachers can send class messages.")
        assignment = (
            db.query(ClassResponsibility)
            .filter(
                ClassResponsibility.teacher_user_id == current_user.id,
                ClassResponsibility.class_id == payload.class_id,
            )
            .first()
        )
        if assignment is None:
            assignment = (
                db.query(TeachingAssignment)
                .filter(
                    TeachingAssignment.teacher_user_id == current_user.id,
                    TeachingAssignment.class_id == payload.class_id,
                    TeachingAssignment.is_class_teacher.is_(True),
                )
                .first()
            )
        if assignment is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You do not have class responsibility for this class.",
            )

    recipients = _resolve_audience(db, "class", class_id=payload.class_id)
    sent_count = 0
    for phone_number, _name in recipients:
        provider, send_status = _delivery_entry(phone_number, payload.message_body.strip(), "class_message", current_user.id)
        db.add(
            SmsDeliveryLog(
                phone_number=phone_number,
                audience_type="class_message",
                message_body=payload.message_body.strip(),
                provider=provider,
                status=send_status,
                created_by_user_id=current_user.id,
            )
        )
        if send_status == "sent":
            sent_count += 1
    db.commit()
    return {
        "message": "Class message processed.",
        "class_id": payload.class_id,
        "recipient_count": len(recipients),
        "sent_count": sent_count,
    }


@router.get("/delivery-logs")
def delivery_logs(
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(SmsDeliveryLog).order_by(SmsDeliveryLog.created_at.desc()).limit(limit).all()
    return [
        {
            "id": row.id,
            "phone_number": row.phone_number,
            "audience_type": row.audience_type,
            "message_body": row.message_body,
            "provider": row.provider,
            "status": row.status,
            "created_at": row.created_at.isoformat(),
        }
        for row in rows
    ]
