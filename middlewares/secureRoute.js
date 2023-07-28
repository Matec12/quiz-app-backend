const jwt = require("jsonwebtoken");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const OperationalError = require("../utils/operationalError");

exports.secureRoute = catchAsync(async (req, res, next) => {
  const headers = req.headers?.authorization;

  if (!headers || !headers.startsWith("Bearer")) {
    return next(
      new OperationalError("kindly login to perform this operation", 401)
    );
  }

  const token = headers?.split(" ")[1];

  if (!token) {
    return next(
      new OperationalError("kindly login to perform this operation", 401)
    );
  }

  const data = jwt.verify(token, process.env.JWT_SECRET);

  // Token can still be valid but the bearer might have been deleted
  // Double check if user exist along with the token;

  const validUser = await User.findById(data.userId);

  if (!validUser) {
    return next(
      new OperationalError(
        "User not found, kindly create an account to continue",
        401
      )
    );
  }

  // If user change password after token has being issue then throw error
  if (validUser.rejectOnPasswordChangeAfterTokenIssued(data.iat)) {
    return next(
      new OperationalError(
        "An update just occur on your account, kindly re-login",
        401
      )
    );
  }

  // Grant Access if no error
  req.user = validUser;
  next();
});
