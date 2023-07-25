const mongoose = require("mongoose");
const User = require("./User");

mongoose.connect("mongodb://localhost/quiz-app");

run();
// async function run() {
//   try {
//     const user = await User.create({
//       name: "John",
//       age: 44,
//       email: "deJ",
//       hobbies: ["Bowling", "Gaming"],
//       address: {
//         street: "Hello",
//         city: "Hi",
//       },
//     });
//     console.log(user);
//   } catch (error) {
//     console.log(error.message);
//   }
// }

// async function run() {
//   try {
//     const user = await User.where("age")
//       .gt("3")
//       .where("name")
//       .equals("John")
//       .populate("bestFriend")
//       .limit(1);
// user[0].bestFriend = "64bfb10669f8eaf6040b917c";
// await user[0].save();
//     console.log(user);
//   } catch (error) {
//     console.log(error.message);
//   }
// }

// async function run() {
//   try {
//     const user = await User.findOne({ name: "Kyle" });
//     console.log(user);
//     user.sayHi();
//   } catch (error) {
//     console.log(error.message);
//   }
// }

// async function run() {
//   try {
//     const user = await User.findByName("kyle");
//     console.log(user);
//   } catch (error) {
//     console.log(error.message);
//   }
// }

// async function run() {
//   try {
//     const user = await User.find().byName("kyle");
//     console.log(user);
//   } catch (error) {
//     console.log(error.message);
//   }
// }

async function run() {
  try {
    const user = await User.findOne({ name: "John", email: "dej" });
    console.log(user);
    console.log(user.namedEmail);
  } catch (error) {
    console.log(error.message);
  }
}

// const db = mongoose.connection;
// db.on("error", (error) => console.error(error));
// db.once("open", () => console.log("Connected to Database"));
