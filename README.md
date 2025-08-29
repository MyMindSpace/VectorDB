# VectorDB Service

Production-ready vector database CRUD service built with Node.js and AstraDB for the MyMindSpace ML platform.

## Features

- Full CRUD operations for vector embeddings
- Cosine similarity-based search
- Batch processing and metadata management
- API key authentication with rate limiting
- Health monitoring and Docker support
- Google Cloud Run optimized

## Architecture

The service provides a REST API layer between ML services and AstraDB for vector storage and similarity operations.

## Quick Start

### Prerequisites
- Node.js 18+
- AstraDB account and database

### Installation
```bash
npm install
cp .env.example .env  # Configure with your AstraDB credentials
npm start
```

## Configuration

### Environment Variables
```env
ASTRA_DB_ID=your-database-id
ASTRA_DB_REGION=your-region
ASTRA_DB_KEYSPACE=vectordb
ASTRA_DB_APPLICATION_TOKEN=your-token
PORT=3000
API_KEY=your-secure-api-key
NODE_ENV=production
```

## API Reference

### Authentication
Include API key in requests:
```http
X-API-Key: your-api-key
```

### Endpoints
- `POST /api/vectors` - Create vector
- `GET /api/vectors/:id` - Get vector by ID
- `PUT /api/vectors/:id` - Update vector
- `DELETE /api/vectors/:id` - Delete vector
- `GET /api/vectors` - List vectors (paginated)
- `POST /api/vectors/similarity` - Find similar vectors
- `POST /api/vectors/batch` - Bulk create vectors
- `GET /api/vectors/stats` - Collection statistics
- `GET /health` - Health check

### Example: Create Vector
```json
POST /api/vectors
{
  "vector": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "source_type": "journal",
    "source_id": "journal_123",
    "user_id": "user_456",
    "model_version": "text-embedding-004"
  }
}
```

### Example: Similarity Search
```json
POST /api/vectors/similarity
{
  "vector": [0.1, 0.2, 0.3, ...],
  "limit": 10,
  "filters": {"user_id": "user_456"}
}
```

## Data Schema

### Vector Document
```json
{
  "_id": "unique-uuid",
  "vector": [0.1, 0.2, 0.3, ...],
  "metadata": {
    "source_type": "journal|mood|activity|therapy",
    "source_id": "reference-id",
    "user_id": "user-identifier",
    "model_version": "embedding-model-version",
    "created_at": "2024-01-01T00:00:00.000Z",
    "updated_at": "2024-01-01T00:00:00.000Z"
  }
}
```

## Health Check

```http
GET /health
```

Returns service status and database connectivity information.

## Integration Example

```python
import requests

# Create vector
response = requests.post(
    "https://your-service/api/vectors",
    headers={"X-API-Key": "your-api-key"},
    json={
        "vector": embedding_array,
        "metadata": {
            "source_type": "journal",
            "user_id": "user_456"
        }
    }
)

# Find similar vectors
similar = requests.post(
    "https://your-service/api/vectors/similarity",
    headers={"X-API-Key": "your-api-key"},
    json={"vector": query_embedding, "limit": 5}
)
```

## License

MIT License - see LICENSE file for details.

## Testing

```bash
npm test                # Run all tests
npm run test:coverage   # Run with coverage
npm run test:watch      # Watch mode
```

## Deployment

### Docker
```bash
npm run docker:build
npm run docker:run
```

### Google Cloud Run
```bash
gcloud builds submit --tag gcr.io/PROJECT_ID/vectordb-service
gcloud run deploy vectordb-service --image gcr.io/PROJECT_ID/vectordb-service
```


