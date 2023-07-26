const express = require("express");
const user = require("../controllers/user");

const router = express.Router();

router.post("/login", user.login);
router.post("/create", user.userCreate);

router.patch("/verify_email/:oneTimeToken", user.verifyEmail);
router.post("/resend_email", user.resendVerificationEmail);

module.exports = router;
