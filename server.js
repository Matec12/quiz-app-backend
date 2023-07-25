const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });
const mongoose = require("mongoose");
const app = require("./app");

// connect to DB
let DB_CONNECT;

if (process.env.NODE_ENV === "development") {
  DB_CONNECT = process.env.DB_LOCAL;
} else {
  DB_CONNECT = process.env.DB_ATLAS;
}

const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
};

mongoose
  .connect(DB_CONNECT, options)
  .then(() => {
    console.log("Connected to Database");
  })
  .catch((err) => {
    console.log(err.message);
  });

const port = process.env.PORT || 2010;

// connect to server
app.listen(port, () => {
  console.log(`app running on port ${port}...`);
});
