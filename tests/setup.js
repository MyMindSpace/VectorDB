// Test setup file
const { DataAPIClient } = require('@datastax/astra-db-ts');

// Mock AstraDB for testing
jest.mock('@datastax/astra-db-ts', () => ({
  DataAPIClient: jest.fn().mockImplementation(() => ({
    db: jest.fn().mockReturnValue({
      createCollection: jest.fn().mockResolvedValue({
        insertOne: jest.fn().mockResolvedValue({ insertedId: 'test-id' }),
        insertMany: jest.fn().mockResolvedValue({ insertedCount: 1, insertedIds: ['test-id'] }),
        findOne: jest.fn().mockResolvedValue({ _id: 'test-id', vector: [1, 2, 3], metadata: {} }),
        find: jest.fn().mockReturnValue({
          [Symbol.asyncIterator]: async function* () {
            yield { _id: 'test-id', vector: [1, 2, 3], metadata: {}, $similarity: 0.95 };
          },
          toArray: jest.fn().mockResolvedValue([])
        }),
        findOneAndUpdate: jest.fn().mockResolvedValue({ _id: 'test-id', vector: [1, 2, 3], metadata: {} }),
        deleteOne: jest.fn().mockResolvedValue({ deletedCount: 1 }),
        countDocuments: jest.fn().mockResolvedValue(100),
        estimatedDocumentCount: jest.fn().mockResolvedValue(100),
        aggregate: jest.fn().mockReturnValue({ toArray: jest.fn().mockResolvedValue([]) })
      })
    }),
    close: jest.fn().mockResolvedValue(true)
  }))
}));

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.ASTRA_DB_ID = 'test-db-id';
process.env.ASTRA_DB_REGION = 'test-region';
process.env.ASTRA_DB_KEYSPACE = 'test-keyspace';
process.env.ASTRA_DB_APPLICATION_TOKEN = 'test-token';
process.env.ASTRA_DB_API_ENDPOINT = 'https://test-endpoint.apps.astra.datastax.com';
process.env.API_KEY = 'mymindspace-vectordb-api-key-2024-secure';
process.env.DEFAULT_VECTOR_DIMENSIONS = '1536';
process.env.MAX_VECTOR_DIMENSIONS = '4096';
process.env.MAX_BATCH_SIZE = '100';

// Global test utilities
global.generateTestVector = (dimensions = 1536) => {
  return Array.from({ length: dimensions }, () => Math.random() - 0.5);
};

global.generateTestMetadata = () => ({
  source_type: 'journal',
  source_id: 'test-entry-123',
  content_preview: 'This is a test journal entry',
  user_id: 'test-user-456',
  model_version: 'text-embedding-004',
  tags: ['test', 'example']
});

// Cleanup after tests
afterAll(async () => {
  // Any cleanup needed
});

console.log('Test environment setup complete');
