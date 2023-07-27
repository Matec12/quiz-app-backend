const Question = require("../models/question");
const catchAsync = require("../utils/catchAsync");
const helpers = require("../utils/helpers");
const OperationalError = require("../utils/operationalError");

// Create a new question
exports.createQuestion = catchAsync(async (req, res, next) => {
  try {
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

    res
      .status(200)
      .json({ status: "success", message: "Question created successfully" });
  } catch (err) {
    console.error("Error creating question:", err);
    next(new OperationalError("Something went wrong", 500));
  }
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
  try {
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

    res
      .status(200)
      .json({ status: "success", message: "Question updated successfully" });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }

    console.error("Error updating question:", err);
    return next(new OperationalError("Something went wrong", 500));
  }
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
