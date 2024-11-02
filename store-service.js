const fs = require("fs");
const path = require("path");
let items = [];
let categories = [];

module.exports.initialize = function() {
    return new Promise((resolve, reject) => {
        const itemsFilePath = path.join(__dirname, "data", "items.json");
        const categoriesFilePath = path.join(__dirname, "data", "categories.json");

        fs.readFile(itemsFilePath, "utf8", (err, data) => {
            if (err) {
                reject(`Unable to read items.json: ${err.message}`);
            } else {
                try {
                    items = JSON.parse(data);
                } catch (e) {
                    return reject(`Error parsing items.json: ${e.message}`);
                }

                fs.readFile(categoriesFilePath, "utf8", (err, data) => {
                    if (err) {
                        reject(`Unable to read categories.json: ${err.message}`);
                    } else {
                        try {
                            categories = JSON.parse(data);
                            resolve();
                        } catch (e) {
                            reject(`Error parsing categories.json: ${e.message}`);
                        }
                    }
                });
            }
        });
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) {
            resolve(items);
        } else {
            reject("No results returned");
        }
    });
};

module.exports.getPublishedItems = function() {
    return new Promise((resolve, reject) => {
        const publishedItems = items.filter(item => item.published === true);
        if (publishedItems.length > 0) {
            resolve(publishedItems);
        } else {
            reject("No results returned");
        }
    });
};

module.exports.getCategories = function() {
    return new Promise((resolve, reject) => {
        if (categories.length > 0) {
            resolve(categories);
        } else {
            reject("No results returned");
        }
    });
};

function addItem(itemData) {
    return new Promise((resolve) => {
        if (itemData.published === undefined) {
            itemData.published = false;
        } else {
            itemData.published = true;
        }

        itemData.id = items.length + 1; 
        items.push(itemData); 
        resolve(itemData); 
    });
}

module.exports.addItem = addItem;


module.exports.getItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category == category); // Match category as string
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
};


module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => new Date(item.postDate) >= new Date(minDateStr));
        if (filteredItems.length > 0) {
            resolve(filteredItems);
        } else {
            reject("No results returned");
        }
    });
};


module.exports.getItemById = function(id) {
    return new Promise((resolve, reject) => {
        const foundItem = items.find(item => item.id == id); // Match id as string
        if (foundItem) {
            resolve(foundItem);
        } else {
            reject("No result returned");
        }
    });
};
