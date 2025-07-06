# Gaming Leaderboard System

A high-performance, scalable Django-based backend system for managing gaming leaderboards with real-time score tracking, background processing, and comprehensive monitoring.

## 🚀 Features

- **Development Ready**: Fully functional development environment setup
- **Real-time Leaderboards**: Score updates and rank calculations
- **Background Processing**: Celery-based task queue for heavy operations
- **Monitoring Integration**: New Relic APM for development monitoring
- **Scalable Architecture**: Designed to scale from development to production
- **RESTful API**: Clean, versioned API with comprehensive documentation
- **Database Optimization**: Indexing and query optimization strategies
- **Caching Layer**: Redis-based caching system
- **Future Production Ready**: Architecture designed for production scaling

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [API Documentation](#api-documentation)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Deployment](#deployment)
- [Performance](#performance)
- [Monitoring](#monitoring)

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- PostgreSQL 13+ (or SQLite for development)
- Redis 6+
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd gaming-leaderboard-backend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Start development server**
   ```bash
   python manage.py runserver
   ```

7. **Start background services**
   ```bash
   # Terminal 2: Redis
   redis-server
   
   # Terminal 3: Celery Worker
   celery -A gaming_leaderboard worker --loglevel=info
   
   # Terminal 4: Celery Beat
   celery -A gaming_leaderboard beat --loglevel=info
   ```

## 📖 API Documentation

### Base URL
```
http://localhost:8000/api/v1/leaderboard/
```

### Core Endpoints

#### Submit Score
```bash
POST /api/v1/leaderboard/submit/
Content-Type: application/json

{
  "score": 1500,
  "game_mode": "classic"
}
```

#### Get Leaderboard
```bash
GET /api/v1/leaderboard/top/?limit=10
```

#### Get Player Rank
```bash
GET /api/v1/leaderboard/rank/{user_id}/
```

For complete API documentation, see [docs/api_documentation.md](docs/api_documentation.md).

## 🏗️ Architecture

### Development Environment Overview
```
┌─────────────────────────────────────────────────────────────┐
│                Local Development Setup                      │
│                                                             │
│  ┌─────────────────┐              ┌─────────────────┐       │
│  │   Django Dev    │              │   New Relic     │       │
│  │   Server        │──────────────│   Monitoring    │       │
│  │   (Port 8000)   │              │   (Development) │       │
│  └─────────────────┘              └─────────────────┘       │
│           │                                                 │
│  ┌────────┼────────────────────────────────────────┐       │
│  │        ▼                                        │       │
│  │  ┌─────────────────┐    ┌─────────────────┐    │       │
│  │  │   SQLite/       │    │   Redis Server  │    │       │
│  │  │   PostgreSQL    │    │   (Cache +      │    │       │
│  │  │   Database      │    │   Message       │    │       │
│  │  │                 │    │   Broker)       │    │       │
│  │  └─────────────────┘    └─────────────────┘    │       │
│  │                                                 │       │
│  │  ┌─────────────────┐    ┌─────────────────┐    │       │
│  │  │   Celery        │    │   Celery Beat   │    │       │
│  │  │   Worker        │    │   Scheduler     │    │       │
│  │  └─────────────────┘    └─────────────────┘    │       │
│  └─────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

- **Django Application**: RESTful API with DRF (Development Server)
- **Database**: SQLite (default) or PostgreSQL for development
- **Redis**: Caching and message broker
- **Celery**: Background task processing
- **New Relic**: Application performance monitoring (Development mode)

For detailed architecture documentation, see [docs/system_architecture.md](docs/system_architecture.md).

## 💾 Database Schema

### Core Models

#### GameSession
```python
class GameSession(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    score = models.IntegerField()
    game_mode = models.CharField(max_length=50)
    timestamp = models.DateTimeField(auto_now_add=True)
```

#### LeaderboardEntry
```python
class LeaderboardEntry(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    total_score = models.IntegerField(default=0)
    rank = models.IntegerField(null=True, blank=True)
    last_updated = models.DateTimeField(auto_now=True)
```

## ⚙️ Configuration

### Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/gaming_leaderboard

# Redis
REDIS_URL=redis://localhost:6379/0

# Django
SECRET_KEY=your-secret-key
DEBUG=False
ALLOWED_HOSTS=localhost,127.0.0.1

# New Relic
NEWRELIC_ENVIRONMENT=production
NEW_RELIC_LICENSE_KEY=your-license-key

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

### Key Settings

- **Database Configuration**: SQLite for development, PostgreSQL option available
- **Cache Configuration**: Redis-based caching
- **Background Tasks**: Celery with Redis broker
- **Monitoring**: New Relic APM integration (Development environment)
- **Security**: Basic security headers (HTTPS not enforced in development)

## 🚀 Deployment

### Development Deployment (Current)

The current setup is designed for local development:

1. **Local Development Setup**
   ```bash
   # Clone and setup
   git clone <repository-url>
   cd gaming-leaderboard-backend
   python -m venv env
   source env/bin/activate  # On Windows: env\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Database Setup**
   ```bash
   # Run migrations (uses SQLite by default)
   python manage.py migrate
   ```

3. **Start Services**
   ```bash
   # Terminal 1: Django development server
   python manage.py runserver
   
   # Terminal 2: Redis server
   redis-server
   
   # Terminal 3: Celery worker
   celery -A gaming_leaderboard worker --loglevel=info
   
   # Terminal 4: Celery beat
   celery -A gaming_leaderboard beat --loglevel=info
   ```

### Future Production Deployment
For production deployment instructions, see [docs/deployment_guide.md](docs/deployment_guide.md) (contains production-ready configurations).

### Docker Deployment

```bash
# Build and run with Docker Compose
docker-compose up -d

# Run migrations
docker-compose exec web python manage.py migrate

# Create superuser
docker-compose exec web python manage.py createsuperuser
```

## 📊 Performance

### Development Performance

Current development setup provides:
- **Score Submission**: ~200ms (development server)
- **Leaderboard Retrieval**: ~100ms (development server)
- **Player Rank Lookup**: ~50ms (development server)
- **Throughput**: Limited by Django development server
- **Concurrent Users**: Development testing only

### Optimization Features

- **Database Indexing**: Optimized indexes for fast queries
- **Caching**: Redis-based caching system
- **Background Processing**: Celery task processing
- **Query Optimization**: Minimized N+1 queries
- **Production Ready**: Architecture designed for high-performance scaling

For performance optimization guide, see [docs/performance_optimization_guide.md](docs/performance_optimization_guide.md).

## 📈 Monitoring

### New Relic Integration

- **Application Performance**: Response times, throughput, errors (Development environment)
- **Database Monitoring**: Query performance monitoring
- **Custom Metrics**: Business-specific KPIs
- **Development Monitoring**: Configured for development environment

### Health Checks

```bash
# Application health (when health endpoint is implemented)
curl http://localhost:8000/api/v1/leaderboard/health/

# Service status (development)
# Check if Django server is running on port 8000
curl http://localhost:8000/

# Check Redis connection
redis-cli ping
```

### Logging

- **Application Logs**: Console output from Django development server
- **Celery Logs**: Console output from Celery worker
- **Database Logs**: SQLite (file-based) or PostgreSQL logs
- **Development**: All logs visible in terminal output

## 🔧 Development

### Running Tests

```bash
# Run all tests
python manage.py test

# Run specific test module
python manage.py test leaderboard.tests

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Code Quality

```bash
# Linting
flake8 .
black .
isort .

# Type checking
mypy .
```

### Load Testing

```bash
# Install locust
pip install locust

# Run load tests
locust -f tests/load_test.py --host=http://localhost:8000
```

## 🛠️ Management Commands

### Database Management

```bash
# Optimize database
python manage.py optimize_database

# Analyze queries
python manage.py analyze_queries

# Update all ranks
python manage.py update_ranks
```

### Cache Management

```bash
# Clear cache
python manage.py clear_cache

# Warm cache
python manage.py warm_cache
```

### Monitoring Commands

```bash
# Check Celery status
python manage.py celery_monitor

# Performance benchmark
python manage.py benchmark_apis
```

## 📚 Documentation

- [API Documentation](docs/api_documentation.md)
- [System Architecture](docs/system_architecture.md)
- [Deployment Guide](docs/deployment_guide.md)
- [Performance Optimization](docs/performance_optimization_guide.md)
- [Troubleshooting Guide](docs/troubleshooting_guide.md)
- [Database Indexing Strategy](docs/database_indexing_strategy.md)
- [Celery Setup Guide](docs/celery_setup_guide.md)
- [New Relic Setup Guide](docs/newrelic_setup_guide.md)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Setup

```bash
# Install development dependencies
pip install -r requirements-dev.txt

# Install pre-commit hooks
pre-commit install

# Run tests before committing
python manage.py test
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [docs/](docs/)
- **Issues**: [GitHub Issues](https://github.com/org/gaming-leaderboard/issues)
- **Discussions**: [GitHub Discussions](https://github.com/org/gaming-leaderboard/discussions)
- **Email**: support@gamingleaderboard.com

## 🏆 Acknowledgments

- Django and Django REST Framework communities
- PostgreSQL and Redis teams
- New Relic for monitoring solutions
- Celery for background task processing
- All contributors and maintainers

## 📈 Roadmap

### Current Version (v1.0 - Development)
- ✅ Core leaderboard functionality
- ✅ Background processing with Celery
- ✅ New Relic monitoring integration
- ✅ Development environment setup
- ✅ Comprehensive documentation

### Future Versions
- 🔄 Production deployment with load balancing
- 🔄 Real-time WebSocket updates
- 🔄 Machine learning for fraud detection
- 🔄 Multi-region deployment
- 🔄 GraphQL API support
- 🔄 Advanced analytics dashboard

---

**Built with ❤️ for the gaming community** 