/*********************************************************************************

WEB322 – Assignment 04
I declare that this assignment is my own work in accordance with Seneca Academic Policy.
No part of this assignment has been copied manually or electronically from any other source 
(including 3rd party web sites) or distributed to other students.

Name: HARSIMRANJIT KAUR
Student ID: 151966231
Date: November 21, 2024
Cyclic Web App URL: https://replit.com/@HarsimranjitKau/web322-app
https://13e231af-6815-4167-9162-b76cd40d00e9-00-2628lj4i4cma9.spock.replit.dev/about

GitHub Repository URL: https://github.com/harsimranjit1/web322-app

********************************************************************************/

const express = require("express");
const path = require("path");
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');
const storeService = require("./store-service");
const exphbs = require('express-handlebars');

const app = express();
const PORT = process.env.PORT || 8080;


cloudinary.config({
    cloud_name: 'dclxjkrbe',
    api_key: '191166644624649',
    api_secret: 'vnmFG9WuwGh_7Ms9NFGAuKBoODA',
});

const upload = multer();

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));


app.use((req, res, next) => {
    let route = req.path.substring(1);
    app.locals.activeRoute = "/" + (isNaN(route.split('/')[1]) ? route.replace(/\/(?!.*)/, "") : route.replace(/\/(.*)/, ""));
    next();
});


app.engine('.hbs', exphbs.engine({
    extname: '.hbs',
    helpers: {
        navLink: function (url, options) {
            return `<li class="${url === app.locals.activeRoute ? 'active' : ''}">
                <a href="${url}">${options.fn(this)}</a>
            </li>`;
        },
        equal: function (lvalue, rvalue, options) {
            return lvalue === rvalue ? options.fn(this) : options.inverse(this);
        }
    }
}));
app.set('view engine', '.hbs');

// Routes
app.get("/", (req, res) => {
    res.redirect("/shop");
});

app.get("/about", (req, res) => {
    res.render("about");
});

app.get("/items/add", (req, res) => {
    res.render("addItem");
});

app.post("/items/add", upload.single("featureImage"), (req, res) => {
    if (req.file) {
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };

        async function upload(req) {
            let result = await streamUpload(req);
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
        storeService.addItem(req.body).then(() => {
            res.redirect("/items");
        }).catch(err => {
            res.status(500).send("Error adding item: " + err);
        });
    }
});

app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then(data => {
            res.render("items", { items: data.length > 0 ? data : null, message: data.length === 0 ? "No items found." : null });
        })
        .catch(() => {
            res.render("items", { message: "No results" });
        });
});

app.get("/categories", (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.render("categories", { categories: data });
        })
        .catch(() => {
            res.render("categories", { message: "No categories available" });
        });
});

app.get("/shop", (req, res) => {
    const category = req.query.category;
    let postsPromise = category
        ? storeService.getPublishedItemsByCategory(category)
        : storeService.getPublishedItems();
    let categoriesPromise = storeService.getCategories();

    Promise.all([postsPromise, categoriesPromise])
        .then(([posts, categories]) => {
            res.render("shop", {
                posts: posts,
                categories: categories,
                post: posts.length > 0 ? posts[0] : null,
                viewingCategory: category || null,
                message: posts.length === 0 ? "No items available in this category" : null
            });
        })
        .catch(() => {
            res.render("shop", {
                posts: null,
                categories: [],
                message: "Error fetching items or categories"
            });
        });
});

app.get("/shop/:id", (req, res) => {
    const itemId = req.params.id;
    const category = req.query.category;

    let itemPromise = storeService.getItemById(itemId);
    let categoriesPromise = storeService.getCategories();

    Promise.all([itemPromise, categoriesPromise])
        .then(([item, categories]) => {
            res.render("shop", {
                post: item,
                categories: categories,
                viewingCategory: category || null,
                message: null
            });
        })
        .catch(() => {
            res.render("shop", {
                post: null,
                categories: [],
                message: "Item not found"
            });
        });
});


app.use((req, res) => {
    res.status(404).render("404", { layout: false });
});


storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize store service: ", err);
    });
