from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .api.router import api_router
from .config import settings
from .db import Base, engine, import_seed_sqlite_data, run_migrations
from .models import (
    Book,
    BookLoan,
    ClassResponsibility,
    ClassRoom,
    Exam,
    Learner,
    LearningArea,
    LoginSession,
    MarkEntry,
    ParentContact,
    ReportingRecord,
    SmsDeliveryLog,
    SmsBroadcast,
    SmsTemplate,
    StaffProfile,
    TeachingAssignment,
    User,
    WebsitePage,
)
from .schemas import HealthResponse

allowed_origins = list(
    dict.fromkeys(
        origin
        for origin in [
            settings.frontend_url.rstrip("/"),
            "http://localhost:5173",
            "http://127.0.0.1:5173",
        ]
        if origin
    )
)

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    import_seed_sqlite_data()
    run_migrations()


@app.get("/health", response_model=HealthResponse)
def health() -> HealthResponse:
    return HealthResponse(status="ok", service=settings.app_name)


app.include_router(api_router, prefix="/api")
