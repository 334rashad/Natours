// Error with an HTTP status code; the error middleware at the bottom sends it
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    // this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    // this.isOperational = true;
  }
}

export default AppError;
