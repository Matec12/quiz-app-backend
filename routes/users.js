const express = require("express");
const users = require("../controllers/users");
const { secureRoute } = require("../middlewares/secureRoute");

const router = express.Router();

router.get("/ranked", secureRoute, users.getUsersRanked);

module.exports = router;
