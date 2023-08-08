const catchAsync = require("../utils/catchAsync");
const User = require("../models/user");
const OperationalError = require("../utils/operationalError");

exports.getUsersRanked = catchAsync(async (req, res, next) => {
  try {
    const users = await User.find();

    function calculateRankScore(user) {
      console.log(user);
      return user.quizzesPlayed * 0.4 + user.stars * 0.6;
    }

    const publicUsers = [...users]
      .sort((a, b) => calculateRankScore(b) - calculateRankScore(a))
      .map((user) => ({
        username: user.username,
        quizzesPlayed: user.quizzesPlayed,
        stars: user.stars,
        successRate: user.successRate,
      }))
      .slice(0, 45);

    res.status(200).json({
      status: "success",
      message: "Ranked users retrieved successfully",
      data: {
        users: publicUsers,
      },
    });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error getting user ranks:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});
