from celery import Celery
from app.config import settings

celery_app = Celery(
    "spk_ag_worker",
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND,
    include=["app.tasks"]
)

celery_app.conf.update(
    task_serializer="json",
    accept_content=["json"],
    result_serializer="json",
    timezone="Asia/Jakarta",
    enable_utc=True,
    task_time_limit=settings.CELERY_TASK_TIME_LIMIT,
    task_track_started=True,
    broker_connection_timeout=0.2,
    broker_connection_retry=False,
    broker_connection_max_retries=0,
)
