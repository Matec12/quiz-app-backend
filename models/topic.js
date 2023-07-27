const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const topicSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Topic title is required"],
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
    },
    level0: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    level1: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    level2: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    level3: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
    level4: [
      {
        type: Schema.Types.ObjectId,
        ref: "Question",
      },
    ],
  },
  { timestamps: true }
);

const Topic = mongoose.model("Topic", topicSchema);

module.exports = Topic;
