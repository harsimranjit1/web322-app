const fs = require("fs");
const path = require("path");

let items = [];
let categories = [];


module.exports.initialize = function () {
    return new Promise((resolve, reject) => {
        const itemsFilePath = path.join(__dirname, "data", "items.json");
        const categoriesFilePath = path.join(__dirname, "data", "categories.json");

       
        fs.readFile(itemsFilePath, "utf8", (err, data) => {
            if (err) {
                reject(`Unable to read items.json: ${err.message}`);
                return;
            }
            try {
                items = JSON.parse(data);
            } catch (e) {
                reject(`Error parsing items.json: ${e.message}`);
                return;
            }

       
            fs.readFile(categoriesFilePath, "utf8", (err, data) => {
                if (err) {
                    reject(`Unable to read categories.json: ${err.message}`);
                    return;
                }
                try {
                    categories = JSON.parse(data);
                    resolve(); 
                } catch (e) {
                    reject(`Error parsing categories.json: ${e.message}`);
                }
            });
        });
    });
};


module.exports.getAllItems = function () {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned");
        }
    });
};


module.exports.getPublishedItems = function () {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No published items found");
        }
    });
};


module.exports.getCategories = function () {
    return new Promise((resolve, reject) => {
        if (categories && categories.length > 0) {
            resolve(categories.map(category => ({
                id: category.id,
                name: category.category 
            })));
        } else {
            reject("No categories available");
        }
    });
};


module.exports.addItem = function (itemData) {
    return new Promise((resolve, reject) => {
     
        itemData.published = itemData.published === undefined ? false : itemData.published;

       
        const currentDate = new Date();
        itemData.postDate = `${currentDate.getFullYear()}-${currentDate.getMonth() + 1}-${currentDate.getDate()}`;

        
        itemData.id = items.length + 1;

        items.push(itemData); 

       
        const itemsFilePath = path.join(__dirname, "data", "items.json");
        fs.writeFile(itemsFilePath, JSON.stringify(items, null, 4), (err) => {
            if (err) {
                reject("Error saving the new item: " + err);
                return;
            }
            resolve(itemData); 
        });
    });
};


module.exports.getItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => String(item.category) === String(category));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results found for this category");
        }
    });
};

// Get items by minimum date
module.exports.getItemsByMinDate = function (minDateStr) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results found for this date");
        }
    });
};


module.exports.getItemById = function (id) {
    return new Promise((resolve, reject) => {
        const foundItem = items.find(item => String(item.id) === String(id));
        if (foundItem) {
            resolve(foundItem);
        } else {
            reject("Item not found");
        }
    });
};


module.exports.getPublishedItemsByCategory = function (category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.published === true && String(item.category) === String(category));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No published items found for this category");
        }
    });
};
