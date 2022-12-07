const { Pool } = require("pg");
const objects = require("./objects.js")

// Creates a pool to connect to database that allows querying
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
        pool.end()

        console.log("The application has shut down.")
        process.exit(0)
    })

    return pool;
}

/**
 * Checks if login info given by the user is valid
 * @param pool Uses pool connection to database
 * @param user The username of the user attempting to log in
 * @param pass The password of the user attempting to log in
 * @return Array with bool if passwords match, type of employee, and employee_id
 */
async function attemptLogin(pool, user, password) {
    var bool = false;
    var type = '';
    var employeeId = -1;
    try {
        const res = await pool.query("SELECT * FROM employees WHERE last_name ='" + user + "';");

        if (res.rows[0].password == password) {
            bool = true;
        }

        if (res.rows[0].is_manager == false) {
            type = "CASHIER";
        } else {
            type = "MANAGER";
        }

        employeeId = res.rows[0].employee_id;
        return [bool, type, employeeId];
    } catch (err) {
        return err.stack;
    }
}

/**
 * Gets the total sales from the order history within a specified time interval
 * @param pool Uses pool connection to database
 * @param startDate String beginning time of the time interval
 * @param endDate String ending time of the time interval
 * @return Float of total sales from orders inventory
 */
async function getTotalSales(pool, start_date, end_date) {
    var totalSales = 0;

    try {
        const res = await pool.query(
            "SELECT SUM(transaction_amount::numeric::float) FROM orders WHERE transaction_time > '" + start_date
            + "' AND transaction_time < '" + end_date + "';"
        );
        totalSales = res.rows[0]
        return totalSales;
    } catch (err) {
        return err.stack;
    }
}

/**
* Finalizes the Order and pushes it to the Orders DB.
* Also calls decreaseInventory to deallocate items from the inventory DB.
* @param pool Uses pool connection to database
* @param products Array of products thats made when creating an order
* @param employee_id Int of employee_id
*/
async function submitOrder(pool, products, employee_id) {
    // TODO: invoke database call to process order and update inventory
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
async function decreaseInventory(pool, product){
    try {
        const res = await pool.query("SELECT ingredient_id, quantity FROM products JOIN products_to_ingredients " +
        "ON products.product_id = products_to_ingredients.product_id WHERE products.product_id = '" + product.product_id + "';");
        var ingredientID = res.rows[0].ingredient_id
        var quantityToDecrease = res.rows[0].quantity

        const quantityRes = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + ingredientID + "';");
        var currentQuantity = quantityRes.rows[0].quantity
        if (currentQuantity <= 0) {
            return
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
async function changePrice(pool, product_id, new_price){
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
async function addProduct(pool, ingredient_id_list, product_id, product_name, price, product_type){
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
async function removeProduct(pool, product_id){
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
async function salesReport(pool, startDate, endDate){
    var products = "";
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
        products += orders.rows[i].receipt;
    }

    // split receipt by newline character to seperate individual products
    productList = products.split("\n");

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
* Creates a report that details which products need to be restocked
* @param pool  Uses pool connection to database
* @return String representing the products that need to be restocked, their current inventory values,
* and their assigned minimum values
*/
async function restockReport(pool) {
    try {
        const restockQuery = await pool.query("SELECT * FROM inventory WHERE quantity < minimum");
        var report = "Name, Quantity, Minimum<br>";
        for (let i = 0; i < restockQuery.rows.length; i++){
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
    try{
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

        //split receipt by newline character to seperate individual products
        productList = products.split("\n");

        //add cost of each product to dictionary that records total sales of each product
        for (let i = 0; i < productList.length - 1; i++) {
            let productInfo = productList[i].split("...");
            // get product id
            const product_query = await pool.query("SELECT product_id FROM products WHERE product_name = '" + productInfo[0] + "';");
            if(product_query.rowCount != 0){
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
            var key = Object.keys(ingredientSalescount)[i]
            const quantityRequest = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + key + "';");
                if(quantityRequest.rowCount != 0){
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
    excessReport
}