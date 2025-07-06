# Gaming Leaderboard API Documentation

## Overview
The Gaming Leaderboard System provides a high-performance REST API for managing game scores and leaderboards. This documentation covers all available endpoints, request/response formats, and usage examples.

## Base URL
```
http://localhost:8000/api/v1/leaderboard/
```

## Authentication
Currently in development mode, authentication is not strictly enforced for testing purposes. In production, all endpoints will require authentication with the following header:
```
Authorization: Bearer <your-token>
```

## API Endpoints

### 1. Submit Score
Submit a new game score for a player.

**Endpoint:** `POST /api/v1/leaderboard/submit/`

**Request Body:**
```json
{
    "score": 1500,
    "game_mode": "classic"
}
```

**Response (Success - 201 Created):**
```json
{
    "status": "success",
    "message": "Score submitted successfully",
    "data": {
        "game_session_id": 12345,
        "user_id": 1,
        "score": 1500,
        "game_mode": "classic",
        "timestamp": "2024-01-15T10:30:00Z",
        "new_total_score": 8750,
        "rank_updated": true
    }
}
```

**Response (Error - 400 Bad Request):**
```json
{
    "status": "error",
    "message": "Invalid input data",
    "errors": {
        "score": ["Score must be between 0 and 999999"]
    }
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:8000/api/v1/leaderboard/submit/ \
  -H "Content-Type: application/json" \
  -d '{"score": 1500, "game_mode": "classic"}'
```

### 2. Get Top Leaderboard
Retrieve the top players from the leaderboard.

**Endpoint:** `GET /api/v1/leaderboard/top/`

**Query Parameters:**
- `limit` (optional): Number of results to return (default: 10, max: 100)
- `offset` (optional): Number of results to skip (default: 0)

**Response (Success - 200 OK):**
```json
{
    "status": "success",
    "data": {
        "count": 1000,
        "next": "http://localhost:8000/api/v1/leaderboard/top/?limit=10&offset=10",
        "previous": null,
        "results": [
            {
                "rank": 1,
                "user": {
                    "id": 42,
                    "username": "pro_gamer_2024",
                    "date_joined": "2024-01-01T00:00:00Z"
                },
                "total_score": 25000,
                "last_updated": "2024-01-15T10:30:00Z"
            },
            {
                "rank": 2,
                "user": {
                    "id": 15,
                    "username": "speed_runner",
                    "date_joined": "2024-01-02T00:00:00Z"
                },
                "total_score": 23500,
                "last_updated": "2024-01-15T09:45:00Z"
            }
        ]
    }
}
```

**cURL Example:**
```bash
curl -X GET "http://localhost:8000/api/v1/leaderboard/top/?limit=5"
```

### 3. Get Player Rank
Retrieve a specific player's rank and score information.

**Endpoint:** `GET /api/v1/leaderboard/rank/{user_id}/`

**Path Parameters:**
- `user_id`: Integer ID of the user

**Response (Success - 200 OK):**
```json
{
    "status": "success",
    "data": {
        "user": {
            "id": 123,
            "username": "casual_player",
            "date_joined": "2024-01-10T00:00:00Z"
        },
        "rank": 42,
        "total_score": 12500,
        "total_games": 150,
        "average_score": 83.33,
        "last_game": "2024-01-15T08:20:00Z",
        "percentile": 85.5
    }
}
```

**Response (Error - 404 Not Found):**
```json
{
    "status": "error",
    "message": "User not found or has no game sessions"
}
```

**cURL Example:**
```bash
curl -X GET http://localhost:8000/api/v1/leaderboard/rank/123/
```

### 4. Get Game Mode Statistics
Retrieve statistics for different game modes.

**Endpoint:** `GET /api/v1/leaderboard/stats/modes/`

**Response (Success - 200 OK):**
```json
{
    "status": "success",
    "data": {
        "classic": {
            "total_games": 50000,
            "total_players": 1200,
            "average_score": 850.5,
            "highest_score": 9999,
            "lowest_score": 10
        },
        "blitz": {
            "total_games": 30000,
            "total_players": 800,
            "average_score": 650.2,
            "highest_score": 8500,
            "lowest_score": 5
        }
    }
}
```

### 5. Admin: Update All Ranks
Manually trigger rank recalculation for all players (Admin only).

**Endpoint:** `POST /api/v1/leaderboard/admin/update-ranks/`

**Response (Success - 200 OK):**
```json
{
    "status": "success",
    "message": "Rank update task queued successfully",
    "task_id": "abc123-def456-ghi789"
}
```

## Error Handling

### HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

### Error Response Format
All error responses follow this format:
```json
{
    "status": "error",
    "message": "Human-readable error message",
    "errors": {
        "field_name": ["Specific validation error"]
    }
}
```

## Rate Limiting
Rate limiting is configured but **disabled in development** for easier testing:
- **Submit Score**: 100 requests per minute per user (production)
- **Get Leaderboard**: 200 requests per minute per user (production)
- **Get Player Rank**: 300 requests per minute per user (production)
- **Admin endpoints**: 10 requests per minute per user (production)

## Caching
- **Leaderboard data**: Cached for 1 minute
- **Player ranks**: Cached for 5 minutes
- **Game mode statistics**: Cached for 1 hour

## Pagination
List endpoints support pagination with the following parameters:
- `limit`: Number of results per page (default: 10, max: 100)
- `offset`: Number of results to skip

## WebSocket Support (Future Feature)
Real-time leaderboard updates will be available via WebSocket connections in future versions:
```
ws://localhost:8000/ws/leaderboard/  (Not implemented yet)
```

## SDK Examples

### Python SDK
```python
import requests

class LeaderboardClient:
    def __init__(self, base_url, token=None):
        self.base_url = base_url
        self.headers = {'Content-Type': 'application/json'}
        if token:  # Token optional in development
            self.headers['Authorization'] = f'Bearer {token}'
    
    def submit_score(self, score, game_mode):
        response = requests.post(
            f"{self.base_url}/submit/",
            json={"score": score, "game_mode": game_mode},
            headers=self.headers
        )
        return response.json()
    
    def get_leaderboard(self, limit=10):
        response = requests.get(
            f"{self.base_url}/top/?limit={limit}",
            headers=self.headers
        )
        return response.json()

# Usage (Development - no token needed)
client = LeaderboardClient("http://localhost:8000/api/v1/leaderboard")
result = client.submit_score(1500, "classic")
```

### JavaScript SDK
```javascript
class LeaderboardAPI {
    constructor(baseUrl, token = null) {
        this.baseUrl = baseUrl;
        this.headers = {
            'Content-Type': 'application/json'
        };
        if (token) {  // Token optional in development
            this.headers['Authorization'] = `Bearer ${token}`;
        }
    }
    
    async submitScore(score, gameMode) {
        const response = await fetch(`${this.baseUrl}/submit/`, {
            method: 'POST',
            headers: this.headers,
            body: JSON.stringify({ score, game_mode: gameMode })
        });
        return await response.json();
    }
    
    async getLeaderboard(limit = 10) {
        const response = await fetch(`${this.baseUrl}/top/?limit=${limit}`, {
            headers: this.headers
        });
        return await response.json();
    }
}

// Usage (Development - no token needed)
const api = new LeaderboardAPI('http://localhost:8000/api/v1/leaderboard');
api.submitScore(1500, 'classic').then(result => console.log(result));
```

## Testing
Use the provided test scripts to validate API functionality:
```bash
# Run API tests
python manage.py test leaderboard.tests

# Load testing
locust -f tests/load_test.py --host=http://localhost:8000
```

## Support
For API support and questions:
- Email: api-support@gamingleaderboard.com
- Documentation: https://docs.gamingleaderboard.com
- Status Page: https://status.gamingleaderboard.com 