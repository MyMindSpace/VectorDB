const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error('❌ Error:', err);

  // AstraDB specific errors
  if (err.name === 'DataAPIResponseError') {
    error.message = 'Database operation failed';
    error.statusCode = 500;
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    const message = Object.values(err.details).map(val => val.message);
    error = {
      message: message.join(', '),
      statusCode: 400
    };
  }

  // Duplicate key error
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = {
      message,
      statusCode: 400
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = {
      message,
      statusCode: 401
    };
  }

  // Cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      message,
      statusCode: 404
    };
  }

  // Vector dimension mismatch
  if (err.message && err.message.includes('dimension')) {
    error = {
      message: 'Vector dimension mismatch',
      statusCode: 400
    };
  }

  // Default error
  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
