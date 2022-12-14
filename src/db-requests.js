const { Pool } = require("pg");

/**
 * Creates a pool to connect to database that allows querying
 * @return Pool connection to database
 */
function createPool() {
    const pool = new Pool({
        user: process.env.PSQL_USER,
        host: process.env.PSQL_HOST,
        database: process.env.PSQL_DATABASE,
        password: process.env.PSQL_PASSWORD,
        port: process.env.PSQL_PORT,
        ssl: { rejectUnauthorized: false }
    });

    // Add process hook to shutdown pool after using all queries (end of program)
    process.on("SIGINT", function () {
        pool.end();

        console.log("The application has shut down.");
        process.exit(0);
    });

    return pool;
}

/**
 * Checks if login info given by the user is valid
 * @param pool Uses pool connection to database
 * @param user The username of the user attempting to log in
 * @param pass The password of the user attempting to log in
 * @return An Employee object, containing their ID, first and last name, and their employee type
 */
async function attemptLogin(pool, username, password) {
    try {
        const result = await pool.query(`SELECT * FROM employees WHERE last_name = '${username}';`);

        if (result.rowCount == 0) {
            return null
        }

        const user = result.rows[0]

        if (user.password !== password) {
            return null
        }

        return {
            employee_id: user.employee_id,
            first_name: user.first_name,
            last_name: user.last_name,
            employee_type: user.is_manager ? "manager" : "cashier"
        }
    } catch (err) {
        return err.stack;
    }
}

/**
 * Authenticates the user with Google OAuth, logging them in if they are registered.
 * @param pool Uses pool connection to database.
 * @param token The token given by Google OAuth.
 * @param authClient The Google OAuth client.
 * @returns An Employee object, containing their ID, first and last name, and their employee type.
 */
async function loginOAuth(pool, token, authClient) {
    const ticket = await authClient.verifyIdToken({
        idToken: token,
        audience: process.env.CLIENT_ID
    });

    const payload = ticket.getPayload();
    const existing = await pool.query(`SELECT * FROM employees WHERE oauth_email = '${payload.email}';`);
    const user = existing.rows[0];

    if (user) {
        return {
            employee_id: user.employee_id,
            first_name: user.first_name,
            last_name: user.last_name,
            employee_type: user.is_manager ? "manager" : "cashier"
        }
    }

    return null
}

/**
* Finalizes the Order and pushes it to the Orders DB.
* Also calls decreaseInventory to deallocate items from the inventory DB.
* @param pool Uses pool connection to database
* @param products Array of products thats made when creating an order
* @param employee_id Int of employee_id
*/
async function submitOrder(pool, products, employee_id) {
    var totalCost = 0;
    var receipt = "";
    try {
        for (let i = 0; i < products.length; i++) {
            totalCost += products[i].price;
            receipt += (products[i].product_name + "..." + products[i].price + "\n");

            decreaseInventory(pool, products[i]);
        }
        await pool.query("INSERT INTO orders(transaction_amount, cashier_id, receipt, transaction_time) "
                         + "VALUES (" + totalCost + ", " + employee_id + ", " + "'" + receipt + "'" + ", '" + "now" + "');");
    } catch (err) {
        return err.stack;
    }
    
}

/**
* Decreases the inventory amounts of the given product
* @param pool  Uses pool connection to database
* @param product Product that is being decreased (decrease in Array of products that is made when creating an order)
*/
async function decreaseInventory(pool, product) {
    try {
        const res = await pool.query("SELECT ingredient_id, quantity FROM products JOIN products_to_ingredients " +
        "ON products.product_id = products_to_ingredients.product_id WHERE products.product_id = '" + product.product_id + "';");
        var ingredientID = res.rows[0].ingredient_id;
        var quantityToDecrease = res.rows[0].quantity;

        const quantityRes = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + ingredientID + "';");
        var currentQuantity = quantityRes.rows[0].quantity;
        if (currentQuantity <= 0) {
            return;
        }
        await pool.query("UPDATE inventory SET quantity = " + (currentQuantity - quantityToDecrease) + " WHERE ingredient_id = '" 
        + ingredientID + "';");
    } catch (err) {
        return err.stack;
    }
    
}

/**
* Decreases the inventory amounts of the given product
* @param products  Array of products thats made when creating an order
* @param product_id Id of product that you want to remove from order
* @return New array with product removed
*/
function removeItemFromOrder(products, product_id) {
    try {
        const index = products.indexOf(product_id)
        if (index > -1) {
            products.splice(index, 1);
        }
        return products;
    } catch (err) {
        return err.stack;
    }
}

/**
* Increase inventory by a certain quantity in the database
* @param pool  Uses pool connection to database
* @param ingredient_id Int of ingredient_id that is being changed
* @param amount_added Int of amount being added
*/
async function restockInventory(pool, ingredient_id, amount_added) {
    try {
        const currentQuantity = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + ingredient_id + "';");
        await pool.query("UPDATE inventory SET quantity = " + (amount_added + currentQuantity.rows[0].quantity) 
                         + " WHERE ingredient_id = '" + ingredient_id + "';");
    } catch(err) {
        return err.stack;
    }
}

/**
* Changes the price of the specified product to the new price
* @param pool  Uses pool connection to database
* @param product_id Int of product id that needs to be changed
* @param new_price Double of new price (4.51)
*/
async function changePrice(pool, product_id, new_price) {
    try {
        await pool.query("UPDATE products SET price = " + new_price + " WHERE product_id = " + product_id + ";");
    } catch (err) {
        return err.stack;
    }
}

/**
* Adds a new product containing the given ingredients with the given product ID, name, price, and product type
* @param pool  Uses pool connection to database
* @param ingredient_id_list String array that contains the names of all ingredients contained in the product
* @param product_id Int ID of the new product
* @param product_name String name of the new product
* @param price Double price of the new product
* @param product_type String type of product (ingredient, entree, etc...)
*/
async function addProduct(pool, ingredient_id_list, product_id, product_name, price, product_type) {
    try {
        const checkStmt = await pool.query("SELECT product_id FROM products WHERE product_id = " + product_id);
        if (checkStmt.rows[0]) {
            console.log("ALREADY A PRODUCT");
            return;
        }

        await pool.query("INSERT INTO products(product_id, product_name, price, product_type) " +
        "VALUES (" + product_id + ", '" + product_name + "', " + price + ",'" + product_type + "');");
        
        for (let i = 0; i < ingredient_id_list.length; i++) {
            await pool.query("INSERT INTO products_to_ingredients(product_id, ingredient_id, quantity) VALUES ("
            + product_id + ", '" + ingredient_id_list[i] + "', " + 1.0 + ");");
        }

        console.log("PRODUCT ADDED");
    } catch (err) {
        return err.stack;
    }
}

/**
* Remove a product from the database with the specified ID
* @param pool  Uses pool connection to database
* @param product_id Int ID of the product to be deleted
*/
async function removeProduct(pool, product_id) {
    try {
        const checkStmt = await pool.query("SELECT product_id FROM products WHERE product_id = " + product_id);
        if (!checkStmt.rows[0]) {
            console.log("NOT FOUND");
            return;
        }
        await pool.query("DELETE FROM products_to_ingredients WHERE product_id = " + product_id);
        await pool.query("DELETE FROM products WHERE product_id = " + product_id);
        console.log("SUCCESS");
    } catch (err) {
        return err.stack;
    }
}

/**
* Hire a new employee with the given information(id, name, last_name, password, is_manager)
* @param pool  Uses pool connection to database
* @param employee_id Int employee ID
* @param first_name String first name of employee
* @param last_name String last name of employee
* @param password String password of the employee
* @param is_manager Boolean whether the employee is a manager or not
*/
async function hireEmployee(pool, employee_id, first_name, last_name, password, is_manager) {

    try {
        const checkStmt = await pool.query("SELECT employee_id FROM employees WHERE employee_id = " + employee_id);
        if (checkStmt.rows[0]) {
            console.log("SOMEONE HAS THAT EMPLOYEE ID, TRY A DIFFERENT ONE");
            return;
        }
        await pool.query("INSERT INTO employees(employee_id, first_name, last_name, password, is_manager) " +
        "VALUES (" + employee_id + ", '" + first_name + "', '" + last_name + "','" + password + "'," + is_manager +");");
        console.log("EMPLOYEE HIRED SUCCESFULLY");
    } catch (err) {
        return err.stack;
    }
}

/**
* Remove an employee from the database
* @param pool  Uses pool connection to database
* @param employee_id Int employee id
*/
async function removeEmployee(pool, employee_id) {
    try {
        const checkStmt = await pool.query("SELECT employee_id FROM employees WHERE employee_id = " + employee_id);
        if (!checkStmt.rows[0]) {
            console.log("NOT FOUND");
            return;
        }
        await pool.query("DELETE FROM employees WHERE employee_id = " + employee_id);
        console.log("EMPLOYEE REMOVED");
    } catch (err) {
        return err.stack;
    }
}

/**
* Promote a cashier to manager
* @param pool  Uses pool connection to database
* @param employee_id Int employee id to be promoted
*/
async function promoteEmployee(pool, employee_id) {
    try {
        const checkStmt = await pool.query("SELECT employee_id FROM employees WHERE employee_id = " + employee_id);
        if (!checkStmt.rows[0]) {
            console.log("NOT FOUND");
            return;
        }
        await pool.query("UPDATE employees SET is_manager = " + true + " WHERE employee_id = " + employee_id + ";");
        console.log("EMPLOYEE PROMOTED");
    } catch (err) {
        return err.stack;
    }
}

/**
* Creates a report that details how much money was made by each product in a specified timespan
* @param pool  Uses pool connection to database
* @param startDate The beginning date of the desired timespan
* @param endDate The ending date of the desired timespan
* @return String showing each product and the sales made by that product
*/
async function salesReport(pool, startDate, endDate) {
    var productsString = "";
    var productList = [];
    var totalProductSales = {};
    var report = "";
    const totalSales = await pool.query("SELECT SUM(transaction_amount::numeric::float) FROM orders WHERE transaction_time > '" 
    + startDate + "' AND transaction_time < '" + endDate + "';");

    // get list of orders within a given timespan
    const orders = await pool.query("SELECT * FROM orders WHERE transaction_time > '" + startDate + "' AND transaction_time < '" + endDate + "';");
    if (!orders.rows[0]) {
        return "No products sold in specified timespan.";
    }

    // add products from all receipts to a single variable
    for (let i = 0; i < orders.rowCount; i++) {
        productsString += orders.rows[i].receipt;
    }

    // split receipt by newline character to separate individual products
    productList = productsString.split("\n");

    // add cost of each product to dictionary that records total sales of each product
    for (let i = 0; i < productList.length; i++) {
        let productInfo = productList[i].split("...");
        if (totalProductSales[productInfo[0]]) {
            totalProductSales[productInfo[0]] = (parseFloat(totalProductSales[productInfo[0]]) 
            + parseFloat(productInfo[1])).toFixed(2);
        } else {
            totalProductSales[productInfo[0]] = parseFloat(productInfo[1]).toFixed(2);
        }
    }

    // format dictionary as a string and return result
    for (let i = 0; i < Object.keys(totalProductSales).length - 1; i++) {
        report += Object.keys(totalProductSales)[i] + "...$" + Object.values(totalProductSales)[i] + "<br>";
    }

    report += "<strong>Total Sales: $" + (totalSales.rows[0].sum).toFixed(2) + "</strong>";

    return report;
}

/**
* Creates a report that details which pairs of products were sold together the most in a specified timespan
* @param pool  Uses pool connection to database
* @param startDate The beginning date of the desired timespan
* @param endDate The ending date of the desired timespan
* @return String showing each product pair and the number of times it was sold
*/
async function togetherReport(pool, startDate, endDate) {
    var productsString = "";
    var productsList = []; // list of products
    const frequencies = {}; // dictionary of products and their frequencies
    var report = "";
    
    // get list of orders within a given timespan
    const orders = await pool.query(
        "SELECT receipt FROM orders WHERE transaction_time > '" + startDate + 
        "' AND transaction_time < '" + endDate + "';");

    if (!orders.rows[0]) {
        return "No products sold in specified timespan.";
    }

    const orderCount = orders.rowCount;

    // add products from all receipts to a single variable
    for (let i = 0; i < orderCount; i++) {
        var tempProduct = orders.rows[i].receipt;

        // remove everything from ... to end of string
        tempProduct = tempProduct.substring(0, tempProduct.indexOf("..."));
        tempProduct = tempProduct + "\n"; // to denote end of product

        productsString += tempProduct;
    }

    // split receipt by newline character to separate individual products
    productsList = productsString.split("\n");

    // remove last element of list (empty string)
    productsList.pop();

    console.log(productsList);

    // loop through products list
    for (let i = 0; i < productsList.length; i++) {
        // if product is not in dictionary, add it
        if (!frequencies[productsList[i]]) {
            frequencies[productsList[i]] = 1;
        } else {
            frequencies[productsList[i]]++;
        }
    }

    // sort dictionary by frequency -- not required, but makes it easier to read
    const sortedFrequencies = Object.keys(frequencies).sort(function(a, b) {
        return frequencies[b] - frequencies[a];
    });

    console.log(sortedFrequencies);

    const liftScores = {};

    // double loop through sorted dictionary
    for (let i = 0; i < sortedFrequencies.length; i++) {
        for (let j = i + 1; j < sortedFrequencies.length; j++) {
            product1Freq = frequencies[sortedFrequencies[i]];
            product2Freq = frequencies[sortedFrequencies[j]];
            product1And2Freq = 0;    
            
            // loop through orders
            for (let k = 0; k < orderCount; k++) {
                if (orders.rows[k].receipt.includes(sortedFrequencies[i]) && orders.rows[k].receipt.includes(sortedFrequencies[j])) {
                    product1And2Freq++;
                }
            }

            // if product1 and product2 were never bought together, skip
            if (product1And2Freq == 0) {
                continue;
            }

            // calculate lift score
            const liftScore = (product1And2Freq / orderCount) / ((product1Freq / orderCount) * (product2Freq / orderCount));
            
            // add to dictionary if lift score is >= .001
            if (liftScore >= .001) {
                liftScores[sortedFrequencies[i] + " and " + sortedFrequencies[j]] = liftScore;
            }
        }
    }

    // sort dictionary by lift score
    const sortedLiftScores = Object.keys(liftScores).sort(function(a, b) {
        return liftScores[b] - liftScores[a];
    });

    // format dictionary as a string and return result
    for (let i = 0; i < sortedLiftScores.length; i++) {
        report += sortedLiftScores[i] + ": " + liftScores[sortedLiftScores[i]].toFixed(2) + "<br>";
    }

    return report;
}

/**
* Creates a report that details which products need to be restocked
* @param pool  Uses pool connection to database
* @return String representing the products that need to be restocked, their current inventory values,
* and their assigned minimum values
*/
async function restockReport(pool) {
    try {
        const restockQuery = await pool.query("SELECT * FROM inventory WHERE quantity < minimum");
        var report = "Name, Quantity, Minimum<br>";
        for (let i = 0; i < restockQuery.rows.length; i++) {
            report += restockQuery.rows[i].ingredient_name + ", ";
            report += restockQuery.rows[i].quantity + ", ";
            report += restockQuery.rows[i].minimum;
            report += "<br>";
        }
        return report;
    } catch (err) {
        return err.stack;
    }
}

/**
* Creates a report that details which ingredient are in excess since a certain date
* @param pool  Uses pool connection to database
* @param start_date The date that begins the timespan, timespan ends with current date
* @return String showing which ingredients are in excess, if any
*/
async function excessReport(pool, start_date) {
    try {
        var products = "";
        var productList = [];
        var ingredientSalescount = {};
        var report = "";
        // get list of orders within a given timespan
        const orders = await pool.query("SELECT * FROM orders WHERE transaction_time > '" + start_date + "' AND transaction_time < Current_timestamp;");
        if (!orders.rows[0]) {
            return "No products sold in specified timespan.";
        }

        //add products from all receipts to a single variable
        for (let i = 0; i < orders.rowCount; i++) {
            products += orders.rows[i].receipt;
        }

        //split receipt by newline character to separate individual products
        productList = products.split("\n");

        //add cost of each product to dictionary that records total sales of each product
        for (let i = 0; i < productList.length - 1; i++) {
            let productInfo = productList[i].split("...");
            // get product id
            const product_query = await pool.query("SELECT product_id FROM products WHERE product_name = '" + productInfo[0] + "';");
            if (product_query.rowCount != 0) {
                var ingredient_info = await pool.query("SELECT ingredient_id, quantity FROM products JOIN products_to_ingredients " 
                + "ON products.product_id = products_to_ingredients.product_id WHERE products.product_id = '"  
                + product_query.rows[0].product_id + "';");

                if (ingredientSalescount[ingredient_info.rows[0].ingredient_id]) {
                    ingredientSalescount[ingredient_info.rows[0].ingredient_id] += ingredient_info.rows[0].quantity;
                } else {
                    ingredientSalescount[ingredient_info.rows[0].ingredient_id] = ingredient_info.rows[0].quantity;
                }
            }
        }
        
        for (let i = 0; i < Object.keys(ingredientSalescount).length; i++) {
            var key = Object.keys(ingredientSalescount)[i];
            const quantityRequest = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + key + "';");
                if (quantityRequest.rowCount != 0) {
                    var quantity = quantityRequest.rows[0].quantity + Object.values(ingredientSalescount)[i]
                if (ingredientSalescount[key] < (quantity * .1)) {
                    var nameRequest = await pool.query("SELECT ingredient_name FROM inventory WHERE ingredient_id = '" + key + "';")
                    report += nameRequest.rows[0].ingredient_name + ", sold " + ingredientSalescount[key] + " items<br>";
                }
            }
        }
        return report;
    } catch (err) {
        return err.stack;
    }
}

module.exports = {
    createPool,
    attemptLogin,
    submitOrder,
    removeItemFromOrder,
    restockInventory,
    changePrice,
    addProduct,
    removeProduct,
    hireEmployee,
    removeEmployee,
    promoteEmployee,
    salesReport,
    restockReport,
    excessReport,
    togetherReport,
    loginOAuth
}