const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const MongoClass = require("../utils/mongoClass");
const helpers = require("../utils/helpers");

const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    username: {
      type: String,
      min: [2, "username must be greater than 2"],
      max: [16, "username must not be greater than 16"],
      lowercase: true,
      required: [true, "You must provide a username"],
      unique: true,
      trim: true,
      validate: {
        validator: helpers.usernameValidator,
        message: (props) => `${props.value} is not a valid username.`,
      },
    },
    email: {
      type: String,
      lowercase: true,
      required: [true, "You must provide an email"],
      unique: true,
      trim: true,
      validate: [validator.isEmail, "Kindly provide a valid email address"],
    },
    emailConfirmationStatus: {
      type: Boolean,
      default: false,
    },
    quizzesPlayed: {
      type: Number,
      default: 0,
    },
    successRate: {
      type: Number,
      default: 0,
    },
    stars: {
      type: Number,
      default: 0,
    },
    rapidFireCheckpoint: {
      type: mongoose.Schema.ObjectId,
      ref: "Quiz", // Replace 'Quiz' with the name of the schema representing quizzes in your application.
      default: null,
    },
    password: {
      type: String,
      required: [true, "password is required"],
      minLength: [8, "Password must contain at least 8 characters"],
      select: false,
    },
    confirmPassword: {
      type: String,
      require: [true, "confirm password is required"],
      validate: {
        validator: function (password) {
          return password === this.password;
        },
        message: "Confirm password must be the same as your password",
      },
    },

    passwordChangedAt: Date,
    // This token is use when user wish to verify email or forgot their password
    oneTimeToken: String,
    oneTimeTokenExpires: Date,
  },
  { timestamps: true }
);

//Hash user Password
userSchema.pre("save", async function (next) {
  // If password is not changed then dont hash.
  if (!this.isModified("password")) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.confirmPassword = undefined;
});

userSchema.pre("save", function (next) {
  if (!this.isModified("password") || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 2000;
  next();
});

userSchema.loadClass(MongoClass);

const User = mongoose.model("User", userSchema);

module.exports = User;
