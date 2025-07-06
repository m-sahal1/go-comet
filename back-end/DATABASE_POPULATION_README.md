# Database Population Scripts

This directory contains two scripts to populate your gaming leaderboard database with test data, mimicking the SQL commands you provided.

## Overview

The scripts will create:
1. **Users**: 1 million users with usernames like `user_1`, `user_2`, etc.
2. **Game Sessions**: 5 million game sessions with random scores (1-10,000), random game modes (`solo`/`team`), and random timestamps within the last year
3. **Leaderboard Entries**: Aggregated scores per user with proper rankings

## Django Management Command

### Usage
```bash
# Basic usage (default: 1M users, 5M sessions)
python manage.py populate_data

# Custom numbers (smaller for testing)
python manage.py populate_data --users 10000 --sessions 50000

# Skip certain steps
python manage.py populate_data --skip-users  # Skip user creation
python manage.py populate_data --skip-sessions  # Skip session creation
python manage.py populate_data --skip-leaderboard  # Skip leaderboard creation

# Adjust batch size for performance
python manage.py populate_data --batch-size 5000

# Get help
python manage.py populate_data --help
```

### Features
- ✅ Progress tracking with timestamps
- ✅ Handles existing data gracefully
- ✅ Configurable batch sizes for performance
- ✅ Individual step skipping
- ✅ Proper Django integration

