const slugify = require("slugify");
const catchAsync = require("../utils/catchAsync");
const Category = require("../models/category");
const Topic = require("../models/topic");
const categoryNames = require("../constants/categoryNames");
const OperationalError = require("../utils/operationalError");

exports.createCategory = catchAsync(async (req, res, next) => {
  const { name, topics } = req.body;

  // Check if the category name is provided
  if (!name) {
    return next(new OperationalError("Category name is required", 500));
  }

  // Check if the provided name matches the enum of allowed category names

  if (!categoryNames.includes(name)) {
    return next(new OperationalError("Invalid category name", 400));
  }

  // Generate the categoryId (slug) from the category name
  const slug = slugify(name, { lower: true });

  // Check if a category with the same slug already exists
  const existingCategory = await Category.findOne({ slug });
  if (existingCategory) {
    return next(
      new OperationalError("Category with this name already exist", 400)
    );
  }

  if (!Array.isArray(topics)) {
    return next(
      new OperationalError("Topics should be an array of topic IDs", 400)
    );
  }

  const existingTopics = await Topic.find({ _id: { $in: topics } });
  if (existingTopics.length !== topics.length) {
    // Not all topics exist, some of the provided IDs are invalid
    return next(new OperationalError("One or more topics do not exist", 400));
  }

  // Create the new category
  const category = new Category({ name, slug, topics: topics });

  category.save();

  if (!category) {
    return next(new OperationalError("something went wrong", 500));
  }

  res.status(200).json({
    status: "success",
    message: "category created successfully",
  });
});

exports.getCategory = catchAsync(async (req, res, next) => {
  try {
    const { categoryId } = req.query;

    if (!categoryId) {
      // If categoryId is not provided, get all categories
      const categories = await Category.find().populate("topics");
      res.status(200).json({
        status: "success",
        data: { result: categories?.length, categories: categories },
      });
    } else {
      // Find the category by its _id and populate the topics
      const category = await Category.findById(categoryId).populate("topics");

      if (!category) {
        return next(new OperationalError("Category not found", 404));
      }

      res
        .status(200)
        .json({ status: "success", data: { category: [category] } });
    }
  } catch (err) {
    if (err instanceof OperationalError) {
      return next(err);
    }
    console.error("Error getting category:", err);
    next(new OperationalError("Something went wrong", 500));
  }
});

exports.updateCategory = catchAsync(async (req, res, next) => {
  const { categoryId } = req.params;

  const { name, topics } = req.body;

  // Check if the category name and categoryId are provided
  if (!name || !categoryId) {
    return next(new OperationalError("Category name and id are required", 400));
  }

  // Check if the provided name matches the enum of allowed category names
  if (!categoryNames.includes(name)) {
    return next(new OperationalError("Invalid category name", 400));
  }

  // Find the existing category by its categoryId
  const existingCategory = await Category.findOne({ _id: categoryId });
  console.log({ existingCategory, categoryId });
  if (!existingCategory) {
    return next(new OperationalError("Category not found", 400));
  }

  // Ensure that topics is an array
  if (!Array.isArray(topics)) {
    return next(
      new OperationalError("Topics should be an array of topic IDs", 400)
    );
  }

  // Find the existing topics by their _id and verify they exist
  const existingTopics = await Topic.find({ _id: { $in: topics } });
  if (existingTopics.length !== topics.length) {
    return next(new OperationalError("One or more topics do not exist", 400));
  }

  // Update the category with the new name and associated topic IDs
  existingCategory.name = name;
  existingCategory.topics = topics;

  await existingCategory.save();

  if (!existingCategory) {
    return next(new OperationalError("something went wrong", 500));
  }

  res
    .status(200)
    .json({ status: "success", message: "category updated successfully" });
});

exports.deleteCategory = catchAsync(async (req, res, next) => {
  try {
    const { categoryId } = req.params;

    // Find the category by its _id
    const category = await Category.findByIdAndDelete({ _id: categoryId });

    if (!category) {
      return next(new OperationalError("Category not found", 404));
    }

    res
      .status(200)
      .json({ status: "success", message: "category deleted successfully" });
  } catch (err) {
    console.error("Error deleting category:", err);
    return next(new OperationalError("Something went wrong", 500));
  }
});
