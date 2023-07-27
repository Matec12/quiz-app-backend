const express = require("express");
const user = require("../controllers/user");

const router = express.Router();

router.post("/login", user.login);
router.post("/create", user.userCreate);

module.exports = router;
