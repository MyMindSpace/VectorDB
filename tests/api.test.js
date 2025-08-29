const request = require('supertest');
const app = require('../server');

const API_KEY = 'mymindspace-vectordb-api-key-2024-secure';
const BASE_URL = '/api/vectors';

describe('VectorDB API Endpoints', () => {
  
  describe('Health Check', () => {
    test('GET /health should return service status', async () => {
      const response = await request(app)
        .get('/health');
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.service).toBe('VectorDB CRUD Service');
    });
  });

  describe('Authentication', () => {
    test('should reject requests without API key', async () => {
      const response = await request(app)
        .get(BASE_URL);
        
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('API key required');
    });

    test('should reject requests with invalid API key', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .set('X-API-Key', 'invalid-key');
        
      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Invalid API key');
    });

    test('should accept requests with valid API key', async () => {
      const response = await request(app)
        .get(BASE_URL)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Vector CRUD Operations', () => {
    const testVector = {
      vector: generateTestVector(1536),
      metadata: generateTestMetadata()
    };

    test('POST /api/vectors should create a new vector', async () => {
      const response = await request(app)
        .post(BASE_URL)
        .set('X-API-Key', API_KEY)
        .send(testVector);
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.vector).toEqual(testVector.vector);
      expect(response.body.message).toBe('Vector created successfully');
    });

    test('POST /api/vectors should validate vector dimensions', async () => {
      const invalidVector = {
        vector: [1, 2], // Too short
        metadata: generateTestMetadata()
      };

      const response = await request(app)
        .post(BASE_URL)
        .set('X-API-Key', API_KEY)
        .send(invalidVector);
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation Error');
    });

    test('POST /api/vectors should validate required metadata', async () => {
      const invalidVector = {
        vector: generateTestVector(1536),
        metadata: {
          // Missing required fields
          content_preview: 'Test content'
        }
      };

      const response = await request(app)
        .post(BASE_URL)
        .set('X-API-Key', API_KEY)
        .send(invalidVector);
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    test('GET /api/vectors/:id should retrieve vector by ID', async () => {
      const response = await request(app)
        .get(`${BASE_URL}/test-id`)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data).toHaveProperty('vector');
      expect(response.body.data).toHaveProperty('metadata');
    });

    test('GET /api/vectors/:id should return 404 for non-existent vector', async () => {
      // Mock the service to throw "Vector not found" error
      const vectorService = require('../services/vectorService');
      jest.spyOn(vectorService, 'getVectorById').mockRejectedValueOnce(new Error('Vector not found'));

      const response = await request(app)
        .get(`${BASE_URL}/non-existent-id`)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Vector not found');
    });

    test('PUT /api/vectors/:id should update vector', async () => {
      const updateData = {
        metadata: {
          content_preview: 'Updated content preview',
          tags: ['updated', 'test']
        }
      };

      const response = await request(app)
        .put(`${BASE_URL}/test-id`)
        .set('X-API-Key', API_KEY)
        .send(updateData);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vector updated successfully');
    });

    test('DELETE /api/vectors/:id should delete vector', async () => {
      const response = await request(app)
        .delete(`${BASE_URL}/test-id`)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Vector deleted successfully');
      expect(response.body.data.deleted).toBe(true);
    });

    test('GET /api/vectors should list vectors with pagination', async () => {
      const response = await request(app)
        .get(`${BASE_URL}?page=1&limit=10&user_id=test-user`)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toHaveProperty('current_page');
      expect(response.body.pagination).toHaveProperty('total_items');
    });
  });

  describe('Similarity Search', () => {
    test('POST /api/vectors/similarity should find similar vectors', async () => {
      const searchQuery = {
        vector: generateTestVector(1536),
        limit: 5,
        filters: {
          user_id: 'test-user',
          source_type: 'journal'
        }
      };

      const response = await request(app)
        .post(`${BASE_URL}/similarity`)
        .set('X-API-Key', API_KEY)
        .send(searchQuery);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('results');
      expect(response.body.data).toHaveProperty('query_vector_dimensions');
      expect(response.body.data.results).toBeInstanceOf(Array);
    });

    test('POST /api/vectors/similarity should validate vector dimensions', async () => {
      const invalidQuery = {
        vector: [1, 2], // Too short
        limit: 5
      };

      const response = await request(app)
        .post(`${BASE_URL}/similarity`)
        .set('X-API-Key', API_KEY)
        .send(invalidQuery);
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Batch Operations', () => {
    test('POST /api/vectors/batch should create multiple vectors', async () => {
      const batchData = {
        vectors: [
          {
            vector: generateTestVector(1536),
            metadata: generateTestMetadata()
          },
          {
            vector: generateTestVector(1536),
            metadata: { ...generateTestMetadata(), source_id: 'test-entry-456' }
          }
        ]
      };

      const response = await request(app)
        .post(`${BASE_URL}/batch`)
        .set('X-API-Key', API_KEY)
        .send(batchData);
        
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('inserted_count');
      expect(response.body.data).toHaveProperty('vectors');
      expect(response.body.data.vectors).toBeInstanceOf(Array);
    });

    test('POST /api/vectors/batch should validate batch size limits', async () => {
      const largeBatch = {
        vectors: Array(150).fill(0).map(() => ({
          vector: generateTestVector(1536),
          metadata: generateTestMetadata()
        }))
      };

      const response = await request(app)
        .post(`${BASE_URL}/batch`)
        .set('X-API-Key', API_KEY)
        .send(largeBatch);
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Statistics', () => {
    test('GET /api/vectors/stats should return collection statistics', async () => {
      const response = await request(app)
        .get(`${BASE_URL}/stats`)
        .set('X-API-Key', API_KEY);
        
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('total_vectors');
      expect(response.body.data).toHaveProperty('collection_name');
    });
  });

  describe('Error Handling', () => {
    test('should handle malformed JSON', async () => {
      const response = await request(app)
        .post(BASE_URL)
        .set('X-API-Key', API_KEY)
        .set('Content-Type', 'application/json')
        .send('invalid json');
        
      expect(response.status).toBe(400);
    });

    test('should handle large payloads gracefully', async () => {
      const largeVector = {
        vector: generateTestVector(10000), // Very large vector
        metadata: generateTestMetadata()
      };

      const response = await request(app)
        .post(BASE_URL)
        .set('X-API-Key', API_KEY)
        .send(largeVector);
        
      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should apply rate limiting', async () => {
      // This test would need to be adjusted based on actual rate limits
      // For now, we'll just test that the middleware is applied
      const response = await request(app)
        .get(BASE_URL)
        .set('X-API-Key', API_KEY);
        
      expect(response.headers).toHaveProperty('ratelimit-limit');
      expect(response.headers).toHaveProperty('ratelimit-remaining');
    });
  });
});
