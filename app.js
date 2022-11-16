const fs = require("fs")
const path = require("path");
const express = require("express")
const app = express()
const { Pool } = require('pg')

// Load the dotenv data into this process's environment
require('dotenv').config()

// The port and a connection pool to the database
const port = 8000 | process.env.PORT
const dbreq = require('./src/db-requests')
const pool = dbreq.createPool()
var currEmployee = -1

// Allow JSON objects to be passed through requests
app.use(express.json())

// Serve static files from the public directory
app.use(express.static("public"))

// Starting the server
app.listen(port, () => {
    console.log(`Server successfully started on port ${port}.`)
})

// This will later be moved into dbrequests
app.get("/menu-items", async (req, res) => {
    const products = []
    const result = await pool.query("SELECT * FROM products ORDER BY product_id ASC;")

    for (let i = 0; i < result.rowCount; i++){
        products.push(result.rows[i])
    }
    
    res.send(products)
})

app.post("/login", (req, res) => {
    const { username, password } = req.body
    
    dbreq.attemptLogin(pool, username, password).then(function(returnVal) {
        if (returnVal[0]) {
            res.send("LOGIN_" + returnVal[1])
            // currEmployee = returnVal[2]
            // console.log(currEmployee, "EMPLOYEEEEEEEE")
        } else {
            res.send("LOGIN_FAILED")
        }
    })
})

app.post("/checkout", async (req, res) => {
    const products = req.body

    await dbreq.submitOrder(pool, products, currEmployee)

    res.send("Checkout successful!")
})

app.get("/get-inventory", async (req, res) => {
    const inventory = []
    const result = await pool.query("SELECT * FROM inventory ORDER BY ingredient_id_integer ASC;")

    for (let i = 0; i < result.rowCount; i++){
        inventory.push(result.rows[i])
    }
    
    res.send(inventory)
})

app.get("/get-employees", async (req, res) => {
    const employees = []
    const result = await pool.query("SELECT * FROM employees ORDER BY employee_id ASC;")

    for (let i = 0; i < result.rowCount; i++) {
        employees.push(result.rows[i])
    }
    
    res.send(employees)
})
