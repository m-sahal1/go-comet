# Gaming Leaderboard System Troubleshooting Guide

## Overview
This guide provides solutions to common issues encountered when running the Gaming Leaderboard System. Issues are categorized by component and include symptoms, causes, and step-by-step solutions.

## Quick Diagnostic Commands

### System Health Check
```bash
# Check if Django development server is running
curl -f http://localhost:8000/

# Check database connectivity
python manage.py dbshell

# Check Redis connectivity
redis-cli ping

# Check Celery workers
celery -A gaming_leaderboard inspect active

# Check if all processes are running
ps aux | grep -E "(python|redis|celery)"
```

### Log File Locations (Development)
```bash
# Application logs (console output)
# Check the terminal running: python manage.py runserver

# Celery logs (console output)
# Check the terminal running: celery -A gaming_leaderboard worker --loglevel=info

# Celery Beat logs (console output)
# Check the terminal running: celery -A gaming_leaderboard beat --loglevel=info

# Redis logs (if running as service)
tail -f /var/log/redis/redis-server.log

# Database logs (SQLite - no separate log file)
# PostgreSQL logs (if using PostgreSQL instead of SQLite)
# tail -f /var/log/postgresql/postgresql-13-main.log
```

## Django Application Issues

### Issue: Django Development Server Won't Start

**Symptoms:**
- Django development server fails to start
- "Address already in use" error
- Import errors on startup
- Module not found errors

**Causes:**
- Port 8000 already in use
- Missing dependencies
- Virtual environment not activated
- Database connection issues
- Configuration errors

**Solutions:**
```bash
# Check if port is in use
netstat -tulpn | grep :8000  # On Linux/macOS
netstat -an | findstr :8000  # On Windows

# Kill process using port 8000
# On Linux/macOS:
lsof -ti:8000 | xargs kill -9
# On Windows:
netstat -ano | findstr :8000
# Then: taskkill /PID <PID> /F

# Check virtual environment
which python  # Should show path to env/bin/python
pip list | grep Django

# Activate virtual environment if not active
source env/bin/activate  # On Linux/macOS
env\Scripts\activate     # On Windows

# Verify settings
python manage.py check

# Check database connection
python manage.py migrate --dry-run
```

### Issue: Database Migration Errors

**Symptoms:**
- Migration fails with SQL errors
- "Table already exists" errors
- Foreign key constraint errors

**Causes:**
- Database schema inconsistencies
- Missing migration dependencies
- Corrupted migration files

**Solutions:**
```bash
# Check migration status
python manage.py showmigrations

# Reset migrations (development only)
python manage.py migrate leaderboard zero
python manage.py migrate

# Fake migrations if needed
python manage.py migrate --fake-initial

# Check for migration conflicts
python manage.py makemigrations --check

# Manual migration rollback
python manage.py migrate leaderboard 0001
```

### Issue: Static Files Not Loading

**Symptoms:**
- CSS/JS files return 404 errors
- Admin interface has no styling
- Static files not found in production

**Causes:**
- STATIC_ROOT not configured
- collectstatic not run
- Nginx not serving static files

**Solutions:**
```bash
# Collect static files
python manage.py collectstatic --noinput

# Check static files settings
python manage.py shell
>>> from django.conf import settings
>>> print(settings.STATIC_ROOT)
>>> print(settings.STATIC_URL)

# Verify Nginx configuration
sudo nginx -t
sudo systemctl reload nginx

# Check file permissions
ls -la /opt/gaming-leaderboard/staticfiles/
```

## Database Issues

### Issue: PostgreSQL Connection Refused

**Symptoms:**
- "Connection refused" errors
- "could not connect to server" messages
- Database queries timeout

**Causes:**
- PostgreSQL service not running
- Incorrect connection parameters
- Firewall blocking connections
- Too many connections

**Solutions:**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Start PostgreSQL if stopped
sudo systemctl start postgresql

# Check connection parameters
sudo -u postgres psql -l

# Check active connections
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"

# Check max connections
sudo -u postgres psql -c "SHOW max_connections;"

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Issue: Slow Database Queries

**Symptoms:**
- API responses are slow
- Database queries take too long
- High CPU usage on database server

**Causes:**
- Missing indexes
- Inefficient queries
- Database needs optimization
- High concurrent load

**Solutions:**
```bash
# Analyze slow queries
python manage.py analyze_queries

# Check database indexes
python manage.py dbshell
\d+ leaderboard_gamesession
\d+ leaderboard_leaderboardentry

# Enable query logging in PostgreSQL
# Edit /etc/postgresql/13/main/postgresql.conf
log_statement = 'all'
log_min_duration_statement = 1000

# Restart PostgreSQL
sudo systemctl restart postgresql

# Optimize database
python manage.py optimize_database

# Check query execution plans
EXPLAIN ANALYZE SELECT * FROM leaderboard_leaderboardentry ORDER BY total_score DESC LIMIT 10;
```

### Issue: Database Locks and Deadlocks

**Symptoms:**
- Transactions hanging
- "deadlock detected" errors
- Score submissions failing

**Causes:**
- Long-running transactions
- Concurrent updates to same records
- Inefficient locking strategy

**Solutions:**
```bash
# Check for locks
sudo -u postgres psql gaming_leaderboard -c "
SELECT 
    blocked_locks.pid AS blocked_pid,
    blocked_activity.usename AS blocked_user,
    blocking_locks.pid AS blocking_pid,
    blocking_activity.usename AS blocking_user,
    blocked_activity.query AS blocked_statement,
    blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks ON blocking_locks.locktype = blocked_locks.locktype
JOIN pg_catalog.pg_stat_activity blocking_activity ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.granted;
"

# Kill blocking queries (if necessary)
sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid = <blocking_pid>;"

# Check for deadlocks in logs
sudo grep -i deadlock /var/log/postgresql/postgresql-13-main.log
```

## Redis Issues

### Issue: Redis Connection Failed

**Symptoms:**
- "Connection refused" to Redis
- Cache operations failing
- Celery tasks not executing

**Causes:**
- Redis service not running
- Redis configuration issues
- Memory limits exceeded

**Solutions:**
```bash
# Check Redis status
sudo systemctl status redis-server

# Start Redis if stopped
sudo systemctl start redis-server

# Test Redis connection
redis-cli ping

# Check Redis configuration
redis-cli config get "*"

# Check Redis memory usage
redis-cli info memory

# Check Redis logs
sudo tail -f /var/log/redis/redis-server.log
```

### Issue: Redis Memory Issues

**Symptoms:**
- "OOM command not allowed" errors
- Redis performance degrading
- Cache misses increasing

**Causes:**
- Redis memory limit reached
- Memory leak in application
- Too many keys stored

**Solutions:**
```bash
# Check Redis memory usage
redis-cli info memory

# Check Redis configuration
redis-cli config get maxmemory
redis-cli config get maxmemory-policy

# Set memory limit (if needed)
redis-cli config set maxmemory 2gb
redis-cli config set maxmemory-policy allkeys-lru

# Clear Redis cache
redis-cli flushall

# Check largest keys
redis-cli --bigkeys
```

## Celery Issues

### Issue: Celery Workers Not Processing Tasks

**Symptoms:**
- Tasks queued but not executed
- Background processing not working
- Rank updates not happening

**Causes:**
- Celery workers not running
- Task routing issues
- Worker process crashes

**Solutions:**
```bash
# Check Celery worker status
celery -A gaming_leaderboard inspect active

# Check worker processes
ps aux | grep celery

# Restart Celery workers
sudo supervisorctl restart celery-worker

# Check Celery logs
tail -f /var/log/celery-worker.log

# Purge stuck tasks
celery -A gaming_leaderboard purge

# Check task routing
celery -A gaming_leaderboard inspect registered
```

### Issue: Celery Beat Not Scheduling Tasks

**Symptoms:**
- Periodic tasks not running
- Cache not refreshing automatically
- Scheduled maintenance not executing

**Causes:**
- Celery Beat not running
- Schedule configuration errors
- Database scheduling issues

**Solutions:**
```bash
# Check Celery Beat status
ps aux | grep "celery.*beat"

# Restart Celery Beat
sudo supervisorctl restart celery-beat

# Check Beat logs
tail -f /var/log/celery-beat.log

# Check scheduled tasks
celery -A gaming_leaderboard inspect scheduled

# Reset Beat schedule
rm -f celerybeat-schedule.db
sudo supervisorctl restart celery-beat
```

### Issue: Celery Task Failures

**Symptoms:**
- Tasks failing with exceptions
- Retry attempts exhausted
- Error notifications not sent

**Causes:**
- Code errors in tasks
- Database connection issues
- Resource constraints

**Solutions:**
```bash
# Check failed tasks
celery -A gaming_leaderboard events

# Check task results
python manage.py shell
>>> from celery.result import AsyncResult
>>> result = AsyncResult('task-id')
>>> print(result.state)
>>> print(result.info)

# Retry failed tasks
celery -A gaming_leaderboard retry <task-id>

# Check task code
python manage.py shell
>>> from leaderboard.tasks import update_user_rank
>>> update_user_rank.delay(1)  # Test task
```

## Performance Issues

### Issue: High API Response Times

**Symptoms:**
- API endpoints responding slowly
- Timeout errors from clients
- High server load

**Causes:**
- Database query inefficiencies
- Lack of caching
- High concurrent load
- Resource constraints

**Solutions:**
```bash
# Check API performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:8000/api/v1/leaderboard/top/

# Create curl-format.txt
echo "
     time_namelookup:  %{time_namelookup}
        time_connect:  %{time_connect}
     time_appconnect:  %{time_appconnect}
    time_pretransfer:  %{time_pretransfer}
       time_redirect:  %{time_redirect}
  time_starttransfer:  %{time_starttransfer}
                     ----------
          time_total:  %{time_total}
" > curl-format.txt

# Enable Django debug toolbar (development only)
pip install django-debug-toolbar

# Check database query performance
python manage.py shell
>>> from django.db import connection
>>> from django.test.utils import override_settings
>>> with override_settings(DEBUG=True):
...     # Your API call here
...     print(len(connection.queries))
...     for query in connection.queries:
...         print(query['time'], query['sql'])

# Monitor with New Relic
# Check New Relic dashboard for performance metrics
```

### Issue: Memory Usage Growing

**Symptoms:**
- Server memory usage increasing
- Out of memory errors
- Application crashes

**Causes:**
- Memory leaks in application
- Large dataset processing
- Inefficient caching

**Solutions:**
```bash
# Check memory usage
free -h
ps aux --sort=-%mem | head -10

# Check Django memory usage
python manage.py shell
>>> import psutil
>>> import os
>>> process = psutil.Process(os.getpid())
>>> print(process.memory_info().rss / 1024 / 1024, "MB")

# Profile memory usage
pip install memory-profiler
python -m memory_profiler manage.py runserver

# Check for memory leaks
pip install objgraph
python manage.py shell
>>> import objgraph
>>> objgraph.show_most_common_types()
```

## Network and Connectivity Issues

### Issue: Nginx 502 Bad Gateway

**Symptoms:**
- Nginx returns 502 errors
- "Bad Gateway" messages
- Upstream connection failures

**Causes:**
- Django application not running
- Incorrect proxy configuration
- Firewall blocking connections

**Solutions:**
```bash
# Check Nginx configuration
sudo nginx -t

# Check upstream servers
curl -I http://127.0.0.1:8000/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Test Django directly
python manage.py runserver 0.0.0.0:8000

# Check firewall rules
sudo ufw status
sudo iptables -L

# Restart services
sudo systemctl restart nginx
sudo supervisorctl restart gaming-leaderboard
```

### Issue: SSL Certificate Problems

**Symptoms:**
- SSL certificate warnings
- HTTPS not working
- Certificate expired errors

**Causes:**
- Expired SSL certificates
- Incorrect certificate configuration
- Certificate chain issues

**Solutions:**
```bash
# Check certificate expiration
openssl x509 -in /path/to/certificate.crt -text -noout | grep "Not After"

# Test SSL configuration
openssl s_client -connect yourdomain.com:443

# Renew Let's Encrypt certificate
sudo certbot renew

# Check certificate chain
curl -I https://yourdomain.com/

# Test SSL configuration
sudo nginx -t
sudo systemctl reload nginx
```

## Monitoring and Alerting Issues

### Issue: New Relic Not Reporting Data

**Symptoms:**
- No data in New Relic dashboard
- Application not showing up
- Missing performance metrics

**Causes:**
- Incorrect license key
- Agent not initialized
- Network connectivity issues

**Solutions:**
```bash
# Check New Relic configuration
python manage.py shell
>>> import newrelic.agent
>>> print(newrelic.agent.current_application())

# Test New Relic connection
newrelic-admin validate-config newrelic.ini

# Check New Relic logs
tail -f newrelic-agent.log

# Verify license key
grep license_key newrelic.ini

# Test agent initialization
python manage.py shell
>>> import newrelic.agent
>>> newrelic.agent.initialize('newrelic.ini')
>>> print("Agent initialized successfully")
```

## Data Consistency Issues

### Issue: Leaderboard Ranks Incorrect

**Symptoms:**
- Player ranks don't match scores
- Duplicate ranks
- Missing players from leaderboard

**Causes:**
- Race conditions in rank updates
- Failed background tasks
- Database inconsistencies

**Solutions:**
```bash
# Check rank consistency
python manage.py shell
>>> from leaderboard.models import LeaderboardEntry
>>> entries = LeaderboardEntry.objects.order_by('-total_score')
>>> for i, entry in enumerate(entries):
...     if entry.rank != i + 1:
...         print(f"Rank mismatch: {entry.user.username} has rank {entry.rank}, should be {i + 1}")

# Recalculate all ranks
python manage.py shell
>>> from leaderboard.tasks import update_all_ranks
>>> update_all_ranks.delay()

# Check for duplicate ranks
python manage.py shell
>>> from leaderboard.models import LeaderboardEntry
>>> from django.db.models import Count
>>> duplicates = LeaderboardEntry.objects.values('rank').annotate(count=Count('rank')).filter(count__gt=1)
>>> print(list(duplicates))

# Manual rank recalculation
python manage.py shell
>>> from leaderboard.models import LeaderboardEntry
>>> from django.db.models import F
>>> entries = LeaderboardEntry.objects.order_by('-total_score')
>>> for i, entry in enumerate(entries):
...     entry.rank = i + 1
...     entry.save(update_fields=['rank'])
```

## Emergency Procedures

### Complete System Recovery

**When to Use:**
- Multiple system failures
- Data corruption
- Complete service outage

**Steps:**
```bash
# 1. Stop all services
sudo systemctl stop nginx
sudo supervisorctl stop all

# 2. Backup current state
sudo cp -r /opt/gaming-leaderboard /opt/gaming-leaderboard.backup.$(date +%Y%m%d_%H%M%S)

# 3. Restore from backup
sudo -u postgres psql -c "DROP DATABASE gaming_leaderboard;"
sudo -u postgres psql -c "CREATE DATABASE gaming_leaderboard;"
gunzip -c /opt/backups/db_backup_latest.sql.gz | sudo -u postgres psql gaming_leaderboard

# 4. Reset application
cd /opt/gaming-leaderboard
source env/bin/activate
python manage.py migrate
python manage.py collectstatic --noinput

# 5. Restart services
sudo supervisorctl start all
sudo systemctl start nginx

# 6. Verify system health
curl -f http://localhost:8000/api/v1/leaderboard/health/
```

### Database Recovery

**When to Use:**
- Database corruption
- Data loss
- Migration failures

**Steps:**
```bash
# 1. Stop application
sudo supervisorctl stop gaming-leaderboard

# 2. Create database backup
sudo -u postgres pg_dump gaming_leaderboard > emergency_backup.sql

# 3. Restore from latest backup
sudo -u postgres psql -c "DROP DATABASE gaming_leaderboard;"
sudo -u postgres psql -c "CREATE DATABASE gaming_leaderboard;"
gunzip -c /opt/backups/db_backup_latest.sql.gz | sudo -u postgres psql gaming_leaderboard

# 4. Run migrations
python manage.py migrate

# 5. Restart application
sudo supervisorctl start gaming-leaderboard
```

## Prevention and Best Practices

### Monitoring Setup
```bash
# Set up log rotation
sudo logrotate -f /etc/logrotate.conf

# Monitor disk space
df -h
du -sh /opt/gaming-leaderboard/

# Set up automated backups
crontab -e
0 2 * * * /opt/gaming-leaderboard/scripts/backup.sh

# Monitor system resources
htop
iostat -x 1
```

### Regular Maintenance
```bash
# Weekly maintenance script
#!/bin/bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Clean up logs
sudo find /var/log -name "*.log" -mtime +30 -delete

# Optimize database
python manage.py optimize_database

# Check for security updates
sudo unattended-upgrades --dry-run

# Test backup restoration
/opt/gaming-leaderboard/scripts/test_backup.sh
```

## Getting Help

### Log Analysis
```bash
# Search for errors in logs
sudo grep -i error /var/log/gaming-leaderboard.log | tail -20
sudo grep -i exception /var/log/celery-worker.log | tail -20

# Check system messages
sudo dmesg | tail -20
sudo journalctl -u nginx -f
```

### Contact Information
- **Technical Support**: support@gamingleaderboard.com
- **Documentation**: https://docs.gamingleaderboard.com
- **Status Page**: https://status.gamingleaderboard.com
- **GitHub Issues**: https://github.com/org/gaming-leaderboard/issues

### Useful Commands Reference
```bash
# Service management
sudo systemctl status <service>
sudo systemctl start <service>
sudo systemctl stop <service>
sudo systemctl restart <service>

# Supervisor management
sudo supervisorctl status
sudo supervisorctl start <program>
sudo supervisorctl stop <program>
sudo supervisorctl restart <program>

# Database management
sudo -u postgres psql gaming_leaderboard
python manage.py dbshell
python manage.py migrate

# Cache management
redis-cli flushall
python manage.py clear_cache

# Log management
tail -f /var/log/<logfile>
grep -i error /var/log/<logfile>
journalctl -u <service> -f
```

Remember to always test solutions in a development environment before applying them to production systems. 