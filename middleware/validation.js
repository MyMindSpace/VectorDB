const Joi = require('joi');

// Vector validation schema
const vectorSchema = Joi.object({
  vector: Joi.array()
    .items(Joi.number())
    .min(100) // Minimum reasonable vector size
    .max(parseInt(process.env.MAX_VECTOR_DIMENSIONS) || 4096)
    .required()
    .messages({
      'array.base': 'Vector must be an array of numbers',
      'array.min': 'Vector must have at least 100 dimensions',
      'array.max': `Vector cannot exceed ${process.env.MAX_VECTOR_DIMENSIONS || 4096} dimensions`,
      'any.required': 'Vector is required'
    }),
    
  metadata: Joi.object({
    source_type: Joi.string().valid('journal', 'mood', 'activity', 'therapy', 'meditation', 'other').required(),
    source_id: Joi.string().required(),
    content_preview: Joi.string().max(200).optional(),
    user_id: Joi.string().required(),
    model_version: Joi.string().default('unknown'),
    dimensions: Joi.number().integer().min(1).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    confidence_score: Joi.number().min(0).max(1).optional()
  }).required()
});

// Update vector schema (partial)
const updateVectorSchema = Joi.object({
  vector: Joi.array()
    .items(Joi.number())
    .min(1)
    .max(parseInt(process.env.MAX_VECTOR_DIMENSIONS) || 4096)
    .optional(),
    
  metadata: Joi.object({
    source_type: Joi.string().valid('journal', 'mood', 'activity', 'therapy', 'meditation', 'other').optional(),
    source_id: Joi.string().optional(),
    content_preview: Joi.string().max(200).optional(),
    user_id: Joi.string().optional(),
    model_version: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    confidence_score: Joi.number().min(0).max(1).optional()
  }).optional()
});

// Similarity search schema
const similaritySearchSchema = Joi.object({
  vector: Joi.array()
    .items(Joi.number())
    .min(100) // Minimum reasonable vector size
    .max(parseInt(process.env.MAX_VECTOR_DIMENSIONS) || 4096)
    .required(),
    
  limit: Joi.number().integer().min(1).max(100).default(10),
  
  filters: Joi.object({
    user_id: Joi.string().optional(),
    source_type: Joi.string().valid('journal', 'mood', 'activity', 'therapy', 'meditation', 'other').optional(),
    source_id: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    created_after: Joi.date().optional(),
    created_before: Joi.date().optional()
  }).optional()
});

// Batch operation schema
const batchSchema = Joi.object({
  vectors: Joi.array()
    .items(vectorSchema)
    .min(1)
    .max(parseInt(process.env.MAX_BATCH_SIZE) || 100)
    .required()
});

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    
    if (error) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error',
        details: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    
    next();
  };
};

// Query parameter validation
const validateQuery = (req, res, next) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    user_id: Joi.string().optional(),
    source_type: Joi.string().valid('journal', 'mood', 'activity', 'therapy', 'meditation', 'other').optional(),
    sort: Joi.string().valid('created_at', '-created_at', 'updated_at', '-updated_at').default('-created_at')
  });

  const { error, value } = schema.validate(req.query);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Invalid query parameters',
      details: error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }))
    });
  }
  
  req.query = value;
  next();
};

module.exports = {
  validate,
  validateQuery,
  vectorSchema,
  updateVectorSchema,
  similaritySearchSchema,
  batchSchema
};
