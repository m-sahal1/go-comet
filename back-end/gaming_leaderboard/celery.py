import os
from celery import Celery

# Set the default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'gaming_leaderboard.settings')

app = Celery('gaming_leaderboard')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
# - namespace='CELERY' means all celery-related configuration keys
#   should have a `CELERY_` prefix.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django apps.
app.autodiscover_tasks()

# Optional configuration
app.conf.update(
    task_track_started=True,
    task_serializer='json',
    result_serializer='json',
    accept_content=['json'],
    result_expires=3600,  # 1 hour
    timezone='UTC',
    enable_utc=True,
    worker_prefetch_multiplier=1,
    task_acks_late=True,
    worker_disable_rate_limits=False,
    task_compression='gzip',
    result_compression='gzip',
    # Windows-specific configuration
    worker_pool='solo',  # Use solo pool for Windows development
    worker_concurrency=1,  # Single worker process
)

# Windows-specific settings
import sys
if sys.platform == 'win32':
    app.conf.update(
        worker_pool='solo',
        worker_concurrency=1,
        worker_prefetch_multiplier=1,
        task_always_eager=False,  # Set to True for synchronous testing
    )

@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 