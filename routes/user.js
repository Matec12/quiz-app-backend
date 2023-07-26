const express = require("express");
const user = require("../controllers/user");

const router = express.Router();

router.post("/login", user.login);
router.post("/create", user.userCreate);

router.patch("/verify_email/:oneTimeToken", user.verifyEmail);
router.post("/resend_email", user.resendVerificationEmail);
router.post("/forgot_password", user.forgotPassword);
router.post("/reset_password/:oneTimeToken", user.resetPassword);

module.exports = router;
