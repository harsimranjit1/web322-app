const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'postgres',
  host: 'localhost', // or your database URL
  username: 'your_username',
  password: 'your_password',
  database: 'your_database',
});

sequelize.authenticate()
  .then(() => {
    console.log('Database connection established');
  })
  .catch(err => {
    console.error('Unable to connect to the database:', err);
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

// Get items by min date
module.exports.getItemsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        const { gte } = Sequelize.Op;
        Item.findAll({
            where: { postDate: { [gte]: new Date(minDateStr) } }
        })
            .then(data => resolve(data))
            .catch(() => reject("No results found for this date"));
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

// Delete item by ID
module.exports.deletePostById = function (id) {
    return new Promise((resolve, reject) => {
        Item.destroy({ where: { id: id } })
            .then(() => resolve())
            .catch(() => reject("Unable to remove item / Item not found"));
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
