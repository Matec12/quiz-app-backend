class OperationalError extends Error {
  constructor(message,statusCode){
    super(message,statusCode);

    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this,this.constructor);
  }
}

module.exports = OperationalError;