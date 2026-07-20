const errorHandler = (err, req, res, _next) => {
  console.error('[Error]', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed.', details: err.errors });
  }

  if (err.name === 'CastError' && err.kind === 'ObjectId') {
    return res.status(400).json({ error: 'Invalid ID format.' });
  }

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File size exceeds limit.' });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 ? 'Server error' : err.message;

  res.status(statusCode).json({ error: message });
};

const notFound = (req, res) => {
  res.status(404).json({ error: 'Endpoint not found.' });
};

module.exports = { errorHandler, notFound };
