/*********************************************************************************

WEB322 – Assignment 03
I declare that this assignment is my own work in accordance with Seneca Academic Policy. No part
of this assignment has been copied manually or electronically from any other source (including 3rd party web sites) or distributed to other students.

Name: HARSIMRANJIT KAUR
Student ID: 151966231
Date: ONovember 1, 2024
Cyclic Web App URL: https://replit.com/@HarsimranjitKau/web322-app
GitHub Repository URL: https://github.com/harsimranjit1/web322-app/tree/main

********************************************************************************/

const express = require("express");
const app = express();
const path = require("path");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require("./store-service");

app.use(express.static("public"));


cloudinary.config({
    cloud_name: 'dclxjkrbe', 
    api_key: '191166644624649',       
    api_secret: 'vnmFG9WuwGh_7Ms9NFGAuKBoODA',  
});


const upload = multer(); 

app.get("/", (req, res) => {
    res.redirect("/about");
});

app.get("/about", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "about.html"));
});


app.get("/items/add", (req, res) => {
    res.sendFile(path.join(__dirname, "views", "addItem.html"));
});


app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }

        upload(req).then((uploaded) => {
            processItem(uploaded.url);
        }).catch(err => {
            res.status(500).send("Error uploading image: " + err);
        });
    } else {
        processItem("");
    }

    function processItem(imageUrl) {
        req.body.featureImage = imageUrl;

        
        storeService.addItem(req.body).then((addedItem) => {
            res.redirect("/items");
        }).catch(err => {
            res.status(500).send("Error adding item: " + err);
        });
    }
});


storeService.initialize().then(() => {
   
    app.get("/shop", (req, res) => {
        storeService.getPublishedItems().then(data => {
            res.json(data);
        }).catch(err => {
            res.json({ message: err });
        });
    });

   
    app.get("/items", (req, res) => {
        const { category, minDate } = req.query;

        if (category) {
            storeService.getItemsByCategory(category).then(data => {
                res.json(data);
            }).catch(err => {
                res.json({ message: err });
            });
        } else if (minDate) {
            storeService.getItemsByMinDate(minDate).then(data => {
                res.json(data);
            }).catch(err => {
                res.json({ message: err });
            });
        } else {
            storeService.getAllItems().then(data => {
                res.json(data);
            }).catch(err => {
                res.json({ message: err });
            });
        }
    });

    
    app.get("/item/:id", (req, res) => {
        const id = req.params.id;
        storeService.getItemById(id).then(data => {
            if (data) {
                res.json(data);
            } else {
                res.status(404).send("Item not found");
            }
        }).catch(err => {
            res.status(500).json({ message: err });
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

   
    const PORT = process.env.PORT || 8080;
    app.listen(PORT, () => {
        console.log(`Express http server listening on port ${PORT}`);
    });

}).catch(err => {
    console.error(`Could not open file: ${err}`);
});
