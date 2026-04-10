from fastapi import APIRouter

from .routes import router as career_router

router = APIRouter()
router.include_router(career_router, prefix="/career", tags=["career"])
