/*********************************************************************************

WEB322 – Assignment 02
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part *  of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name:HARSIMRANJIT KAUR
Student ID: 151966231
Date: OCTOBER 9, 2024
Cyclic Web App URL: [Your Cyclic URL]
GitHub Repository URL: [Your GitHub URL]

********************************************************************************/

const express = require("express");
const app = express();
const path = require("path");

app.use(express.static("public"));

app.get("/", (req, res) => {
  res.redirect("/about");
});

app.get("/about", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "about.html"));
});

const PORT = process.env.PORT || 8080;


const storeService = require("./store-service");

storeService.initialize().then(() => {
  app.get("/shop", (req, res) => {
    storeService.getPublishedItems().then(data => {
      res.json(data);
    }).catch(err => {
      res.json({ message: err });
    });
  });

  app.get("/items", (req, res) => {
    storeService.getAllItems().then(data => {
      res.json(data);
    }).catch(err => {
      res.json({ message: err });
    });
  });

  app.get("/categories", (req, res) => {
    storeService.getCategories().then(data => {
      res.json(data);
    }).catch(err => {
      res.json({ message: err });
    });
  });


  app.use((req, res) => {
    res.status(404).send("Page Not Found");
  });


  app.listen(PORT, () => {
    console.log(`Express http server listening on port ${PORT}`);
  });

}).catch(err => {
  console.error(`Could not open file: ${err}`);
});
