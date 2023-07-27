const express = require("express");
const question = require("../controllers/question");
const { secureRoute } = require("../middlewares/secureRoute");
const { restrict } = require("../middlewares/authorize");

const router = express.Router();

router.post("/create", secureRoute, restrict("user"), question.createQuestion);
router.get("/get", secureRoute, question.getQuestion);
router.get("/random/:level", secureRoute, question.getRandomQuestions);
router.get("/rpdfire", secureRoute, question.getRapidFireQuestions);
router.post("/rpdfire/completed", secureRoute, question.rapidFireCompleted);
router.put(
  "/update/:questionId",
  secureRoute,
  restrict("user"),
  question.updateQuestion
);
router.delete(
  "/delete/:questionId",
  secureRoute,
  restrict("user"),
  question.deleteQuestion
);

module.exports = router;
