from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import Book, BookLoan, User, UserRole
from ..schemas import BookCreate, BookLoanCreate
from ..security import get_current_user, require_roles

router = APIRouter(prefix="/library", tags=["library"])


@router.post("/books")
def add_book(
    payload: BookCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LIBRARIAN)),
):
    existing = db.query(Book).filter(Book.accession_no == payload.accession_no.strip()).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A book with that accession number already exists.")

    copies = max(payload.total_copies, 1)
    book = Book(
        accession_no=payload.accession_no.strip(),
        title=payload.title.strip(),
        author=None if payload.author is None else payload.author.strip(),
        category=None if payload.category is None else payload.category.strip(),
        total_copies=copies,
        available_copies=copies,
    )
    db.add(book)
    db.commit()
    db.refresh(book)
    return {
        "message": "Book added to registry.",
        "book_id": book.id,
        "accession_no": book.accession_no,
    }


@router.get("/books")
def list_books(
    search: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Book)
    if search:
        wildcard = f"%{search.strip()}%"
        query = query.filter((Book.title.ilike(wildcard)) | (Book.accession_no.ilike(wildcard)))
    books = query.order_by(Book.title.asc()).all()
    return [
        {
            "id": book.id,
            "accession_no": book.accession_no,
            "title": book.title,
            "author": book.author,
            "category": book.category,
            "total_copies": book.total_copies,
            "available_copies": book.available_copies,
        }
        for book in books
    ]


@router.post("/loans")
def issue_book(
    payload: BookLoanCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LIBRARIAN)),
):
    book = db.query(Book).filter(Book.id == payload.book_id).first()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found.")
    if book.available_copies <= 0:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No available copies left.")
    if not any([payload.learner_id, payload.teacher_user_id, payload.class_id]):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Loan must be assigned to a learner, teacher, or class.",
        )

    loan = BookLoan(
        book_id=payload.book_id,
        learner_id=payload.learner_id,
        teacher_user_id=payload.teacher_user_id,
        class_id=payload.class_id,
        due_at=payload.due_at,
    )
    db.add(loan)
    book.available_copies -= 1
    db.commit()
    db.refresh(loan)
    return {"message": "Book issued successfully.", "loan_id": loan.id, "available_copies": book.available_copies}


@router.post("/loans/{loan_id}/return")
def return_book(
    loan_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LIBRARIAN)),
):
    loan = db.query(BookLoan).filter(BookLoan.id == loan_id).first()
    if loan is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Loan not found.")
    if loan.returned_at is not None:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="This loan has already been returned.")

    book = db.query(Book).filter(Book.id == loan.book_id).first()
    if book is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Linked book not found.")

    loan.returned_at = datetime.utcnow()
    book.available_copies += 1
    db.commit()
    return {"message": "Book returned successfully.", "loan_id": loan.id, "available_copies": book.available_copies}


@router.get("/loans")
def list_loans(
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(BookLoan)
    if active_only:
        query = query.filter(BookLoan.returned_at.is_(None))
    loans = query.order_by(BookLoan.issued_at.desc()).all()
    return [
        {
            "id": loan.id,
            "book_id": loan.book_id,
            "learner_id": loan.learner_id,
            "teacher_user_id": loan.teacher_user_id,
            "class_id": loan.class_id,
            "issued_at": loan.issued_at.isoformat(),
            "due_at": None if loan.due_at is None else loan.due_at.isoformat(),
            "returned_at": None if loan.returned_at is None else loan.returned_at.isoformat(),
        }
        for loan in loans
    ]


@router.get("/loans/overdue")
def overdue_loans(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.ADMIN, UserRole.LIBRARIAN)),
):
    now = datetime.utcnow()
    rows = (
        db.query(BookLoan)
        .filter(BookLoan.returned_at.is_(None), BookLoan.due_at.is_not(None), BookLoan.due_at < now)
        .order_by(BookLoan.due_at.asc())
        .all()
    )
    return [
        {
            "id": loan.id,
            "book_id": loan.book_id,
            "learner_id": loan.learner_id,
            "teacher_user_id": loan.teacher_user_id,
            "class_id": loan.class_id,
            "due_at": loan.due_at.isoformat() if loan.due_at else None,
        }
        for loan in rows
    ]
