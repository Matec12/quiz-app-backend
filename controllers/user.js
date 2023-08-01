const crypto = require("crypto");
const _ = require("lodash");
const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const helpers = require("../utils/helpers");
const OperationalError = require("../utils/operationalError");
const sendEmail = require("../utils/emails/sendEmail");
const template = require("../utils/emails/templates");

exports.userCreate = catchAsync(async (req, res, next) => {
  // select only data needed to be saved to the database.

  const { email, username, password, confirmPassword } = req.body;

  if (typeof username !== "string" || !helpers.usernameValidator(username)) {
    return next(new OperationalError("Invalid username", 400));
  }

  if (typeof email !== "string" || !helpers.emailValidator(email)) {
    return next(new OperationalError("Invalid email", 400));
  }

  if (typeof password !== "string" || !helpers.passwordValidator(password)) {
    return next(new OperationalError("Invalid password", 400));
  }

  if (password !== confirmPassword) {
    return next(new OperationalError("Passwords do not match", 400));
  }

  // create new user

  const user = new User(req.body);

  let message = req.originalUrl.includes("admin")
    ? "admin created successfully"
    : "registration successful, kindly check your email for next step";

  helpers.assignRole(req, user, "admin");

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
  const { email } = req.body;

  if (typeof email !== "string" || !helpers.emailValidator(email)) {
    return next(new OperationalError("Invalid email", 400));
  }

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
      new OperationalError("Email/Username and Password must be provided", 400)
    );
  }

  // If password and email is provided, fetch user and vet password
  const user = await User.findOne({
    $or: [{ email: username }, { username: username }],
  }).select("+password");

  // if password and email does not exist then throw error
  if (!user || !(await user.checkPassword(password, user.password))) {
    return next(
      new OperationalError("Invalid email/username or password", 400)
    );
  }

  if (req.originalUrl.includes("admin/login") && user.role === "user") {
    return next(
      new OperationalError("sorry, you can not login with this route", 403)
    );
  }

  helpers.generateTokenAndUserData(200, user, res, "login successful");
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // Fetch user with the provided email
  const { email } = req.body;

  if (typeof email !== "string" || !helpers.emailValidator(email)) {
    return next(new OperationalError("Invalid email", 400));
  }

  const user = await User.findOne({ email: email });
  if (!user) {
    return next(new OperationalError("User not found", 400));
  }

  // set password reset Token
  const oneTimeToken = user.generateOneTimeToken(
    process.env.ONE_TIME_TOKEN_VALIDITY
  ); //30 minutes validity

  await user.save({ validateBeforeSave: false });

  // Send token to the provided email
  let resetURL = `${process.env.REDIRECT_URL}/auth/reset-password/${oneTimeToken}`;

  const emailObj = {
    user,
    greeting: "Hello",
    heading: `RESET YOUR PASSWORD.`,

    message: `You have requested to reset your email, Kindly click of the reset button bellow to
          reset. Kindly ignore if you did not request a password reset.`,

    link: resetURL,
    buttonText: "RESET",
  };

  const html = template.generateTemplate(emailObj);
  let emailIsSent;

  try {
    if (process.env.NODE_ENV === "development") {
      // Send to a mail trap
      emailIsSent = await sendEmail({
        email: user.email,
        subject: "Password Reset Email (Expires After 30 minutes)",
        html,
      });
    } else {
      // send to actual mail
      emailIsSent = await sendEmail({
        email: user.email,
        subject: "Password Reset Email (Expires After 30 minutes)",
        html,
      });
    }

    if (emailIsSent === "sent") {
      res.status(200).json({
        status: "success",
        message: "Message sent to your email, kindly check",
      });
    }
  } catch (err) {
    user.oneTimeToken = undefined;
    user.oneTimeTokenExpires = undefined;

    // Save your data after modification
    await user.save({ validateBeforeSave: false });
    return next(
      new OperationalError("Unable to send email, kindly try again", 500)
    );
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  const plainResetToken = req.params.oneTimeToken;
  const hashedResetToken = crypto
    .createHash("sha256")
    .update(plainResetToken)
    .digest("hex");

  const message = "Password was reset successfully";

  const user = await User.findOne({
    oneTimeToken: hashedResetToken,
    oneTimeTokenExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new OperationalError("invalid or expired token", 404));
  }

  const { password, confirmPassword } = req.body;

  if (typeof password !== "string" || !helpers.passwordValidator(password)) {
    return next(
      new OperationalError("Invalid password / Password not provided", 400)
    );
  }

  if (password !== confirmPassword) {
    return next(
      new OperationalError(
        "Passwords do not match / Confirm Password not provided",
        400
      )
    );
  }

  user.password = password;
  user.confirmPassword = confirmPassword;

  user.oneTimeToken = undefined;
  user.oneTimeTokenExpires = undefined;
  await user.save();

  res.status(200).json({
    status: "success",
    message,
  });
});

exports.getCurrentUser = catchAsync(async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    // Find the user by their _id
    const user = await User.findById(userId);

    if (!user) {
      return next(
        new OperationalError(
          "User not found, kindly create an account to continue",
          404
        )
      );
    }

    res.status(200).json({
      status: "success",
      message: "User stats fetched successfully",
      data: {
        user: user,
      },
    });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error getting user", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

exports.getUserStats = catchAsync(async (req, res, next) => {
  try {
    const { _id: userId } = req.user;

    // Find the user by their _id
    const user = await User.findById(userId);

    if (!user) {
      return next(new OperationalError("User not found", 404));
    }

    res.status(200).json({
      status: "success",
      message: "User stats fetched successfully",
      data: {
        stat: {
          quizzesPlayed: user.quizzesPlayed,
          successRate: user.successRate,
          stars: user.stars,
          rapidFireCheckpoint: user.rapidFireCheckpoint,
        },
      },
    });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error getting user statistics:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

exports.updateStats = catchAsync(async (req, res, next) => {
  try {
    const { error } = helpers.validQuizAnsweredPayload.validate(req.body);
    if (error) {
      return next(new OperationalError(error.details[0].message, 400));
    }

    const { quizResult, starsEarned } = req.body;

    const userId = req.user.id;

    // Update the user's successRate and quizzesPlayed based on the new quizResult
    const user = await User.findById(userId);
    if (!user) {
      return next(new OperationalError("User not found", 404));
    }

    // Calculate the new successRate
    const totalQuizzesPlayed = user.quizzesPlayed + 1;
    const totalCorrectAnswers =
      user.quizzesPlayed * user.successRate + quizResult;
    const newSuccessRate = totalCorrectAnswers / totalQuizzesPlayed;
    const totalStarsEarned = user.stars + starsEarned;

    // Update the user's successRate and quizzesPlayed
    user.successRate = newSuccessRate;
    user.quizzesPlayed = totalQuizzesPlayed;
    user.stars = totalStarsEarned;

    // Save the updated user data to the database
    await user.save();

    res.status(200).json({
      status: "success",
      message: "User stats updated successfully",
    });
  } catch (err) {
    console.error("Error updating rapid fire completion:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});
