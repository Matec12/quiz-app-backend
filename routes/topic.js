const express = require("express");
const topic = require("../controllers/topic");
const { secureRoute } = require("../middlewares/secureRoute");
const { restrict } = require("../middlewares/authorize");

const router = express.Router();

router.post("/create", secureRoute, restrict("user"), topic.createTopic);
router.get("/get", secureRoute, topic.getTopic);
router.put(
  "/update/:topicId",
  secureRoute,
  restrict("user"),
  topic.updateTopic
);
router.delete(
  "/delete/:topicId",
  secureRoute,
  restrict("user"),
  topic.deleteTopic
);

module.exports = router;
