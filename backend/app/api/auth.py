from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..db import get_db
from ..models import ClassRoom, User, UserRole, is_teacher_role, public_role_value
from ..schemas import AdminBootstrapRequest, CurrentUserResponse, LoginRequest, LoginResponse, UserCreateRequest, UserUpdateRequest
from ..security import create_session, get_current_user, hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/bootstrap-admin", response_model=CurrentUserResponse)
def bootstrap_admin(payload: AdminBootstrapRequest, db: Session = Depends(get_db)):
    existing_admin = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if existing_admin is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An admin account already exists. Use normal login instead.",
        )

    admin = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=UserRole.ADMIN,
        is_active=True,
    )
    db.add(admin)

    # Seed a few classes so the first admin session has a working starting point.
    if db.query(ClassRoom).count() == 0:
        for class_name in [
            "PRE PRIMARY ONE",
            "PRE PRIMARY TWO",
            "GRADE 1",
            "GRADE 2",
            "GRADE 3",
            "GRADE 4",
            "GRADE 5",
            "GRADE 6",
            "GRADE 7",
            "GRADE 8",
            "GRADE 9",
            "GRADE 10",
        ]:
            db.add(ClassRoom(name=class_name))

    db.commit()
    db.refresh(admin)
    return CurrentUserResponse(id=admin.id, full_name=admin.full_name, email=admin.email, role=public_role_value(admin.role))


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid email or password.")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="This account is inactive.")

    session = create_session(user, db)
    return LoginResponse(access_token=session.token, role=public_role_value(user.role), full_name=user.full_name)


@router.get("/me", response_model=CurrentUserResponse)
def me(current_user: User = Depends(get_current_user)):
    return CurrentUserResponse(
        id=current_user.id,
        full_name=current_user.full_name,
        email=current_user.email,
        role=public_role_value(current_user.role),
    )


@router.post("/users", response_model=CurrentUserResponse)
def create_user(
    payload: UserCreateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can create user accounts.")

    try:
        role = UserRole(payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role supplied.") from exc
    if is_teacher_role(role):
        role = UserRole.TEACHER

    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with that email already exists.")

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role=role,
        is_active=True,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return CurrentUserResponse(id=user.id, full_name=user.full_name, email=user.email, role=public_role_value(user.role))


@router.get("/users")
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can view the user list.")
    users = db.query(User).order_by(User.full_name.asc()).all()
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": public_role_value(user.role),
            "is_active": user.is_active,
        }
        for user in users
    ]


@router.put("/users/{user_id}", response_model=CurrentUserResponse)
def update_user(
    user_id: int,
    payload: UserUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role not in {UserRole.ADMIN, UserRole.HEAD_TEACHER}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only admin can update user accounts.")

    user = db.query(User).filter(User.id == user_id).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    try:
        role = UserRole(payload.role)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid role supplied.") from exc
    if is_teacher_role(role):
        role = UserRole.TEACHER

    email = payload.email.lower()
    duplicate = db.query(User).filter(User.email == email, User.id != user_id).first()
    if duplicate is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="A user with that email already exists.")

    user.full_name = payload.full_name.strip()
    user.email = email
    user.role = role
    user.is_active = payload.is_active
    if payload.password:
        user.password_hash = hash_password(payload.password)

    db.commit()
    db.refresh(user)
    return CurrentUserResponse(id=user.id, full_name=user.full_name, email=user.email, role=public_role_value(user.role))


@router.get("/directory")
def user_directory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    users = db.query(User).filter(User.is_active.is_(True)).order_by(User.full_name.asc()).all()
    return [
        {
            "id": user.id,
            "full_name": user.full_name,
            "email": user.email,
            "role": public_role_value(user.role),
        }
        for user in users
    ]
