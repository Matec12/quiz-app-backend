const crypto = require("crypto");
const _ = require("lodash");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const helpers = require("../utils/helpers");
const OperationalError = require("../utils/operationalError");

exports.userCreate = catchAsync(async (req, res, next) => {
  // select only data needed to be saved to the database.
  const fieldsArr = ["email", "username", "password", "confirmPassword"];

  const allowFields = _.pick(req.body, fieldsArr);

  // create new user

  const user = new User(allowFields);

  let message =
    "registration successful, kindly check your email for next step";

  const emailStatus = await helpers.sendVerificationEmail(req, user);
  await user.save();

  if (emailStatus === "sent") {
    helpers.generateTokenAndUserData(200, user, res, message);
  } else {
    return next(
      new OperationalError("Something went wrong, kindly try again", 500)
    );
  }
});

exports.verifyEmail = catchAsync(async (req, res, next) => {
  const oneTimeToken = req.params.oneTimeToken;
  const hashedOneTimeToken = crypto
    .createHash("sha256")
    .update(oneTimeToken)
    .digest("hex");

  const user = await User.findOne({
    oneTimeToken: hashedOneTimeToken,
    oneTimeTokenExpires: { $gt: Date.now() },
  }); //Look up user base on oneTimeToken

  if (!user) {
    return next(
      new OperationalError("token expired, kindly request a new one", 404)
    );
  }

  try {
    // If user exist set email confirmation to activated and delete oneTimeToken.
    user.emailConfirmationStatus = true;

    user.oneTimeToken = undefined;
    user.oneTimeTokenExpires = undefined;

    await user.save({ validateBeforeSave: false });

    res.status(200).json({
      status: "success",
      message: "Email successfully activated",
    });
  } catch (err) {
    return next(
      new OperationalError("Something went wrong, kindly try again", 500)
    );
  }
});

exports.resendVerificationEmail = catchAsync(async (req, res, next) => {
  const email = req.body.email;

  const user = await User.findOne({ email: email });

  if (!user) {
    return next(new OperationalError("Email address not found", 404));
  }

  if (user.emailConfirmationStatus) {
    return next(new OperationalError("Your account is already activated", 406));
  }

  // Delete oneTimeToken  and oneTimeTokenExpires
  (user.oneTimeToken = undefined), (user.oneTimeTokenExpires = undefined);
  await user.save({ validateBeforeSave: false });

  const emailStatus = await helpers.sendVerificationEmail(req, user);

  if (emailStatus === "sent") {
    res.status(200).json({
      status: "success",
      message: "Verification email sent successfully!",
    });
  } else {
    return next(
      new OperationalError("Something went wrong, kindly try again", 500)
    );
  }
});

exports.login = catchAsync(async (req, res, next) => {
  const { username, password } = req.body;

  // Check if both email and password are provided
  if (!username || !password) {
    return next(
      new OperationalError("Email and Password must be provided", 400, 1)
    );
  }

  // If password and email is provided, fetch user and vet password
  const user = await User.findOne({
    $or: [{ email: username }, { username: username }],
  }).select("+password");

  // if password and email does not exist then throw error
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(
      new OperationalError("Invalid email address or password", 400, 1)
    );
  }

  helpers.generateTokenAndUserData(200, user, res, "login successful");
});
