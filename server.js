/*********************************************************************************
*  WEB322 – Assignment 06
*  I declare that this assignment is my own work in accordance with Seneca Academic Policy.  
*  No part of this assignment has been copied manually or electronically from any other source 
*  (including web sites) or distributed to other students.
* 
*  Name: HARSIMRANJIT KAUR
*  Student ID: 151966231
*  Date: DEC 6, 2024
*  Cyclic Web App URL: ________________________________________________________
*  GitHub Repository URL: ______________________________________________________
********************************************************************************/

const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const storeService = require("./store-service");
const authData = require("./auth-service");

const app = express();
const PORT = process.env.PORT || 8080;

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Configure client-sessions
app.use(clientSessions({
    cookieName: "session",
    secret: "your-secret-key",
    duration: 24 * 60 * 60 * 1000, // 1 day
    activeDuration: 1000 * 60 * 5 // Extend by 5 minutes if active
}));

// Middleware to make session data available to templates
app.use((req, res, next) => {
    res.locals.session = req.session;
    next();
});

// Handlebars setup
app.engine(".hbs", exphbs.engine({
    extname: ".hbs",
    helpers: {
        formatDate: function (dateObj) {
            let year = dateObj.getFullYear();
            let month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
            let day = dateObj.getDate().toString().padStart(2, '0');
            return `${year}-${month}-${day}`;
        },
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

// Custom middleware to protect routes
function ensureLogin(req, res, next) {
    if (!req.session.user) {
        res.redirect("/login");
    } else {
        next();
    }
}

// Routes
app.get("/about", (req, res) => {
    res.render("about");
});

// Authentication routes
app.get("/register", (req, res) => {
    res.render("register");
});

app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }));
});

app.get("/login", (req, res) => {
    res.render("login");
});

app.post("/login", (req, res) => {
    req.body.userAgent = req.get("User-Agent");
    authData.checkUser(req.body)
        .then(user => {
            req.session.user = {
                userName: user.userName,
                email: user.email,
                loginHistory: user.loginHistory
            };
            res.redirect("/items");
        })
        .catch(err => res.render("login", { errorMessage: err, userName: req.body.userName }));
});

app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

app.get("/userHistory", ensureLogin, (req, res) => {
    res.render("userHistory", { user: req.session.user });
});

// Store routes
app.get("/shop", (req, res) => {
    const category = req.query.category;
    let postsPromise = category
        ? storeService.getItemsByCategory(category)
        : storeService.getAllItems();
    let categoriesPromise = storeService.getCategories();

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

app.get("/items", ensureLogin, (req, res) => {
    storeService.getAllItems()
        .then(data => {
            res.render("items", { items: data.length > 0 ? data : null, message: data.length === 0 ? "No results found." : null });
        })
        .catch(() => {
            res.render("items", { message: "No results" });
        });
});

app.get("/categories", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.render("categories", { categories: data });
        })
        .catch(() => {
            res.render("categories", { message: "No categories available" });
        });
});

// Initialize services
storeService.initialize()
    .then(authData.initialize)
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize services: ", err);
    });
