/**
 * Vector utility functions for mathematical operations and data processing
 */

class VectorUtils {
  
  // Calculate cosine similarity between two vectors
  static cosineSimilarity(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vectorA.length; i++) {
      dotProduct += vectorA[i] * vectorB[i];
      normA += vectorA[i] * vectorA[i];
      normB += vectorB[i] * vectorB[i];
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    
    if (magnitude === 0) {
      return 0;
    }

    return dotProduct / magnitude;
  }

  // Calculate Euclidean distance between two vectors
  static euclideanDistance(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let sum = 0;
    for (let i = 0; i < vectorA.length; i++) {
      const diff = vectorA[i] - vectorB[i];
      sum += diff * diff;
    }

    return Math.sqrt(sum);
  }

  // Normalize a vector to unit length
  static normalizeVector(vector) {
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    
    if (magnitude === 0) {
      return new Array(vector.length).fill(0);
    }

    return vector.map(val => val / magnitude);
  }

  // Calculate vector magnitude (L2 norm)
  static magnitude(vector) {
    return Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  }

  // Calculate dot product of two vectors
  static dotProduct(vectorA, vectorB) {
    if (vectorA.length !== vectorB.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    return vectorA.reduce((sum, val, i) => sum + val * vectorB[i], 0);
  }

  // Validate vector format and dimensions
  static validateVector(vector, expectedDimensions = null) {
    if (!Array.isArray(vector)) {
      throw new Error('Vector must be an array');
    }

    if (vector.length === 0) {
      throw new Error('Vector cannot be empty');
    }

    if (!vector.every(val => typeof val === 'number' && !isNaN(val))) {
      throw new Error('Vector must contain only valid numbers');
    }

    if (expectedDimensions && vector.length !== expectedDimensions) {
      throw new Error(`Vector must have exactly ${expectedDimensions} dimensions`);
    }

    const maxDimensions = parseInt(process.env.MAX_VECTOR_DIMENSIONS) || 4096;
    if (vector.length > maxDimensions) {
      throw new Error(`Vector exceeds maximum dimensions: ${maxDimensions}`);
    }

    return true;
  }

  // Generate random vector for testing
  static generateRandomVector(dimensions, min = -1, max = 1) {
    return Array.from({ length: dimensions }, () => 
      Math.random() * (max - min) + min
    );
  }

  // Calculate centroid of multiple vectors
  static calculateCentroid(vectors) {
    if (!vectors.length) {
      throw new Error('Cannot calculate centroid of empty vector set');
    }

    const dimensions = vectors[0].length;
    
    // Validate all vectors have same dimensions
    if (!vectors.every(v => v.length === dimensions)) {
      throw new Error('All vectors must have the same dimensions');
    }

    const centroid = new Array(dimensions).fill(0);
    
    // Sum all vectors
    for (const vector of vectors) {
      for (let i = 0; i < dimensions; i++) {
        centroid[i] += vector[i];
      }
    }

    // Average
    return centroid.map(val => val / vectors.length);
  }

  // Convert vector to different precision
  static roundVector(vector, precision = 6) {
    return vector.map(val => parseFloat(val.toFixed(precision)));
  }

  // Batch process vectors with a function
  static batchProcess(vectors, processFn, batchSize = 100) {
    const results = [];
    
    for (let i = 0; i < vectors.length; i += batchSize) {
      const batch = vectors.slice(i, i + batchSize);
      const batchResults = batch.map(processFn);
      results.push(...batchResults);
    }

    return results;
  }

  // Check if vector contains infinite or NaN values
  static isValidVector(vector) {
    return vector.every(val => 
      typeof val === 'number' && 
      !isNaN(val) && 
      isFinite(val)
    );
  }

  // Calculate statistics for a set of vectors
  static calculateVectorStatistics(vectors) {
    if (!vectors.length) {
      return null;
    }

    const dimensions = vectors[0].length;
    const stats = {
      count: vectors.length,
      dimensions,
      mean_magnitude: 0,
      min_magnitude: Infinity,
      max_magnitude: -Infinity,
      dimension_stats: Array.from({ length: dimensions }, () => ({
        min: Infinity,
        max: -Infinity,
        mean: 0,
        std: 0
      }))
    };

    // Calculate magnitudes and dimension statistics
    const magnitudes = [];
    const dimensionValues = Array.from({ length: dimensions }, () => []);

    for (const vector of vectors) {
      const magnitude = this.magnitude(vector);
      magnitudes.push(magnitude);
      
      stats.min_magnitude = Math.min(stats.min_magnitude, magnitude);
      stats.max_magnitude = Math.max(stats.max_magnitude, magnitude);

      // Collect values for each dimension
      for (let i = 0; i < dimensions; i++) {
        const val = vector[i];
        dimensionValues[i].push(val);
        
        stats.dimension_stats[i].min = Math.min(stats.dimension_stats[i].min, val);
        stats.dimension_stats[i].max = Math.max(stats.dimension_stats[i].max, val);
      }
    }

    // Calculate means
    stats.mean_magnitude = magnitudes.reduce((sum, mag) => sum + mag, 0) / magnitudes.length;
    
    for (let i = 0; i < dimensions; i++) {
      const values = dimensionValues[i];
      stats.dimension_stats[i].mean = values.reduce((sum, val) => sum + val, 0) / values.length;
      
      // Calculate standard deviation
      const variance = values.reduce((sum, val) => {
        const diff = val - stats.dimension_stats[i].mean;
        return sum + diff * diff;
      }, 0) / values.length;
      
      stats.dimension_stats[i].std = Math.sqrt(variance);
    }

    return stats;
  }
}

module.exports = VectorUtils;
