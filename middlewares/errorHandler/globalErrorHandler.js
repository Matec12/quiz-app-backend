const OperationalError = require("../../utils/operationalError");

const handleDuplicateKeys = (err) => {
  const duplicateField = Object.keys(err.keyValue)[0];
  return new OperationalError(
    `${err.keyValue[duplicateField]} already exist`,
    400
  );
};

const handleValidatorError = (err) => {
  const field = Object.keys(err.errors)[0];
  const message = err.errors[field].properties?.message;
  return new OperationalError(message, 500);
};

const handleJWTError = (err) => {
  return new OperationalError("Invalid token provided", 401);
};

const handleJWTExpiredError = (err) => {
  return new OperationalError("Session expired, kindly re-login", 401);
};

const handleCastError = (err) => {
  const value = /".*?"/g.exec(err.message);
  const message = `${value} is a wrong input type for the field specified for`;
  return new OperationalError(message, 440);
};

const developmentError = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    console.log("Error", err);

    res.status(500).json({
      status: "error",
      message: "something went wrong [err]",
    });
  }

  // res.status(err.statusCode).json({
  //     status : err.status,
  //     message : err.message,
  //     error : err,
  // });
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  console.log(err);

  if (process.env.NODE_ENV) {
    if (err.code === 11000) {
      err = handleDuplicateKeys(err);
    }

    if (
      err.message.includes("validation failed") ||
      err.name === "ValidationError"
    ) {
      err = handleValidatorError(err);
    }

    if (err.name === "JsonWebTokenError") {
      err = handleJWTError(err);
    }

    if (err.name === "TokenExpiredError") {
      err = handleJWTExpiredError(err);
    }

    if (err.name === "MulterError") {
      err = handleMulterError(err);
    }

    if (err.name === "CastError") {
      err = handleCastError(err);
    }

    developmentError(err, res);
  }
};
