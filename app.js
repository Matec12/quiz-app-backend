const express = require("express");
const helmet = require("helmet");
const xss = require("xss-clean");
const cors = require("cors");
const bodyParser = require("body-parser");
const mongoSanitize = require("express-mongo-sanitize");
const userRoute = require("./routes/user");
const adminRoute = require("./routes/admin");
const categoryRoute = require("./routes/category");
const topicRoute = require("./routes/topic");
const questionRoute = require("./routes/question");
const OperationalError = require("./utils/operationalError");
const globalErrorHandler = require("./middlewares/errorHandler/globalErrorHandler");

const app = express();

// Enable cors on all routes
app.use(cors());

// To remove unwanted characters from the query:
app.use(mongoSanitize());

// Place security https header;
app.use(helmet());

// Prevent against xss attacks
app.use(xss());

// Make body parser available
app.use(express.json());

// parse incoming requests:
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Register all routes
app.use("/api/v1/user", userRoute);
app.use("/api/v1/admin", adminRoute);
app.use("/api/v1/category", categoryRoute);
app.use("/api/v1/topic", topicRoute);
app.use("/api/v1/question", questionRoute);

// handle all Unregister routes
app.all("*", (req, _, next) => {
  next(new OperationalError(`${req.originalUrl} is not a valid route`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
