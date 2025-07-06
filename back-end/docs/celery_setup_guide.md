# Celery Setup and Usage Guide

## Overview
This guide covers setting up and running Celery for the gaming leaderboard system, with special attention to Windows-specific issues and solutions.

## Prerequisites

### 1. Redis Server
Celery requires Redis as a message broker. Install and run Redis:

#### Windows:
```bash
# Download Redis from https://github.com/microsoftarchive/redis/releases
# Or use Windows Subsystem for Linux (WSL)
# Or use Docker:
docker run -d -p 6379:6379 redis:alpine
```

#### Linux/macOS:
```bash
# Ubuntu/Debian
sudo apt-get install redis-server
redis-server

# macOS with Homebrew
brew install redis
brew services start redis
```

### 2. Python Dependencies
```bash
pip install celery redis django-redis
```

## Running Celery

### Development (Windows)
Due to Windows multiprocessing limitations, use the solo pool:

```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start Celery Worker (Windows)
celery -A gaming_leaderboard worker --pool=solo --loglevel=info

# Terminal 3: Start Celery Beat (for periodic tasks)
celery -A gaming_leaderboard beat --loglevel=info

# Terminal 4: Start Django development server
python manage.py runserver
```

### Production (Linux)
```bash
# Start Celery Worker with multiple processes
celery -A gaming_leaderboard worker --loglevel=info --concurrency=4

# Start Celery Beat
celery -A gaming_leaderboard beat --loglevel=info

# Optional: Use Celery Flower for monitoring
celery -A gaming_leaderboard flower
```

## Windows-Specific Issues and Solutions

### Issue 1: Permission Errors
**Error**: `PermissionError: [WinError 5] Access is denied`

**Solution**: Use the solo pool worker:
```bash
celery -A gaming_leaderboard worker --pool=solo --loglevel=info
```

### Issue 2: Multiprocessing Problems
**Error**: Various multiprocessing-related errors

**Solutions**:
1. Use solo pool (single process)
2. Set `CELERY_TASK_ALWAYS_EAGER=True` for synchronous execution during development
3. Use Windows Subsystem for Linux (WSL) for better compatibility

### Issue 3: Redis Connection Issues
**Error**: `ConnectionError: Error connecting to Redis`

**Solutions**:
1. Ensure Redis is running: `redis-cli ping` should return "PONG"
2. Check Redis URL in settings: `CELERY_BROKER_URL = 'redis://localhost:6379/0'`
3. Use Docker for Redis if native installation fails

## Configuration Options

### Development Settings (gaming_leaderboard/settings.py)
```python
# For Windows development
if sys.platform == 'win32':
    CELERY_TASK_ALWAYS_EAGER = True  # Run tasks synchronously
    CELERY_TASK_EAGER_PROPAGATES = True
    CELERY_WORKER_POOL = 'solo'
    CELERY_WORKER_CONCURRENCY = 1
```

### Production Settings
```python
# For Linux production
CELERY_WORKER_POOL = 'prefork'
CELERY_WORKER_CONCURRENCY = 4
CELERY_TASK_ALWAYS_EAGER = False
```

## Available Tasks

### Periodic Tasks (Auto-scheduled)
- **`update_all_ranks`**: Updates all leaderboard ranks (every 5 minutes)
- **`cache_top_leaderboard`**: Refreshes leaderboard cache (every minute)
- **`cleanup_old_game_sessions`**: Removes old sessions (every hour)

### Manual Tasks
- **`update_user_rank`**: Updates specific user's rank
- **`calculate_game_mode_stats`**: Calculates game mode statistics
- **`send_rank_notification`**: Sends rank change notifications
- **`generate_leaderboard_report`**: Generates daily reports

## Testing Tasks

### 1. Test Basic Connectivity
```python
# Django shell
python manage.py shell

from leaderboard.tasks import update_user_rank
result = update_user_rank.delay(1)  # Replace 1 with actual user ID
print(result.get())  # Wait for result
```

### 2. Test Periodic Tasks
```bash
# Check if Beat is scheduling tasks
celery -A gaming_leaderboard inspect scheduled
```

### 3. Monitor Tasks
```bash
# Use our custom monitoring command
python manage.py celery_monitor --stats --active

# Or use Celery's built-in monitoring
celery -A gaming_leaderboard events
```

## Monitoring and Debugging

### 1. Task Status
```bash
# Check active tasks
celery -A gaming_leaderboard inspect active

# Check worker statistics
celery -A gaming_leaderboard inspect stats

# Check scheduled tasks
celery -A gaming_leaderboard inspect scheduled
```

### 2. Logs
Tasks log to both console and `debug.log` file. Check logs for:
- Task execution times
- Error messages
- Task completion status

### 3. Redis Monitoring
```bash
# Connect to Redis CLI
redis-cli

# Monitor Redis commands
MONITOR

# Check queue lengths
LLEN celery
LLEN leaderboard
LLEN cache
LLEN maintenance
```

## API Integration

### 1. Cached Endpoints
- `GET /api/v1/leaderboard/top/` - Uses cached data when available
- `GET /api/v1/leaderboard/stats/modes/` - Returns cached statistics

### 2. Background Processing
- Score submission triggers `update_user_rank` task
- Cache misses trigger background cache refresh

### 3. Admin Endpoints
- `POST /api/v1/leaderboard/admin/update-ranks/` - Manually trigger rank updates

## Troubleshooting

### Common Issues

#### 1. Tasks Not Executing
**Check**:
- Redis is running
- Celery worker is running
- No errors in worker logs
- Task is properly imported

#### 2. Slow Task Execution
**Solutions**:
- Check database indexes
- Monitor Redis memory usage
- Increase worker concurrency (Linux only)
- Optimize task code

#### 3. Memory Issues
**Solutions**:
- Reduce worker concurrency
- Implement task result expiration
- Use task routing to separate heavy tasks

### Debug Commands
```bash
# Test Redis connection
python -c "import redis; r=redis.Redis(); print(r.ping())"

# Test Celery configuration
python -c "from gaming_leaderboard.celery import app; print(app.conf)"

# List available tasks
celery -A gaming_leaderboard inspect registered

# Purge all tasks
celery -A gaming_leaderboard purge
```

## Production Deployment

### 1. Process Management
Use a process manager like Supervisor or systemd:

```ini
# /etc/supervisor/conf.d/celery.conf
[program:celery]
command=celery -A gaming_leaderboard worker --loglevel=info
directory=/path/to/project
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery/worker.log

[program:celerybeat]
command=celery -A gaming_leaderboard beat --loglevel=info
directory=/path/to/project
user=www-data
autostart=true
autorestart=true
redirect_stderr=true
stdout_logfile=/var/log/celery/beat.log
```

### 2. Environment Variables
```bash
export REDIS_URL=redis://localhost:6379/0
export DJANGO_SETTINGS_MODULE=gaming_leaderboard.settings.production
```

### 3. Monitoring
- Use Flower for web-based monitoring
- Set up alerts for failed tasks
- Monitor Redis memory usage
- Track task execution times

## Performance Tips

1. **Use appropriate task routing** - Separate queues for different task types
2. **Implement result expiration** - Prevent result backend bloat
3. **Monitor task execution times** - Optimize slow tasks
4. **Use bulk operations** - Process multiple items in single tasks
5. **Implement proper error handling** - Use retries with exponential backoff

## Security Considerations

1. **Redis Security** - Use authentication and network restrictions
2. **Task Validation** - Validate all task inputs
3. **Resource Limits** - Set memory and time limits for tasks
4. **Access Control** - Restrict admin task triggers to authorized users

This guide should help you get Celery running smoothly in both development and production environments! 