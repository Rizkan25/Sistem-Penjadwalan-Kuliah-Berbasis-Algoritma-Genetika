from app.api.master import router as master_router
from app.api.schedules import router as schedules_router
from app.api.conflicts import router as conflicts_router

__all__ = ["master_router", "schedules_router", "conflicts_router"]
