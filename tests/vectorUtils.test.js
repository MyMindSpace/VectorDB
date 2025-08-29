const VectorUtils = require('../utils/vectorUtils');

describe('VectorUtils', () => {
  
  describe('Cosine Similarity', () => {
    test('should calculate cosine similarity correctly', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      
      const similarity = VectorUtils.cosineSimilarity(vectorA, vectorB);
      expect(similarity).toBe(0);
    });

    test('should return 1 for identical vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2, 3];
      
      const similarity = VectorUtils.cosineSimilarity(vectorA, vectorB);
      expect(similarity).toBeCloseTo(1);
    });

    test('should throw error for different dimensions', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2];
      
      expect(() => {
        VectorUtils.cosineSimilarity(vectorA, vectorB);
      }).toThrow('Vectors must have the same dimensions');
    });
  });

  describe('Euclidean Distance', () => {
    test('should calculate euclidean distance correctly', () => {
      const vectorA = [0, 0, 0];
      const vectorB = [3, 4, 0];
      
      const distance = VectorUtils.euclideanDistance(vectorA, vectorB);
      expect(distance).toBe(5);
    });

    test('should return 0 for identical vectors', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [1, 2, 3];
      
      const distance = VectorUtils.euclideanDistance(vectorA, vectorB);
      expect(distance).toBe(0);
    });
  });

  describe('Vector Normalization', () => {
    test('should normalize vector to unit length', () => {
      const vector = [3, 4, 0];
      const normalized = VectorUtils.normalizeVector(vector);
      
      expect(normalized).toEqual([0.6, 0.8, 0]);
      expect(VectorUtils.magnitude(normalized)).toBeCloseTo(1);
    });

    test('should handle zero vectors', () => {
      const vector = [0, 0, 0];
      const normalized = VectorUtils.normalizeVector(vector);
      
      expect(normalized).toEqual([0, 0, 0]);
    });
  });

  describe('Vector Magnitude', () => {
    test('should calculate magnitude correctly', () => {
      const vector = [3, 4, 0];
      const magnitude = VectorUtils.magnitude(vector);
      
      expect(magnitude).toBe(5);
    });

    test('should return 0 for zero vector', () => {
      const vector = [0, 0, 0];
      const magnitude = VectorUtils.magnitude(vector);
      
      expect(magnitude).toBe(0);
    });
  });

  describe('Dot Product', () => {
    test('should calculate dot product correctly', () => {
      const vectorA = [1, 2, 3];
      const vectorB = [4, 5, 6];
      
      const dotProduct = VectorUtils.dotProduct(vectorA, vectorB);
      expect(dotProduct).toBe(32); // 1*4 + 2*5 + 3*6
    });

    test('should return 0 for orthogonal vectors', () => {
      const vectorA = [1, 0, 0];
      const vectorB = [0, 1, 0];
      
      const dotProduct = VectorUtils.dotProduct(vectorA, vectorB);
      expect(dotProduct).toBe(0);
    });
  });

  describe('Vector Validation', () => {
    test('should validate correct vectors', () => {
      const vector = [1.5, -2.3, 0, 4.7];
      
      expect(() => {
        VectorUtils.validateVector(vector);
      }).not.toThrow();
    });

    test('should reject non-array inputs', () => {
      expect(() => {
        VectorUtils.validateVector("not an array");
      }).toThrow('Vector must be an array');
    });

    test('should reject empty vectors', () => {
      expect(() => {
        VectorUtils.validateVector([]);
      }).toThrow('Vector cannot be empty');
    });

    test('should reject vectors with non-numbers', () => {
      expect(() => {
        VectorUtils.validateVector([1, 2, "three", 4]);
      }).toThrow('Vector must contain only valid numbers');
    });

    test('should reject vectors with NaN values', () => {
      expect(() => {
        VectorUtils.validateVector([1, 2, NaN, 4]);
      }).toThrow('Vector must contain only valid numbers');
    });

    test('should validate expected dimensions', () => {
      const vector = [1, 2, 3];
      
      expect(() => {
        VectorUtils.validateVector(vector, 3);
      }).not.toThrow();
      
      expect(() => {
        VectorUtils.validateVector(vector, 4);
      }).toThrow('Vector must have exactly 4 dimensions');
    });
  });

  describe('Random Vector Generation', () => {
    test('should generate vector with correct dimensions', () => {
      const vector = VectorUtils.generateRandomVector(100);
      
      expect(vector).toHaveLength(100);
      expect(vector.every(val => typeof val === 'number')).toBe(true);
    });

    test('should generate values within specified range', () => {
      const vector = VectorUtils.generateRandomVector(1000, -5, 5);
      
      expect(vector.every(val => val >= -5 && val <= 5)).toBe(true);
    });
  });

  describe('Centroid Calculation', () => {
    test('should calculate centroid correctly', () => {
      const vectors = [
        [0, 0, 0],
        [6, 0, 0],
        [0, 6, 0],
        [0, 0, 6]
      ];
      
      const centroid = VectorUtils.calculateCentroid(vectors);
      expect(centroid).toEqual([1.5, 1.5, 1.5]);
    });

    test('should throw error for empty vector set', () => {
      expect(() => {
        VectorUtils.calculateCentroid([]);
      }).toThrow('Cannot calculate centroid of empty vector set');
    });

    test('should throw error for mismatched dimensions', () => {
      const vectors = [
        [1, 2, 3],
        [4, 5] // Different dimensions
      ];
      
      expect(() => {
        VectorUtils.calculateCentroid(vectors);
      }).toThrow('All vectors must have the same dimensions');
    });
  });

  describe('Vector Precision', () => {
    test('should round vector to specified precision', () => {
      const vector = [1.123456789, 2.987654321, -3.456789123];
      const rounded = VectorUtils.roundVector(vector, 3);
      
      expect(rounded).toEqual([1.123, 2.988, -3.457]);
    });
  });

  describe('Vector Validity Check', () => {
    test('should identify valid vectors', () => {
      const validVector = [1.5, -2.3, 0, 4.7];
      expect(VectorUtils.isValidVector(validVector)).toBe(true);
    });

    test('should identify invalid vectors with NaN', () => {
      const invalidVector = [1, 2, NaN, 4];
      expect(VectorUtils.isValidVector(invalidVector)).toBe(false);
    });

    test('should identify invalid vectors with infinity', () => {
      const invalidVector = [1, 2, Infinity, 4];
      expect(VectorUtils.isValidVector(invalidVector)).toBe(false);
    });
  });

  describe('Batch Processing', () => {
    test('should process vectors in batches', () => {
      const vectors = Array.from({ length: 250 }, () => [1, 2, 3]);
      const processFn = (vector) => vector.map(x => x * 2);
      
      const results = VectorUtils.batchProcess(vectors, processFn, 100);
      
      expect(results).toHaveLength(250);
      expect(results[0]).toEqual([2, 4, 6]);
    });
  });

  describe('Vector Statistics', () => {
    test('should calculate vector statistics correctly', () => {
      const vectors = [
        [1, 2, 3],
        [4, 5, 6],
        [7, 8, 9]
      ];
      
      const stats = VectorUtils.calculateVectorStatistics(vectors);
      
      expect(stats.count).toBe(3);
      expect(stats.dimensions).toBe(3);
      expect(stats.dimension_stats).toHaveLength(3);
      expect(stats.dimension_stats[0].min).toBe(1);
      expect(stats.dimension_stats[0].max).toBe(7);
      expect(stats.dimension_stats[0].mean).toBeCloseTo(4);
    });

    test('should return null for empty vector set', () => {
      const stats = VectorUtils.calculateVectorStatistics([]);
      expect(stats).toBeNull();
    });
  });
});
