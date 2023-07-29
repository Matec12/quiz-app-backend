const mongoose = require("mongoose");
const slugify = require("slugify");
const { categoryNames, categoryIds } = require("../constants/category");

const Schema = mongoose.Schema;

const categorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      enum: categoryNames,
    },
    slug: {
      type: String,
      unique: true,
    },
    categoryId: {
      type: Number,
      unique: true,
      enum: categoryIds,
    },
    topics: [
      {
        type: Schema.Types.ObjectId,
        ref: "Topic",
      },
    ],
  },
  { timestamps: true }
);

// Pre-save hook to generate the categoryId from the name field
categorySchema.pre("save", function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

categorySchema.methods.toJSON = function () {
  const category = this;
  const categoryObject = category.toObject();

  delete categoryObject.__v;

  return categoryObject;
};

const Category = mongoose.model("Category", categorySchema);

module.exports = Category;
