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
    var employeeId =  -1;
    try {
        const res = await pool.query(
            "SELECT * FROM employees WHERE last_name ='" + user + "';"
        );
        if (res.rows[0].password == password) {
            bool = true;
        }
        if (res.rows[0].is_manager == false) {
            type = "CASHIER";
        }
        else {
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
        for(let i = 0; i < products.length; i++){
            totalCost += products[i].price;
            receipt += (products[i].product_name + "..." + products[i].price + "\n");

            decreaseInventory(pool, products[i]);
        }
        await pool.query("INSERT INTO orders(transaction_amount, cashier_id, receipt, transaction_time) " +
            "VALUES (" + totalCost + ", " + employee_id + ", " + "'" + receipt + "'" + ", '" + "now" + "');");
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
        "ON products.product_id = products_to_ingredients.product_id WHERE products.product_id = '" + product.product_id
        + "';");
        var ingredientID = res.rows[0].ingredient_id
        var quantityToDecrease = res.rows[0].quantity

        const quantityRes = await pool.query("SELECT quantity FROM inventory WHERE ingredient_id = '" + ingredientID + "';");
        var currentQuantity = quantityRes.rows[0].quantity
        if(currentQuantity <= 0){
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

const pool = createPool();

// Example of how to use functions with a return with .then
// attemptLogin(pool, "Example", "12345").then(function(returnVal) {
//     console.log(returnVal)
// })
// getTotalSales(pool, "10-8-2022", "10-20-2022").then(function(returnVal) {
//     console.log(returnVal["sum"])
// })

module.exports = {
    createPool,
    attemptLogin,
    submitOrder
}