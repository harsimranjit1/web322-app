const express = require("express");
const path = require("path");
const exphbs = require("express-handlebars");
const clientSessions = require("client-sessions");
const storeService = require("./store-service");
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware for parsing form data
app.use(express.urlencoded({ extended: true }));

// Set up client-sessions middleware
app.use(clientSessions({
    cookieName: "session",
    secret: "your-secret-key", // Change to your secret key
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

// Route for the homepage
app.get("/", (req, res) => {
    res.redirect("/items");
});

// Route for the Items page
app.get("/items", ensureLogin, (req, res) => {
    storeService.getAllItems()
        .then(data => {
            res.render("items", {
                items: data.length > 0 ? data : null,
                message: data.length === 0 ? "No results found." : null
            });
        })
        .catch(err => {
            res.render("items", { message: "No results" });
        });
});

// Route for the Categories page
app.get("/categories", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(data => {
            res.render("categories", { categories: data });
        })
        .catch(() => {
            res.render("categories", { message: "No categories available" });
        });
});

// Route for Add Item page
app.get("/items/add", ensureLogin, (req, res) => {
    storeService.getCategories()
        .then(categories => {
            res.render("addItem", { categories: categories });
        })
        .catch(() => {
            res.render("addItem", { categories: [] });
        });
});

// Handle Add Item form submission
app.post("/items/add", ensureLogin, (req, res) => {
    storeService.addItem(req.body)
        .then(() => res.redirect("/items"))
        .catch(err => res.status(500).send("Error adding item: " + err));
});

// Route for the Login page
app.get("/login", (req, res) => {
    res.render("login");
});

// Route for Register page
app.get("/register", (req, res) => {
    res.render("register");
});

// Handle user registration
app.post("/register", (req, res) => {
    authData.registerUser(req.body)
        .then(() => res.render("register", { successMessage: "User created" }))
        .catch(err => res.render("register", { errorMessage: err, userName: req.body.userName }));
});

// Handle user login
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

// Handle user logout
app.get("/logout", (req, res) => {
    req.session.reset();
    res.redirect("/");
});

// Initialize the app and sync with the database
storeService.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(err => {
        console.error("Failed to initialize store service: ", err);
    });
