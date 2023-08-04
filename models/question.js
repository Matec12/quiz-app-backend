const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const questionSchema = new Schema(
  {
    prompt: {
      type: String,
      required: [true, "Prompt is required"],
    },
    options: {
      type: [String],
      required: [true, "Options are required"],
      validate: {
        validator: function (options) {
          return options.length === 4; // Assuming there are always four options for each question
        },
        message: "Question must have exactly 4 options",
      },
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
      min: 0,
      max: 4,
    },
    correctAnswer: {
      type: Number,
      required: [true, "Correct answer index is required"],
      min: 0,
      max: 3, // Assuming that the correct answer index will be between 0 and 3
    },
    topic: {
      type: Schema.ObjectId,
      ref: "Topic",
    },
  },
  { timestamps: true }
);

const Question = mongoose.model("Question", questionSchema);

module.exports = Question;
