# New Relic Integration Guide

## Overview
This guide covers the New Relic APM (Application Performance Monitoring) integration for the Gaming Leaderboard System. New Relic provides comprehensive monitoring, error tracking, and performance insights for both the Django application and Celery background tasks.

## Setup and Configuration

### 1. Installation
The New Relic Python agent is already included in `requirements.txt`:
```
newrelic>=9.0
```

### 2. Configuration Files

#### newrelic.ini
The main configuration file located in the project root contains:
- **License Key**: Your New Relic license key
- **Application Name**: "Gaming Leaderboard System"
- **Environment-specific settings**: Development, Test, Staging, Production
- **Monitoring features**: Transaction tracing, error collection, browser monitoring

#### Key Configuration Options:
- `monitor_mode = true`: Enables data collection
- `transaction_tracer.enabled = true`: Captures slow transactions
- `error_collector.enabled = true`: Tracks exceptions
- `distributed_tracing.enabled = true`: Enables distributed tracing
- `browser_monitoring.auto_instrument = true`: Enables Real User Monitoring

### 3. Django Integration

#### WSGI Application (gaming_leaderboard/wsgi.py)
```python
# Initialize New Relic agent first, before importing Django
import newrelic.agent
import newrelic.api.exceptions
import os

# Initialize with error handling to prevent conflicts with manage.py
try:
    # Use environment from NEWRELIC_ENVIRONMENT or default to production
    environment = os.environ.get('NEWRELIC_ENVIRONMENT', 'production')
    newrelic.agent.initialize('newrelic.ini', environment)
except newrelic.api.exceptions.ConfigurationError:
    # Already initialized, likely from manage.py - this is fine
    pass

# Wrap the WSGI application with New Relic
application = newrelic.agent.WSGIApplicationWrapper(get_wsgi_application())
```

#### Development Server (manage.py)
```python
# Initialize New Relic agent for development server
if 'runserver' in sys.argv:
    import newrelic.agent
    newrelic.agent.initialize('newrelic.ini', 'development')
```

### 4. Celery Integration

All Celery tasks are wrapped with `@newrelic.agent.background_task()` decorator to enable monitoring of background processes.

## Monitoring Features

### 1. API Endpoint Monitoring

#### Custom Attributes Tracked:
- `user_id`: User performing the action
- `endpoint`: API endpoint name
- `game_mode`: Game mode for score submissions
- `submitted_score`: Score value submitted
- `cache_hit`: Whether cache was hit or missed
- `query_count`: Number of database queries

#### Custom Events:
- **ScoreSubmitted**: Successful score submissions
- **ScoreSubmissionError**: Failed score submissions
- **PlayerRankLookup**: Player rank queries
- **PlayerRankError**: Player rank query errors

#### Custom Metrics:
- `Custom/Leaderboard/ScoreSubmissions`: Total score submissions
- `Custom/Leaderboard/GameMode/{mode}/Submissions`: Submissions per game mode
- `Custom/Leaderboard/Requests`: Total leaderboard requests
- `Custom/Leaderboard/RankLookups`: Total rank lookups
- `Custom/Leaderboard/CacheHits`: Cache hit count
- `Custom/Leaderboard/CacheMisses`: Cache miss count

### 2. Background Task Monitoring

#### Monitored Tasks:
1. **update_user_rank**: Individual user rank updates
2. **cache_top_leaderboard**: Leaderboard cache refresh
3. **update_all_ranks**: Bulk rank recalculation
4. **cleanup_old_game_sessions**: Database cleanup
5. **calculate_game_mode_stats**: Game mode statistics
6. **send_rank_notification**: Rank change notifications
7. **generate_leaderboard_report**: Daily reporting

#### Task Metrics:
- `Custom/Tasks/{TaskName}/Success`: Successful task executions
- `Custom/Tasks/{TaskName}/Errors`: Failed task executions
- `Custom/Tasks/UpdateAllRanks/EntriesProcessed`: Entries processed
- `Custom/Tasks/UpdateAllRanks/EntriesUpdated`: Entries updated

#### Task Events:
- **RankUpdated**: Individual rank changes
- **AllRanksUpdated**: Bulk rank update results
- **CacheUpdated**: Cache refresh events
- **GameSessionsCleanup**: Database cleanup results
- **GameModeStatsCalculated**: Statistics calculation events
- **NotificationSent**: Notification delivery events
- **DailyReportGenerated**: Daily report generation

### 3. Game Mode Analytics

#### Per-Game Mode Metrics:
- `Custom/GameModes/{mode}/TotalSessions`: Total sessions per mode
- `Custom/GameModes/{mode}/AverageScore`: Average score per mode
- `Custom/GameModes/{mode}/TotalPlayers`: Unique players per mode

#### Daily Metrics:
- `Custom/Daily/TotalSessions`: Daily session count
- `Custom/Daily/UniquePlayers`: Daily unique player count
- `Custom/Daily/AverageScore`: Daily average score
- `Custom/Daily/TotalPlayers`: Total registered players

## Error Tracking

### 1. Automatic Error Collection
- All unhandled exceptions are automatically captured
- Stack traces and context information included
- Error grouping and alerting available

### 2. Custom Error Events
- **ScoreSubmissionError**: Invalid score or game mode data
- **PlayerRankError**: User not found errors
- **TaskError**: Background task failures
- **NotificationError**: Notification delivery failures

### 3. Error Attributes
Each error includes contextual information:
- User ID (when available)
- Endpoint or task name
- Input parameters
- Error type classification

## Performance Monitoring

### 1. Transaction Tracing
- Automatic instrumentation of Django views
- Database query analysis
- External service calls tracking
- Custom function tracing with `@newrelic.agent.function_trace()`

### 2. Database Monitoring
- Query performance analysis
- Slow query identification
- Query plan capture (PostgreSQL)
- Connection pool monitoring

### 3. Cache Monitoring
- Cache hit/miss ratios
- Cache performance metrics
- Cache invalidation tracking

## Alerting and Notifications

### 1. Recommended Alerts
- **High Error Rate**: Error rate > 5% for 5 minutes
- **Slow Response Time**: Average response time > 2 seconds
- **Background Task Failures**: Task failure rate > 10%
- **Database Performance**: Database response time > 500ms
- **Cache Miss Rate**: Cache miss rate > 50%

### 2. Custom Alerts
- **Score Submission Errors**: High rate of invalid submissions
- **Rank Calculation Failures**: Background task failures
- **User Activity Anomalies**: Unusual traffic patterns

## Dashboard Recommendations

### 1. Application Overview
- Request throughput
- Response time percentiles
- Error rate trends
- Apdex score

### 2. Gaming Metrics
- Score submissions per minute
- Active players count
- Game mode popularity
- Rank update frequency

### 3. Background Tasks
- Task execution times
- Task success/failure rates
- Queue depth monitoring
- Worker utilization

### 4. Database Performance
- Query response times
- Database connections
- Slow query trends
- Index usage

## Deployment Considerations

### 1. Environment Configuration
- **Development**: Full monitoring with debug logging
- **Test**: Monitoring disabled to avoid test data
- **Staging**: Production-like monitoring with staging app name
- **Production**: Optimized monitoring with warning-level logging

### 2. Performance Impact
- Minimal overhead (~1-3% CPU)
- Configurable sampling rates
- Asynchronous data transmission
- Automatic retry logic

### 3. Security
- High Security Mode available
- SQL obfuscation enabled
- Request parameter collection configurable
- Sensitive data filtering

## Troubleshooting

### 1. Common Issues
- **Agent Not Reporting**: Check license key and network connectivity
- **Missing Transactions**: Verify WSGI wrapper and initialization
- **Background Tasks Not Monitored**: Ensure decorator usage

### 2. Debug Mode
Enable debug logging in development:
```ini
[newrelic:development]
log_level = debug
```

### 3. Validation
Test the integration:
```bash
# Check agent status
newrelic-admin validate-config newrelic.ini

# Generate test data
python manage.py runserver
# Make API requests and check New Relic dashboard
```

## Best Practices

### 1. Custom Instrumentation
- Use `@newrelic.agent.function_trace()` for critical functions
- Add custom attributes for business context
- Record custom events for important business metrics

### 2. Error Handling
- Always use `newrelic.agent.record_exception()` in except blocks
- Include contextual information in error attributes
- Classify errors by type for better analysis

### 3. Performance Optimization
- Monitor database query patterns
- Track cache effectiveness
- Identify bottlenecks in background tasks
- Optimize based on transaction traces

### 4. Business Intelligence
- Track user engagement metrics
- Monitor game mode popularity
- Analyze score distribution patterns
- Measure feature adoption rates

## Support and Resources

### 1. New Relic Documentation
- [Python Agent Guide](https://docs.newrelic.com/docs/agents/python-agent/)
- [Django Integration](https://docs.newrelic.com/docs/agents/python-agent/web-frameworks-servers/python-agent-django/)
- [Celery Integration](https://docs.newrelic.com/docs/agents/python-agent/back-end-services/python-agent-celery/)

### 2. Gaming Leaderboard Specific
- Custom metrics dashboard templates
- Alert policy recommendations
- Performance optimization guides
- Troubleshooting runbooks

This comprehensive monitoring setup provides deep visibility into the Gaming Leaderboard System's performance, user behavior, and system health, enabling proactive optimization and issue resolution. 