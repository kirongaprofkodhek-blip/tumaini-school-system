from fastapi import APIRouter

from . import academics, auth, library, messaging, reporting, website

api_router = APIRouter()
api_router.include_router(auth.router)
api_router.include_router(reporting.router)
api_router.include_router(academics.router)
api_router.include_router(messaging.router)
api_router.include_router(library.router)
api_router.include_router(website.router)
