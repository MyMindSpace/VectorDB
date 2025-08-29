const astraDB = require('../config/astradb');
const { v4: uuidv4 } = require('uuid');

class VectorService {
  constructor() {
    this.collection = null;
  }

  async initialize() {
    if (!this.collection) {
      this.collection = await astraDB.connect();
    }
    return this.collection;
  }

  // Create a new vector embedding
  async createVector(vectorData) {
    try {
      await this.initialize();

      const document = {
        _id: uuidv4(),
        vector: vectorData.vector,
        metadata: {
          ...vectorData.metadata,
          dimensions: vectorData.vector.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };

      const result = await this.collection.insertOne(document);
      
      return {
        id: document._id,
        ...document,
        insertedId: result.insertedId
      };
    } catch (error) {
      throw new Error(`Failed to create vector: ${error.message}`);
    }
  }

  // Get vector by ID
  async getVectorById(id) {
    try {
      await this.initialize();

      const result = await this.collection.findOne({ _id: id });
      
      if (!result) {
        throw new Error('Vector not found');
      }

      return {
        id: result._id,
        vector: result.vector,
        metadata: result.metadata
      };
    } catch (error) {
      throw new Error(`Failed to get vector: ${error.message}`);
    }
  }

  // Update vector
  async updateVector(id, updateData) {
    try {
      await this.initialize();

      const updateDoc = {};
      
      if (updateData.vector) {
        updateDoc.vector = updateData.vector;
      }
      
      if (updateData.metadata) {
        updateDoc.metadata = {
          ...updateData.metadata,
          updated_at: new Date().toISOString()
        };
        
        if (updateData.vector) {
          updateDoc.metadata.dimensions = updateData.vector.length;
        }
      }

      const result = await this.collection.findOneAndUpdate(
        { _id: id },
        { $set: updateDoc },
        { returnDocument: 'after' }
      );

      if (!result) {
        throw new Error('Vector not found');
      }

      return {
        id: result._id,
        vector: result.vector,
        metadata: result.metadata
      };
    } catch (error) {
      throw new Error(`Failed to update vector: ${error.message}`);
    }
  }

  // Delete vector
  async deleteVector(id) {
    try {
      await this.initialize();

      const result = await this.collection.deleteOne({ _id: id });
      
      if (result.deletedCount === 0) {
        throw new Error('Vector not found');
      }

      return { deleted: true, id };
    } catch (error) {
      throw new Error(`Failed to delete vector: ${error.message}`);
    }
  }

  // List vectors with pagination
  async listVectors(options = {}) {
    try {
      await this.initialize();

      const {
        page = 1,
        limit = 10,
        user_id,
        source_type,
        sort = '-created_at'
      } = options;

      // Build filter
      const filter = {};
      if (user_id) filter['metadata.user_id'] = user_id;
      if (source_type) filter['metadata.source_type'] = source_type;

      // Calculate skip
      const skip = (page - 1) * limit;

      // Build sort object
      const sortField = sort.startsWith('-') ? sort.slice(1) : sort;
      const sortDirection = sort.startsWith('-') ? -1 : 1;
      const sortObj = {};
      sortObj[`metadata.${sortField}`] = sortDirection;

      // Execute query
      const cursor = this.collection.find(filter, {
        sort: sortObj,
        limit: parseInt(limit),
        skip: parseInt(skip)
      });

      const vectors = [];
      for await (const doc of cursor) {
        vectors.push({
          id: doc._id,
          vector: doc.vector,
          metadata: doc.metadata
        });
      }

      // Get total count for pagination
      const total = await this.collection.countDocuments(filter);

      return {
        vectors,
        pagination: {
          current_page: parseInt(page),
          per_page: parseInt(limit),
          total_items: total,
          total_pages: Math.ceil(total / limit),
          has_next: page * limit < total,
          has_prev: page > 1
        }
      };
    } catch (error) {
      throw new Error(`Failed to list vectors: ${error.message}`);
    }
  }

  // Similarity search
  async findSimilarVectors(queryVector, options = {}) {
    try {
      await this.initialize();

      const {
        limit = 10,
        filters = {}
      } = options;

      // Build filter
      const filter = {};
      if (filters.user_id) filter['metadata.user_id'] = filters.user_id;
      if (filters.source_type) filter['metadata.source_type'] = filters.source_type;
      if (filters.source_id) filter['metadata.source_id'] = filters.source_id;
      if (filters.tags) filter['metadata.tags'] = { $in: filters.tags };
      if (filters.created_after) filter['metadata.created_at'] = { $gte: filters.created_after };
      if (filters.created_before) {
        filter['metadata.created_at'] = {
          ...(filter['metadata.created_at'] || {}),
          $lte: filters.created_before
        };
      }

      // Perform vector similarity search
      const cursor = this.collection.find(
        filter,
        {
          sort: { $vector: queryVector },
          limit: parseInt(limit),
          includeSimilarity: true
        }
      );

      const results = [];
      for await (const doc of cursor) {
        results.push({
          id: doc._id,
          vector: doc.vector,
          metadata: doc.metadata,
          similarity_score: doc.$similarity
        });
      }

      return {
        query_vector_dimensions: queryVector.length,
        results,
        total_results: results.length
      };
    } catch (error) {
      throw new Error(`Failed to find similar vectors: ${error.message}`);
    }
  }

  // Batch operations
  async createVectorsBatch(vectorsData) {
    try {
      await this.initialize();

      const documents = vectorsData.map(vectorData => ({
        _id: uuidv4(),
        vector: vectorData.vector,
        metadata: {
          ...vectorData.metadata,
          dimensions: vectorData.vector.length,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      }));

      const result = await this.collection.insertMany(documents);

      return {
        inserted_count: result.insertedCount,
        inserted_ids: result.insertedIds,
        vectors: documents.map(doc => ({
          id: doc._id,
          vector: doc.vector,
          metadata: doc.metadata
        }))
      };
    } catch (error) {
      throw new Error(`Failed to create vectors batch: ${error.message}`);
    }
  }

  // Get collection statistics
  async getStatistics() {
    try {
      await this.initialize();

      const total = await this.collection.estimatedDocumentCount();
      
      // Get source type distribution
      const sourceTypePipeline = [
        { $group: { _id: '$metadata.source_type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ];
      
      const sourceTypes = await this.collection.aggregate(sourceTypePipeline).toArray();

      // Get dimension distribution
      const dimensionPipeline = [
        { $group: { _id: '$metadata.dimensions', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ];
      
      const dimensions = await this.collection.aggregate(dimensionPipeline).toArray();

      return {
        total_vectors: total,
        source_type_distribution: sourceTypes,
        dimension_distribution: dimensions,
        collection_name: 'vector_embeddings'
      };
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

module.exports = new VectorService();
