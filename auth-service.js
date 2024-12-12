const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");


const Schema = mongoose.Schema;
const userSchema = new Schema({
  userName: { type: String, unique: true },
  password: String,
  email: String,
  loginHistory: [
    {
      dateTime: Date,
      userAgent: String,
    },
  ],
});

let User; 


module.exports.initialize = function () {
  return new Promise((resolve, reject) => {
    const db = mongoose.createConnection("mongodb+srv://harsimranjitkaurkhinda1:oDZsYvtWkQW0y6wd@cluster0.bdgco.mongodb.net/mydatabase?retryWrites=true&w=majority");

    db.on("error", (err) => {
      reject(err);
    });

    db.once("open", () => {
      User = db.model("users", userSchema);
      resolve();
    });
  });
};


module.exports.registerUser = function (userData) {
  return new Promise((resolve, reject) => {
   
    if (userData.password !== userData.password2) {
      reject("Passwords do not match");
    } else {
   
      bcrypt
        .hash(userData.password, 10)
        .then((hash) => {
          userData.password = hash;

       
          let newUser = new User(userData);
          newUser
            .save()
            .then(() => resolve())
            .catch((err) => {
              if (err.code === 11000) {
                reject("User Name already taken");
              } else {
                reject(`There was an error creating the user: ${err}`);
              }
            });
        })
        .catch(() => {
          reject("There was an error encrypting the password");
        });
    }
  });
};

module.exports.checkUser = function (userData) {
  return new Promise((resolve, reject) => {
    User.find({ userName: userData.userName })
      .then((users) => {
        if (users.length === 0) {
          reject(`Unable to find user: ${userData.userName}`);
        } else {
       
          bcrypt
            .compare(userData.password, users[0].password)
            .then((result) => {
              if (!result) {
                reject(`Incorrect Password for user: ${userData.userName}`);
              } else {
                
                users[0].loginHistory.push({
                  dateTime: new Date().toString(),
                  userAgent: userData.userAgent,
                });

                User.updateOne(
                  { userName: users[0].userName },
                  { $set: { loginHistory: users[0].loginHistory } }
                )
                  .then(() => resolve(users[0]))
                  .catch((err) => {
                    reject(
                      `There was an error verifying the user: ${err}`
                    );
                  });
              }
            })
            .catch(() => {
              reject(`Unable to find user: ${userData.userName}`);
            });
        }
      })
      .catch(() => {
        reject(`Unable to find user: ${userData.userName}`);
      });
  });
};
