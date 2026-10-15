export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  let message = err.message || 'Internal Server Error';

  // Bad JSON in request body
  if (err.type === 'entity.parse.failed' || err instanceof SyntaxError) {
    statusCode = 400;
    message = 'Invalid JSON in request payload.';
  }

  // Mongoose Bad ObjectId (CastError)
  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found: invalid ID format';
  }

  // Mongoose Duplicate Key
  if (err.code === 11000) {
    statusCode = 409;
    const keyPattern = err.keyPattern || err.keyValue || err.errorResponse?.keyPattern || {};
    const field = Object.keys(keyPattern)[0] || 'Field';
    const label = field === 'employeeId' ? 'Employee ID' : field === 'email' ? 'Email' : field;
    message = `Duplicate value for ${label}. It must be unique.`;
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map(val => val.message).join('. ');
  }

  console.error(`[Server Error] ${req.method} ${req.originalUrl} - Status: ${statusCode} - ${message}`);
  if (statusCode === 500 && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};
