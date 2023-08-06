const jwt = require("jsonwebtoken");
const Joi = require("joi");
const template = require("./emails/templates");
const sendEmail = require("./emails/sendEmail");
const OperationalError = require("../utils/operationalError");

class Helper {
  usernameValidator(value) {
    // Validate that the username is in lowercase
    if (value !== value.toLowerCase()) {
      return false;
    }

    // Validate that the username does not start with a digit
    if (/^\d/.test(value)) {
      return false;
    }

    // Validate that the username only contains alphanumeric characters and underscores
    if (!/^[a-zA-Z0-9_]+$/.test(value)) {
      return false;
    }

    if (value.length < 3 || value.length > 16) {
      return false;
    }

    return true;
  }

  passwordValidator(password) {
    return (
      password.length >= 8 &&
      /[0-9]/.test(password) &&
      /[a-z]/.test(password) &&
      /[A-Z]/.test(password)
    );
  }

  emailValidator(email) {
    if (!/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email)) {
      return false;
    }
    return true;
  }

  generateTokenAndUserData(statusCode, user, res, message) {
    const userId = user._id;

    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN,
    });

    res.cookie("token", token, { maxAge: 24 * 60 * 60 * 1000 }); //Expires After 24 hours

    res.status(statusCode).json({
      status: "success",
      message,
      data: {
        token,
        user,
      },
    });
  }

  async logActivity(obj) {
    const activity = await Activity.create({
      user: obj.user,
      action: obj.action,
      actionOn: obj.actionOn,
      onModel: obj.onModel,
      merchant: obj.merchantId,
    });

    if (!activity) {
      console.log("can't create activity");
    }
  }

  assignRole(req, user, role) {
    if (req.originalUrl.includes("admin")) {
      user.role = role;
      user.emailConfirmationStatus = true;
      user.oneTimeTokenExpires = undefined;
      user.oneTimeToken = undefined;
    }
  }

  validateTopicPayload = async (payload, Category, Question) => {
    const { title, category, level0, level1, level2, level3, level4 } = payload;
    const levelArrays = [level0, level1, level2, level3, level4];

    const validationErrors = [];

    if (!title) {
      validationErrors.push("Topic title is required");
    }

    if (!category) {
      validationErrors.push("Category is required");
    } else {
      // Check if the category exists in the database
      const existingCategory = await Category.findById(category);
      if (!existingCategory) {
        validationErrors.push("Category not found in the database");
      }
    }

    // Check if all levels contain valid question IDs
    for (let i = 0; i < levelArrays.length; i++) {
      const questions = levelArrays[i];
      if (!Array.isArray(questions)) {
        validationErrors.push(`Level ${i} questions must be an array`);
      } else {
        for (const questionId of questions) {
          const question = await Question.findById(questionId);
          if (!question) {
            validationErrors.push(`Question not found with ID: ${questionId}`);
          } else if (question.level !== i) {
            validationErrors.push(
              `Question level (${question.level}) does not match the topic level (${i}) for question with ID: ${questionId}`
            );
          }
        }
      }

      // Validate level value
      if (i !== 0 && (i < 0 || i > 4)) {
        validationErrors.push(`Invalid level value: ${i}`);
      }
    }

    if (validationErrors.length > 0) {
      throw new OperationalError(validationErrors.join(". "), 400);
    }
  };

  validateQuestionPayload = (payload, next) => {
    const { prompt, options, level, correctAnswer } = payload;
    const optionCount = Array.isArray(options) ? options.length : 0;

    const validationErrors = [];

    if (!prompt) {
      validationErrors.push("Prompt is required");
    }

    if (!options || optionCount !== 4) {
      validationErrors.push("Options must be an array of exactly 4 elements");
    }

    if (typeof level !== "number" || level < 0 || level > 4) {
      validationErrors.push("Level must be a number between 0 and 4");
    }

    if (
      typeof correctAnswer !== "number" ||
      correctAnswer < 0 ||
      correctAnswer > 3
    ) {
      validationErrors.push("Correct answer must be a number between 0 and 3");
    }

    if (validationErrors.length > 0) {
      return next(new OperationalError(validationErrors.join(". "), 400));
    }
  };

  validQuizAnsweredPayload = Joi.object({
    quizResult: Joi.number().integer().min(0).required(),
    starsEarned: Joi.number().integer().required(),
  });

  selectRandom(array, number) {
    /**@type {number[]} */
    const indexes = [];
    const selected = [];

    while (selected.length < number) {
      const select = parseFloat((Math.random() * 100).toFixed()) % array.length;

      if (indexes.includes(select)) {
        continue;
      }
      indexes.push(select);
      selected.push(array[select]);
    }
    return selected;
  }

  shuffle(array) {
    return this.selectRandom(array, array.length);
  }

  random({ topics, number, level }) {
    let questions = [];

    let MAX_ITERATION_COUNT = 3000;
    while (questions.length < number && MAX_ITERATION_COUNT--) {
      for (const topic of topics) {
        const randomQuestions = this.selectRandom(topic[`level${level}`], 2);
        for (let randomQuestion of randomQuestions) {
          if (questions.length === number) return this.shuffle(questions);
          while (
            questions.includes(randomQuestion) &&
            topic[`level${level}`].find(
              (question) => !questions.includes(question)
            )
          ) {
            randomQuestion = this.selectRandom(topic[`level${level}`], 1)[0];
          }
          questions.push(randomQuestion);
        }
      }
    }
    return this.shuffle(questions);
  }

  async sendVerificationEmail(req, user) {
    const oneTimeToken = user.generateOneTimeToken(
      process.env.ONE_TIME_TOKEN_VALIDITY
    ); // 30 minutes validity
    await user.save({ validateBeforeSave: false }); //save changes to model

    // Send token to the provided email
    let activateURL;

    if (req.originalUrl.includes("/api/v1/user/")) {
      activateURL = `${process.env.REDIRECT_URL}/dashboard/verify-email/${oneTimeToken}`;
    }
    console.log(oneTimeToken);

    let subject;

    const emailObj = {
      user,
      greeting: "WELCOME",
    };

    (subject = "ACTIVATE YOUR ACCOUNT (Expires After 30 minutes)"),
      (emailObj.heading = `KINDLY VERIFY YOUR EMAIL.`);
    emailObj.message = `A warm welcome to QUIZAPP, We are glad to have you here,
            you have taken the first step, complete the next by verifying your 
            email address to complete your registration.
            Kindly click on the verify button below to complete your registration.`;

    emailObj.link = activateURL;
    emailObj.buttonText = "VERIFY";

    const html = template.generateTemplate(emailObj);

    let sentStatus;

    try {
      if (process.env.NODE_ENV === "development") {
        sentStatus = await sendEmail({
          email: user.email,
          subject,
          html,
        });
      } else {
        // send to actual mail
        sentStatus = await sendEmail({
          email: user.email,
          subject,
          html,
        });
      }

      return sentStatus;
    } catch (err) {
      console.log(`Sending email fail ${err.message}`);
      return (sentStatus = err.message);
    }
  }
}

module.exports = new Helper();
