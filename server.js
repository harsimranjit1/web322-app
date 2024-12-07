/*********************************************************************************
*  WEB322 – Assignment 05
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including web sites) or distributed to other students.
* 
*  Name: ______________________ Student ID: ______________ Date: ________________
*
*  Cyclic Web App URL: ________________________________________________________
*
*  GitHub Repository URL: ______________________________________________________
*
********************************************************************************/ 

const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const storeService = require("./store-service");
const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({ extended: true }));

// Handlebars Setup
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            let day = dateObj.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },

        // navLink helper for active navigation link
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
app.set("view engine", ".hbs");

// Routes
app.get("/about", (req, res) => {
    res.render("about");
});
app.get("/shop", (req, res) => {
    const category = req.query.category;  // Get the category from the query string

    let postsPromise = category
        ? storeService.getItemsByCategory(category)  // Get items filtered by category
        : storeService.getAllItems();  // Get all items if no category is selected

    let categoriesPromise = storeService.getCategories();  // Get all categories for the filter

    Promise.all([postsPromise, categoriesPromise])
        .then(([posts, categories]) => {
            res.render("shop", {
                posts: posts,
                categories: categories,
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

app.get("/", (req, res) => {
    res.redirect("/items");
});

app.get("/items", (req, res) => {
    storeService.getAllItems()
        .then(data => {
            res.render("items", { items: data.length > 0 ? data : null, message: data.length === 0 ? "No results found." : null });
        })
        .catch(err => {
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

app.get("/categories/add", (req, res) => {
    res.render("addCategory");
});

app.post("/categories/add", (req, res) => {
    storeService.addCategory(req.body)
        .then(() => res.redirect("/categories"))
        .catch(err => res.status(500).send("Error adding category: " + err));
});

app.get("/categories/delete/:id", (req, res) => {
    storeService.deleteCategoryById(req.params.id)
        .then(() => res.redirect("/categories"))
        .catch(() => res.status(500).send("Unable to remove category / Category not found"));
});

app.get("/items/add", (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("addItem", { categories: categories });
        })
        .catch(() => {
            res.render("addItem", { categories: [] });
        });
});

app.post("/items/add", (req, res) => {
    storeService.addItem(req.body)
        .then(() => res.redirect("/items"))
        .catch(err => res.status(500).send("Error adding item: " + err));
});

app.get("/items/delete/:id", (req, res) => {
    storeService.deletePostById(req.params.id)
        .then(() => res.redirect("/items"))
        .catch(() => res.status(500).send("Unable to remove item / Item not found"));
});

// Initialize the app
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize store service: ", err);
    });
