class OperationalError extends Error {
  constructor(message, statusCode, errorCode) {
    super(message, statusCode);
    console.log(message);

    this.statusCode = statusCode;
    this.status = `${this.statusCode}`.startsWith("4") ? "fail" : "error";
    this.isOperational = true;
    this.errorCode = errorCode;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = OperationalError;
