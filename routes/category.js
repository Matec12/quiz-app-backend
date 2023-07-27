const express = require("express");
const category = require("../controllers/category");
const { secureRoute } = require("../middlewares/secureRoute");
const { restrict } = require("../middlewares/authorize");

const router = express.Router();

router.post("/create", secureRoute, restrict("user"), category.createCategory);
router.get("/get", secureRoute, category.getCategory);
router.put(
  "/update/:categoryId",
  secureRoute,
  restrict("user"),
  category.updateCategory
);
router.delete(
  "/delete/:categoryId",
  secureRoute,
  restrict("user"),
  category.deleteCategory
);

module.exports = router;
