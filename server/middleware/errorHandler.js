// Global error-handling middleware for Express
const errorHandler = (err, req, res, _next) => {
  console.error(err.stack || err.message);

  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({ message: 'Validation error', errors: messages });
  }

  if (err.name === 'CastError') {
    return res.status(400).json({ message: 'Invalid ID format' });
  }

  if (err.code === 11000) {
    return res.status(409).json({ message: 'Duplicate key error', field: Object.keys(err.keyPattern) });
  }

  const status = err.status || 500;
  res.status(status).json({ message: err.message || 'Internal server error' });
};

export default errorHandler;
