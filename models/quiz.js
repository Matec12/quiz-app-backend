const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const quizSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
    },
    level: {
      type: Number,
      required: [true, "Level is required"],
      min: 0,
      max: 4,
    },
    questions: [
      {
        type: Schema.ObjectId,
        ref: "Question",
      },
    ],
  },
  { timestamps: true }
);

const Quiz = mongoose.model("Quiz", quizSchema);

module.exports = Quiz;
