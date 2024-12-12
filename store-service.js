const Sequelize = require('sequelize');

// Set up the Sequelize connection to PostgreSQL (in this case, your ElephantSQL or other PostgreSQL databases)
const sequelize = new Sequelize('SenecaDB', 'SenecaDB_owner', 'MT31DYRWCqpo', {
    host: 'ep-rapid-feather-a5i349k5.us-east-2.aws.neon.tech',  // Your ElephantSQL hostname
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
        ssl: { rejectUnauthorized: false }
    },
    query: { raw: true }
});

// Define Item and Category models
const Item = sequelize.define('Item', {
    body: Sequelize.TEXT,
    title: Sequelize.STRING,
    postDate: Sequelize.DATE,
    featureImage: Sequelize.STRING,
    published: Sequelize.BOOLEAN,
    price: Sequelize.DOUBLE
});

const Category = sequelize.define('Category', {
    category: Sequelize.STRING
});

// Define relationship
Item.belongsTo(Category, { foreignKey: 'category' });

// Initialize function for Sequelize
module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        sequelize.sync({ force: false })  // Don't drop tables
            .then(() => resolve())
            .catch(err => reject("Unable to sync the database: " + err));
    });
};

// Get all items
module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        Item.findAll()
            .then(data => resolve(data))
            .catch(() => reject("No results returned"));
    });
};

// Get items by category
module.exports.getItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        Item.findAll({ where: { category: category } })
            .then(data => resolve(data))
            .catch(() => reject("No results found for this category"));
    });
};

// Get item by ID
module.exports.getItemById = function (id) {
    return new Promise((resolve, reject) => {
        Item.findByPk(id)
            .then(data => resolve(data))
            .catch(() => reject("Item not found"));
    });
};

// Add item
module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
        itemData.published = itemData.published ? true : false;
        itemData.postDate = new Date();

        // Replace empty fields with null
        for (let key in itemData) {
            if (itemData[key] === "") {
                itemData[key] = null;
            }
        }

        Item.create(itemData)
            .then(() => resolve(itemData))
            .catch(err => reject("Unable to create item: " + err));
    });
};

// Get categories
module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        Category.findAll()
            .then(data => resolve(data))
            .catch(() => reject("No categories available"));
    });
};

// Add category
module.exports.addCategory = function (categoryData) {
    return new Promise((resolve, reject) => {
        for (let key in categoryData) {
            if (categoryData[key] === "") {
                categoryData[key] = null;
            }
        }

        Category.create(categoryData)
            .then(() => resolve(categoryData))
            .catch(err => reject("Unable to create category: " + err));
    });
};

// Delete category by ID
module.exports.deleteCategoryById = function (id) {
    return new Promise((resolve, reject) => {
        Category.destroy({ where: { id: id } })
            .then(() => resolve())
            .catch(() => reject("Unable to remove category / Category not found"));
    });
};

// Delete item by ID
module.exports.deletePostById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id: id } })
            .then(() => resolve())
            .catch(() => reject("Unable to remove item / Item not found"));
    });
};
