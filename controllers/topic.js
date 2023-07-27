const Topic = require("../models/topic");
const Question = require("../models/question");
const catchAsync = require("../utils/catchAsync");
const helpers = require("../utils/helpers");
const OperationalError = require("../utils/operationalError");

// Create a new topic
exports.createTopic = catchAsync(async (req, res, next) => {
  try {
    helpers.validateTopicPayload(req.body, next, Question);

    const { title, category, level0, level1, level2, level3, level4 } =
      req.body;

    // Create the new topic
    const topic = await Topic.create({
      title,
      category,
      level0,
      level1,
      level2,
      level3,
      level4,
    });

    await topic.save();

    res
      .status(200)
      .json({ status: "success", message: "Topic created successfully" });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error creating topic:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

// Get all topics
exports.getTopic = catchAsync(async (req, res, next) => {
  try {
    const { topicId } = req.query;

    if (!topicId) {
      const topics = await Topic.find()
        .populate("category")
        .populate("level0 level1 level2 level3 level4");

      res.status(200).json({
        status: "success",
        data: { result: topics.length, topics: topics },
      });
    } else {
      const topic = await Topic.findById(topicId)
        .populate("category")
        .populate("level0 level1 level2 level3 level4");

      if (!topic) {
        return next(new OperationalError("Topic not found", 404));
      }

      res.status(200).json({ status: "success", data: topic });
    }
  } catch (err) {
    console.error("Error getting topics:", err);
    if (err instanceof OperationalError) {
      return next(err);
    }
    next(new OperationalError("Something went wrong", 500));
  }
});

// Update a topic by its _id
exports.updateTopic = catchAsync(async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const existingTopic = await Topic.findById(topicId);

    if (!existingTopic) {
      return next(new OperationalError("Topic not found", 404));
    }

    helpers.validateTopicPayload(req.body, next, Question);

    const { title, category, level0, level1, level2, level3, level4 } =
      req.body;

    existingTopic.title = title;
    existingTopic.category = category;
    existingTopic.level0 = level0;
    existingTopic.level1 = level1;
    existingTopic.level2 = level2;
    existingTopic.level3 = level3;
    existingTopic.level4 = level4;

    await existingTopic.save();

    res
      .status(200)
      .json({ status: "success", message: "Topic updated successfully" });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error updating topic:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

// Delete a topic by its _id
exports.deleteTopic = catchAsync(async (req, res, next) => {
  try {
    const { topicId } = req.params;

    const deletedTopic = await Topic.findByIdAndDelete(topicId);

    if (!deletedTopic) {
      return next(new OperationalError("Topic not found", 404));
    }

    res
      .status(200)
      .json({ status: "success", message: "Topic deleted successfully" });
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error deleting topic:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});
