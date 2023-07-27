const Question = require("../models/question");
const User = require("../models/user");
const catchAsync = require("../utils/catchAsync");
const helpers = require("../utils/helpers");
const OperationalError = require("../utils/operationalError");

const getRandomQuestionsByLevel = async (level, count) => {
  const questions = await Question.aggregate([
    { $match: { level } },
    { $sample: { size: count } },
  ]);
  return questions;
};

// Create a new question
exports.createQuestion = catchAsync(async (req, res, next) => {
  helpers.validateQuestionPayload(req.body, next);

  const { prompt, options, level, correctAnswer } = req.body;

  // Create the new question
  const question = await Question.create({
    prompt,
    options,
    level,
    correctAnswer,
  });

  await question.save();

  if (!question) {
    return next(new OperationalError("something went wrong", 500));
  }

  res
    .status(200)
    .json({ status: "success", message: "Question created successfully" });
});

// Get all questions
exports.getQuestion = catchAsync(async (req, res, next) => {
  try {
    const { questionId, level } = req.query;
    if (questionId) {
      // Find the question by its _id
      const question = await Question.findById(questionId);

      if (!question) {
        return next(new OperationalError("Question not found", 404));
      }

      res
        .status(200)
        .json({ status: "success", data: { question: [question] } });
    } else {
      let query = {};

      if (level) {
        // Filter questions by level if the level is provided in the query parameters
        query.level = level;
      }

      const questions = await Question.find(query);

      res.status(200).json({
        status: "success",
        data: { result: questions?.length, questions: questions },
      });
    }
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error getting questions:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

// Update a question by its _id
exports.updateQuestion = catchAsync(async (req, res, next) => {
  const { questionId } = req.params;

  // Find the question by its _id
  const question = await Question.findById(questionId);

  if (!question) {
    return next(new OperationalError("Question not found", 404));
  }

  // Validate the request body
  helpers.validateQuestionPayload(req.body, next);

  const { prompt, options, level, correctAnswer } = req.body;

  // Update the question fields
  question.prompt = prompt;
  question.options = options;
  question.level = level;
  question.correctAnswer = correctAnswer;

  // Save the updated question to the database
  await question.save();

  if (!question) {
    return next(new OperationalError("something went wrong", 500));
  }

  res
    .status(200)
    .json({ status: "success", message: "Question updated successfully" });
});

// Delete a question by its _id
exports.deleteQuestion = catchAsync(async (req, res, next) => {
  try {
    const { questionId } = req.params;

    // Find the question by its _id and delete it
    const deletedQuestion = await Question.findByIdAndDelete(questionId);

    if (!deletedQuestion) {
      return next(new OperationalError("Question not found", 404));
    }

    res
      .status(200)
      .json({ status: "success", message: "Question deleted successfully" });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error deleting question:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

// Controller to get 20 random questions by level
exports.getRandomQuestions = catchAsync(async (req, res, next) => {
  try {
    const { level } = req.params;

    // Validate that the level is a valid number
    if (isNaN(level)) {
      return next(new OperationalError("Invalid level format", 400));
    }

    // Convert the level to a number
    const parsedLevel = parseInt(level, 10);

    // Query the database to retrieve 20 random questions with the specified level
    const questions = await getRandomQuestionsByLevel(parsedLevel, 1);

    if (!questions || questions.length === 0) {
      return next(
        new OperationalError("No questions found for the specified level", 404)
      );
    }

    // Return the list of random questions
    res.status(200).json({
      status: "success",
      data: { result: questions.length, questions: questions },
    });
  } catch (err) {
    console.error("Error fetching random questions:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

// Controller to get rapidFireQuestions
exports.getRapidFireQuestions = catchAsync(async (req, res, next) => {
  try {
    const { user } = req;

    const today = new Date().setHours(0, 0, 0, 0);
    const checkpointDate = user.rapidFireCheckpoint
      ? user.rapidFireCheckpoint.getMilliseconds()
      : 0;

    // If rapidFireCheckpoint is not set or is not the current day, get new questions
    if (!user.rapidFireCheckpoint || checkpointDate < today) {
      const rfQuestionsL0 = await getRandomQuestionsByLevel(0, 15);
      const rfQuestionsL1 = await getRandomQuestionsByLevel(1, 30);
      const rfQuestionsL2 = await getRandomQuestionsByLevel(2, 45);
      const rfQuestionsL3 = await getRandomQuestionsByLevel(3, 60);
      const rfQuestionsL4 = await getRandomQuestionsByLevel(4, 75);

      // Concatenate and flatten the arrays
      const questions = [
        ...rfQuestionsL0,
        ...rfQuestionsL1,
        ...rfQuestionsL2,
        ...rfQuestionsL3,
        ...rfQuestionsL4,
      ];

      // Return the response
      res.status(200).json({
        status: "success",
        data: { questions: questions },
      });
    } else {
      // Return an empty array since questions were already fetched for the current day
      res.status(200).json({
        status: "success",
        data: { questions: [] },
      });
    }
  } catch (err) {
    console.error("Error fetching rapid fire questions:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

exports.rapidFireCompleted = catchAsync(async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { quizResult, stars } = req.body;

    // Update the user's quizResult and stars
    const user = await User.findByIdAndUpdate(
      userId,
      { quizResult, stars },
      { new: true } // Return the updated user after the update
    );

    if (!user) {
      return next(new OperationalError("User not found", 404));
    }

    // Set the rapidFireCheckpoint to the current day
    user.rapidFireCheckpoint = new Date();
    await user.save();

    // Return a success response
    res.status(200).json({
      status: "success",
      message: "Rapid fire completed successfully.",
    });
  } catch (err) {
    console.error("Error updating rapid fire completion:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});
