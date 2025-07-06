# Database Indexing Strategy for Gaming Leaderboard System

## Overview
This document outlines the comprehensive database indexing strategy implemented for the gaming leaderboard system to optimize query performance and handle large datasets efficiently.

## Current Database Schema

### GameSession Model
```python
class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.PositiveIntegerField()
    game_mode = models.CharField(max_length=50)
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
```

### LeaderboardEntry Model
```python
class LeaderboardEntry(models.Model):
    user = models.OneToOneField(User, primary_key=True)
    total_score = models.PositiveBigIntegerField(default=0, db_index=True)
    rank = models.PositiveIntegerField(null=True, blank=True, db_index=True)
```

## Indexing Strategy

### 1. GameSession Indexes

#### Single Column Indexes
- **`gamesession_score_idx`**: `(-score)` - Descending score for high-score queries
- **`gamesession_user_idx`**: `(user)` - User-specific game history
- **`gamesession_mode_idx`**: `(game_mode)` - Game mode filtering
- **`timestamp`**: `db_index=True` - Time-based queries

#### Composite Indexes
- **`gamesession_user_time_idx`**: `(user, -timestamp)` - User's recent games
- **`gamesession_mode_score_idx`**: `(game_mode, -score)` - Top scores per mode

### 2. LeaderboardEntry Indexes

#### Single Column Indexes
- **`total_score`**: `db_index=True` - Score-based filtering
- **`rank`**: `db_index=True` - Rank-based queries

#### Note on LeaderboardEntry
The existing `db_index=True` on `total_score` and `rank` fields provides sufficient indexing for most queries. Additional composite indexes were evaluated but deemed unnecessary given the query patterns.

## Query Optimization Analysis

### 1. Top Leaderboard Query
```sql
-- Optimized by: total_score db_index
SELECT * FROM leaderboard_entry 
WHERE total_score > 0 
ORDER BY total_score DESC 
LIMIT 10;
```
**Performance Impact**: O(log n) instead of O(n log n)

### 2. User Rank Calculation
```sql
-- Optimized by: total_score db_index
SELECT COUNT(*) FROM leaderboard_entry 
WHERE total_score > (
    SELECT total_score FROM leaderboard_entry WHERE user_id = ?
);
```
**Performance Impact**: Significant improvement for large datasets

### 3. User Game History
```sql
-- Optimized by: gamesession_user_time_idx
SELECT * FROM game_session 
WHERE user_id = ? 
ORDER BY timestamp DESC 
LIMIT 10;
```
**Performance Impact**: Direct index scan instead of full table scan

### 4. Game Mode Statistics
```sql
-- Optimized by: gamesession_mode_score_idx
SELECT game_mode, COUNT(*), AVG(score), MAX(score) 
FROM game_session 
GROUP BY game_mode 
ORDER BY COUNT(*) DESC;
```
**Performance Impact**: Faster aggregation queries

## Performance Monitoring

### Query Analysis Command
```bash
python manage.py analyze_queries --verbose
```

This command tests critical queries and provides:
- Execution time measurements
- Query count analysis
- SQL query inspection
- Performance recommendations

### Expected Performance Targets
- **Top 10 Leaderboard**: < 50ms
- **User Rank Calculation**: < 100ms
<!-- - **Recent Game Sessions**: < 30ms
- **User Game History**: < 25ms
- **Game Mode Statistics**: < 200ms -->

## Index Maintenance

### Migration Commands
```bash
# Create new indexes
python manage.py makemigrations leaderboard
python manage.py migrate

# Analyze index usage (PostgreSQL)
python manage.py dbshell
```

### PostgreSQL Index Analysis
```sql
-- Check index usage
SELECT schemaname, tablename, indexname, idx_scan, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'leaderboard_%'
ORDER BY idx_scan DESC;

-- Check index sizes
SELECT schemaname, tablename, indexname, pg_size_pretty(pg_relation_size(indexrelid))
FROM pg_stat_user_indexes
WHERE schemaname = 'public' AND tablename LIKE 'leaderboard_%'
ORDER BY pg_relation_size(indexrelid) DESC;
```

## Best Practices

### 1. Index Design Principles
- **Selectivity**: High-selectivity columns first in composite indexes
- **Query Patterns**: Align indexes with actual query patterns
- **Cardinality**: Consider column cardinality for index effectiveness
- **Maintenance**: Regular monitoring and cleanup of unused indexes
- **Avoid Redundancy**: Don't create composite indexes when single-column indexes suffice

### 2. Composite Index Guidelines
- **Left-to-Right**: Queries must use leftmost columns
- **Order Matters**: Most selective columns first
- **Covering Indexes**: Include all needed columns to avoid table lookups
- **Justify Each Index**: Each index should serve a specific, measurable query pattern

### 3. Monitoring Strategy
- **Regular Analysis**: Run performance analysis weekly
- **Query Logging**: Enable slow query logging
- **Index Usage**: Monitor index hit ratios
- **Growth Tracking**: Track index size growth over time

## Scalability Considerations

### 1. Large Dataset Handling
- **Partitioning**: Consider table partitioning for GameSession
- **Archiving**: Archive old game sessions periodically
- **Batch Operations**: Use bulk operations for large updates

### 2. Write Performance
- **Index Overhead**: Balance read optimization with write performance
- **Batch Updates**: Group rank updates in background tasks
- **Connection Pooling**: Implement database connection pooling

### 3. Cache Strategy
- **Redis Integration**: Cache frequently accessed leaderboard data
- **Cache Invalidation**: Implement proper cache invalidation
- **Warm-up**: Pre-populate cache with top players

## Troubleshooting

### Common Issues
1. **Slow Leaderboard Queries**: Check total_score index usage
2. **User Rank Timeouts**: Verify composite index on score/user
3. **Game History Delays**: Ensure user/timestamp index exists
4. **High Write Latency**: Review index count and necessity

### Debug Commands
```bash
# Check current indexes
python manage.py sqlmigrate leaderboard 0001

# Analyze query performance
python manage.py analyze_queries --verbose

# Database shell for manual analysis
python manage.py dbshell
```

## Future Optimizations

### 1. Advanced Indexing
- **Partial Indexes**: For frequently filtered subsets
- **Expression Indexes**: For computed columns
- **GIN/GiST Indexes**: For complex data types

### 2. Database-Specific Features
- **PostgreSQL**: Utilize advanced index types
- **MySQL**: Consider index hints for complex queries
- **SQLite**: Optimize for development/testing

### 3. Application-Level Optimizations
- **Denormalization**: Pre-compute expensive aggregations
- **Materialized Views**: For complex reporting queries
- **Read Replicas**: Separate read/write workloads

## Conclusion

This minimal indexing strategy provides efficient query performance while avoiding index bloat. The approach focuses on:

1. **Essential single-column indexes** for primary query patterns
2. **Targeted composite indexes** for specific multi-column queries
3. **Avoiding redundancy** between single and composite indexes
4. **Performance monitoring** to validate index effectiveness

Regular monitoring and adjustment based on actual usage patterns will ensure continued optimal performance as the system scales.

For questions or optimization suggestions, refer to the query analysis tools and performance monitoring guidelines outlined in this document. 