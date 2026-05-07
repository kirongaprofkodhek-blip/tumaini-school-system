from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class HealthResponse(BaseModel):
    status: str
    service: str


class AdminBootstrapRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    full_name: str


class CurrentUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    role: str


class UserCreateRequest(BaseModel):
    full_name: str
    email: EmailStr
    password: str = Field(min_length=8)
    role: str


class UserUpdateRequest(BaseModel):
    full_name: str
    email: EmailStr
    role: str
    is_active: bool = True
    password: str | None = Field(default=None, min_length=8)


class ArrivalReportCreate(BaseModel):
    learner_id: int | None = None
    admission_no: str | None = None
    accompanied_source: str = "parent"
    accompanied_by: str | None = None
    accompanied_phone: str | None = None
    arrival_transport_mode: str | None = None
    send_sms: bool = True


class LearnerCreateRequest(BaseModel):
    admission_no: str
    full_name: str
    class_id: int
    parent_full_name: str
    parent_phone_number: str
    boarding_status: str = "Day Scholar"
    transport_mode: str | None = None


class LearnerUpdateRequest(BaseModel):
    admission_no: str
    full_name: str
    class_id: int
    parent_full_name: str
    parent_phone_number: str
    boarding_status: str = "Day Scholar"
    transport_mode: str | None = None


class LearningAreaCreate(BaseModel):
    class_id: int
    name: str
    min_marks: float = 0
    max_marks: float = 100
    cbc_formula: str = ""


class ClassCreateRequest(BaseModel):
    name: str
    stream: str | None = None


class ClassUpdateRequest(BaseModel):
    name: str
    stream: str | None = None


class ClassSplitRequest(BaseModel):
    first_class_name: str
    second_class_name: str
    first_class_learner_ids: list[int] = []
    second_class_learner_ids: list[int] = []


class TeachingAssignmentCreate(BaseModel):
    teacher_user_id: int
    class_id: int
    learning_area_id: int
    is_class_teacher: bool = False


class TeachingAssignmentUpdate(BaseModel):
    teacher_user_id: int
    class_id: int
    learning_area_id: int
    is_class_teacher: bool = False


class ClassResponsibilityCreate(BaseModel):
    teacher_user_id: int
    class_id: int


class ExamCreate(BaseModel):
    name: str
    exam_type: str = "Midterm"
    exam_month: str | None = None
    term: str
    year: int
    marks_deadline: datetime | None = None
    class_id: int
    learning_area_id: int


class ExamBatchCreate(BaseModel):
    name: str
    exam_type: str = "Midterm"
    exam_month: str | None = None
    term: str
    year: int
    marks_deadline: datetime | None = None
    class_ids: list[int]
    learning_area_name: str = ""
    learning_area_names: list[str] = []
    learning_area_scope: str = "specific"
    max_marks: float = 100
    min_marks: float = 0
    cbc_formula: str = "80:EE,65:ME,50:AE,0:BE"


class MarkEntryCreate(BaseModel):
    exam_id: int
    learner_id: int
    marks: float


class MeritListRequest(BaseModel):
    class_id: int
    exam_id: int
    learning_area_id: int | None = None


class ExamStatusUpdate(BaseModel):
    action: str


class SmsBroadcastCreate(BaseModel):
    audience_filter: str
    message_body: str
    template_id: int | None = None


class SmsTemplateCreate(BaseModel):
    name: str
    scope: str = "admin"
    message_body: str


class ClassMessageCreate(BaseModel):
    class_id: int
    message_body: str


class BookCreate(BaseModel):
    accession_no: str
    title: str
    author: str | None = None
    category: str | None = None
    total_copies: int = 1


class BookLoanCreate(BaseModel):
    book_id: int
    learner_id: int | None = None
    teacher_user_id: int | None = None
    class_id: int | None = None
    due_at: datetime | None = None


class WebsitePageCreate(BaseModel):
    slug: str
    title: str
    body: str
    is_published: bool = False
