from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Learner, ParentContact, ReportingRecord, SmsDeliveryLog, User, UserRole, WebsitePage
from ..schemas import WebsitePageCreate
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/website", tags=["website"])


@router.get("/public/home")
def public_home(db: Session = Depends(get_db)):
    pages = (
        db.query(WebsitePage)
        .filter(WebsitePage.is_published.is_(True))
        .order_by(WebsitePage.updated_at.desc())
        .limit(6)
        .all()
    )
    return {
        "school_name": "Tumaini Academy",
        "message": "Public website home data loaded.",
        "pages": [{"slug": page.slug, "title": page.title} for page in pages],
    }


@router.get("/public/pages")
def public_pages(db: Session = Depends(get_db)):
    rows = (
        db.query(WebsitePage)
        .filter(WebsitePage.is_published.is_(True))
        .order_by(WebsitePage.updated_at.desc())
        .all()
    )
    return [
        {
            "id": row.id,
            "slug": row.slug,
            "title": row.title,
            "body": row.body,
            "updated_at": row.updated_at.isoformat(),
        }
        for row in rows
    ]


@router.post("/pages")
def create_page(
    payload: WebsitePageCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.HEAD_TEACHER)),
):
    existing = db.query(WebsitePage).filter(WebsitePage.slug == payload.slug.strip()).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A page with that slug already exists.")
    page = WebsitePage(
        slug=payload.slug.strip(),
        title=payload.title.strip(),
        body=payload.body.strip(),
        is_published=payload.is_published,
    )
    db.add(page)
    db.commit()
    db.refresh(page)
    return {"message": "Website page created.", "page_id": page.id}


@router.get("/pages")
def list_pages(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    rows = db.query(WebsitePage).order_by(WebsitePage.updated_at.desc()).all()
    return [
        {
            "id": row.id,
            "slug": row.slug,
            "title": row.title,
            "is_published": row.is_published,
            "updated_at": row.updated_at.isoformat(),
        }
        for row in rows
    ]


@router.get("/parent/learner-summary")
def parent_learner_summary(
    admission_no: str,
    phone_number: str,
    db: Session = Depends(get_db),
):
    learner = db.query(Learner).filter(Learner.admission_no == admission_no.strip()).first()
    if learner is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Learner not found.")

    parent = None
    if learner.parent_contact_id:
        parent = db.query(ParentContact).filter(ParentContact.id == learner.parent_contact_id).first()
    if parent is None or parent.phone_number.strip() != phone_number.strip():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Parent verification failed for this learner.",
        )

    reports = (
        db.query(ReportingRecord)
        .filter(ReportingRecord.learner_id == learner.id)
        .order_by(ReportingRecord.report_time.desc())
        .limit(10)
        .all()
    )
    messages = (
        db.query(SmsDeliveryLog)
        .filter(SmsDeliveryLog.phone_number == parent.phone_number)
        .order_by(SmsDeliveryLog.created_at.desc())
        .limit(20)
        .all()
    )
    return {
        "learner": {
            "admission_no": learner.admission_no,
            "full_name": learner.full_name,
            "class_id": learner.class_id,
            "boarding_status": learner.boarding_status,
        },
        "parent": {
            "full_name": parent.full_name,
            "phone_number": parent.phone_number,
        },
        "recent_reporting": [
            {
                "report_time": report.report_time.isoformat(),
                "accompanied_by": report.accompanied_by,
                "sms_status": report.sms_status,
            }
            for report in reports
        ],
        "recent_messages": [
            {
                "created_at": message.created_at.isoformat(),
                "message_body": message.message_body,
                "status": message.status,
            }
            for message in messages
        ],
    }
