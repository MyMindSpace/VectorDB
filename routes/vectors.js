const express = require('express');
const router = express.Router();
const vectorService = require('../services/vectorService');
const { 
  validate, 
  validateQuery, 
  vectorSchema, 
  updateVectorSchema, 
  similaritySearchSchema, 
  batchSchema 
} = require('../middleware/validation');

// @route   GET /api/vectors/stats
// @desc    Get collection statistics
// @access  Private
router.get('/stats', async (req, res, next) => {
  try {
    const stats = await vectorService.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/vectors/similarity
// @desc    Find similar vectors using cosine similarity
// @access  Private
router.post('/similarity', validate(similaritySearchSchema), async (req, res, next) => {
  try {
    const { vector, limit, filters } = req.body;
    const result = await vectorService.findSimilarVectors(vector, { limit, filters });
    
    res.json({
      success: true,
      data: result,
      message: `Found ${result.results.length} similar vectors`
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/vectors/batch
// @desc    Create multiple vectors in batch
// @access  Private
router.post('/batch', validate(batchSchema), async (req, res, next) => {
  try {
    const { vectors } = req.body;
    const result = await vectorService.createVectorsBatch(vectors);
    
    res.status(201).json({
      success: true,
      data: result,
      message: `Successfully created ${result.inserted_count} vectors`
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/vectors/:id
// @desc    Get vector by ID
// @access  Private
router.get('/:id', async (req, res, next) => {
  try {
    const vector = await vectorService.getVectorById(req.params.id);
    
    res.json({
      success: true,
      data: vector
    });
  } catch (error) {
    if (error.message === 'Vector not found') {
      return res.status(404).json({
        success: false,
        error: 'Vector not found'
      });
    }
    next(error);
  }
});

// @route   PUT /api/vectors/:id
// @desc    Update vector by ID
// @access  Private
router.put('/:id', validate(updateVectorSchema), async (req, res, next) => {
  try {
    const vector = await vectorService.updateVector(req.params.id, req.body);
    
    res.json({
      success: true,
      data: vector,
      message: 'Vector updated successfully'
    });
  } catch (error) {
    if (error.message === 'Vector not found') {
      return res.status(404).json({
        success: false,
        error: 'Vector not found'
      });
    }
    next(error);
  }
});

// @route   DELETE /api/vectors/:id
// @desc    Delete vector by ID
// @access  Private
router.delete('/:id', async (req, res, next) => {
  try {
    const result = await vectorService.deleteVector(req.params.id);
    
    res.json({
      success: true,
      data: result,
      message: 'Vector deleted successfully'
    });
  } catch (error) {
    if (error.message === 'Vector not found') {
      return res.status(404).json({
        success: false,
        error: 'Vector not found'
      });
    }
    next(error);
  }
});

// @route   POST /api/vectors
// @desc    Create a new vector embedding
// @access  Private
router.post('/', validate(vectorSchema), async (req, res, next) => {
  try {
    const vector = await vectorService.createVector(req.body);
    
    res.status(201).json({
      success: true,
      data: vector,
      message: 'Vector created successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/vectors
// @desc    List vectors with pagination and filtering
// @access  Private
router.get('/', validateQuery, async (req, res, next) => {
  try {
    const result = await vectorService.listVectors(req.query);
    
    res.json({
      success: true,
      data: result.vectors,
      pagination: result.pagination
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
