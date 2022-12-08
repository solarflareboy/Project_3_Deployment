const fs = require("fs");
const path = require("path");
const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const crypto = require("crypto");
const { Pool } = require("pg");

// Load the dotenv data into this process's environment
require('dotenv').config();

// The port and a connection pool to the database
const port = 8000 | process.env.PORT
const dbreq = require('./src/db-requests');
const pool = dbreq.createPool();

// OAuth objects
const { OAuth2Client } = require("google-auth-library");
const client = new OAuth2Client(process.env.CLIENT_ID);

// Allow JSON objects to be passed through requests
app.use(express.json());

// Serve static files from the public directory
app.use(express.static("public"));

// Starting the server
app.listen(port, () => {
    console.log(`Server successfully started on port ${port}.`);
});

// Allowing cookies to be used
app.use(cookieParser());

// OAuth sign-in
app.post("/oauth-signin", async (req, res) => {
    const token = req.body.token;
    const employeeInfo = await dbreq.loginOAuth(pool, token, client);

    if (employeeInfo) {
        res.cookie("session-token", token);
        res.send(employeeInfo);

        return;
    }

    res.send(null);
})

// Logging out, clearing the session cookie
app.get("/logout", (req, res) => {
    res.clearCookie("session-token");
    res.redirect("/");
})

// Fetching the menu items
app.get("/menu-items", async (req, res) => {
    const products = [];
    const result = await pool.query("SELECT * FROM products ORDER BY product_id ASC;");

    for (let i = 0; i < result.rowCount; i++) {
        products.push(result.rows[i]);
    }
    
    res.send(products);
});

// Get a product by its ID
app.post("/get-product-by-id", async (req, res) => {
    const body = req.body;
    console.log(body);
    const id = body.product_id;
    const result = await pool.query(`SELECT * FROM products WHERE product_id = ${id};`);
    console.log(result.rows[0]);
    res.send(result.rows[0]);
});

// Get an ingredient by its ID
app.post("/get-ingredient-by-id", async (req, res) => {
    const body = req.body;
    console.log(body);
    const id = body.ingredient_id;
    const result = await pool.query(`SELECT * FROM inventory WHERE ingredient_id = ${id};`);
    console.log(result.rows[0]);
    res.send(result.rows[0]);
});

// Get an employee by its ID
app.post("/get-employee-by-id", async (req, res) => {
    const body = req.body;
    const id = body.employee_id;
    const result = await pool.query(`SELECT * FROM employees WHERE employee_id = ${id};`);
    res.send(result.rows[0]);
});

// Update the information about a product
app.post("/modify-product", async (req, res) => {
    const body = req.body;
    const id = body.product_id;
    const name = body.product_name;
    const price = body.price;
    const result = await pool.query(`UPDATE products SET product_name = '${name}', price = ${price} WHERE product_id = ${id};`);
    res.send(result);
});

// Restock an ingredient by a specified amount
app.post("/restock-ingredient", async (req, res) => {
    const body = req.body;
    const id = body.id;
    const amount = body.amount;
    const result = await pool.query(`UPDATE inventory SET quantity = ${amount} WHERE ingredient_id = ${id};`);
    console.log(result);
    res.send(result);
});

// Update the information about an employee
app.post("/modify-employee", async (req, res) => {
    const body = req.body;
    const id = body.employee_id;
    const firstName = body.first_name;
    const lastName = body.last_name;
    const result = await pool.query(`UPDATE employees SET first_name = '${firstName}', last_name = '${lastName}' WHERE employee_id = ${id};`);
    res.send(result);
});

// Remove a product from the menu
app.post("/remove-product", async (req, res) => {
    const body = req.body;
    const id = body.product_id;
    console.log("Calling database to delete product with id: " + id);
    const result1 = await pool.query(`DELETE FROM products_to_ingredients WHERE product_id = ${id};`);
    const result = await pool.query(`DELETE FROM products WHERE product_id = ${id};`);
    res.send(result);
});

// Remove an employee from the database
app.post("/remove-employee", async (req, res) => {
    const body = req.body;
    const id = body.employee_id;
    console.log("Calling database to delete product with id: " + id);
    const result = await pool.query(`DELETE FROM employees WHERE employee_id = ${id};`);
    res.send(result);
});

// Add a new employee to the database
app.post("/add-employee", async (req, res) => {
    const body = req.body;
    const firstName = body.first_name;
    const lastName = body.last_name;
    const password = body.password;
    var newIDResult = await (await pool.query('SELECT MAX(employee_id) FROM employees;'));
    var newID = newIDResult.rows[0].max + 1;

    const result = await pool.query(`INSERT INTO employees(employee_id, first_name, last_name, password, is_manager) 
    VALUES (${newID}, '${firstName}', '${lastName}', '${password}', 'false');`);
    res.send(result);
});

// Promote an employee to become a manager
app.post("/promote-employee", async (req, res) => {
    const body = req.body;
    const employee_id = body.employee_id;
    var result  = await pool.query("UPDATE employees SET is_manager = " + true + " WHERE employee_id = " + employee_id + ";");
    res.send(result);
});

// Attempt to log in with a username and password
app.post("/login", (req, res) => {
    const { username, password } = req.body;
    
    dbreq.attemptLogin(pool, username, password).then(employeeInfo => {
        if (!employeeInfo) {
            res.send(null);
            return;
        }

        const token = crypto.createHash("sha256").update(`${username}:${password}`).digest("base64");

        res.cookie("session-token", token);
        res.send(employeeInfo);
    })
})

// Check out an order
app.post("/checkout", async (req, res) => {
    const data = req.body;
    await dbreq.submitOrder(pool, data.products, data.employee_id ? data.employee_id : -1)

    res.send("Checkout successful!");
});

// Fetch the inventory
app.get("/get-inventory", async (req, res) => {
    const inventory = [];
    const result = await pool.query("SELECT * FROM inventory ORDER BY ingredient_id_integer ASC;");

    for (let i = 0; i < result.rowCount; i++) {
        inventory.push(result.rows[i]);
    }
    
    res.send(inventory);
});

// Fetch the current employees
app.get("/get-employees", async (req, res) => {
    const employees = [];
    const result = await pool.query("SELECT * FROM employees ORDER BY employee_id ASC;");

    for (let i = 0; i < result.rowCount; i++) {
        employees.push(result.rows[i]);
    }
    
    res.send(employees);
});

// The sales report
app.post("/sales-report", async(req, res) =>{
    var dates = req.body;
    var report = await dbreq.salesReport(pool, dates[0], dates[1]);
    res.send(report);
});

// The restock report
app.get("/restock-report", async(req, res) =>{
    var report = await dbreq.restockReport(pool);
    res.send(report);
});

// The excess report
app.post("/excess-report", async(req, res) =>{
    var start_date = req.body.startDate;
    var report = await dbreq.excessReport(pool, start_date);
    res.send(report);
});

// The sells together report
app.post("/together-report", async(req, res) =>{
    var dates = req.body;
    var report = await dbreq.togetherReport(pool, dates[0], dates[1]);
    res.send(report);
});

// Creating a new product
app.post("/create-product", async (req, res) => {
    var body = req.body;
    var name = body.product_name;
    var price = body.price;
    var type = body.product_type;
    var ingredients = body.ingredients;
    var newIDResult = (await pool.query('SELECT MAX(product_id) FROM products;'));
    var newID = newIDResult.rows[0].max + 1;

    const result = await pool.query(`INSERT INTO products(product_id, product_name, price, product_type, image_url) 
    VALUES (${newID}, '${name}', '${price}', '${type}', '../media/no-image.png');`);

    for (let i = 0; i < ingredients.length; i++) {
        await pool.query(`INSERT INTO products_to_ingredients(product_id, ingredient_id, quantity) 
        VALUES (${newID}, '${ingredients[i]}', 1);`);
    }
    
    res.send(result);
});