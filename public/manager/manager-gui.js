import { request } from "../utils/client-requests.js";

// const inventory = []
const inventoryTable = document.getElementById("inventorytable")
const employeeTable = document.getElementById("employeetable")
const productTable = document.getElementById("productstable")

async function getInventory() {
    const inventory = await request("/get-inventory")

    for (const ingredient of inventory) {
        if (ingredient.ingredient_name == "null") {
            continue
        }

        const row = document.createElement("tr")
        const id = document.createElement("td")
        const name = document.createElement("td")
        const quantity = document.createElement("td")

        id.innerText = ingredient.ingredient_id
        name.innerText = ingredient.ingredient_name
        quantity.innerText = ingredient.quantity

        row.appendChild(id)
        row.appendChild(name)
        row.appendChild(quantity)

        inventoryTable.appendChild(row)
    }
}

getInventory()

async function getEmployees() {
    const employees = await request("/get-employees")

    for (const employee of employees) {
        if (employee.employee_name == "null") {
            continue
        }

        const row = document.createElement("tr")
        const id = document.createElement("td")
        const firstName = document.createElement("td")
        const lastName = document.createElement("td")
        const position = document.createElement("td")

        id.innerText = employee.employee_id
        firstName.innerText = employee.first_name
        lastName.innerText = employee.last_name
        position.innerText = employee.is_manager

        row.appendChild(id)
        row.appendChild(firstName)
        row.appendChild(lastName)
        row.appendChild(position)

        employeeTable.appendChild(row)
    }
}

getEmployees()

async function getProducts() {
    const products = await request("/menu-items")

    for (const product of products) {
        if (product.product_name == "null") {
            continue
        }

        const row = document.createElement("tr")
        const id = document.createElement("td")
        const name = document.createElement("td")
        const price = document.createElement("td")

        id.innerText = product.product_id
        name.innerText = product.product_name
        price.innerText = product.price

        row.appendChild(id)
        row.appendChild(name)
        row.appendChild(price)

        productTable.appendChild(row)
    }
}

getProducts()

function getManagerName() {
    // TODO: Get the manager username that they inputted when they logged in
    var name = "Manager";
    document.getElementById("MgrNameLabel").innerHTML = name;
}

getManagerName()

document.getElementById("logOut").addEventListener("click", function() {
    document.location.href = "../index.html";
})

document.getElementById("viewReports").addEventListener("click", function() {
    document.getElementById("reportswindow").style.display = "block";
})

document.getElementById("closeReports").addEventListener("click", function() {
    document.getElementById("reportswindow").style.display = "none";
})

document.getElementById("viewInventory").addEventListener("click", function() {
    document.getElementById("inventorywindow").style.display = "block";
})

document.getElementById("closeInventory").addEventListener("click", function() {
    document.getElementById("inventorywindow").style.display = "none";
})

document.getElementById("viewEmployees").addEventListener("click", function() {
    document.getElementById("employeeswindow").style.display = "block";
})

document.getElementById("closeEmployees").addEventListener("click", function() {
    document.getElementById("employeeswindow").style.display = "none";
})

document.getElementById("viewNewProductMaker").addEventListener("click", function() {
    document.getElementById("newproductmakerwindow").style.display = "block";
})

document.getElementById("closeNewProductMaker").addEventListener("click", function() {
    document.getElementById("newproductmakerwindow").style.display = "none";
})

function viewSalesReport() {}

function viewExcessReport() {}

function viewRestockReport() {}

function viewTogetherReport() {}

function createNewProduct() {}

function modifyProduct() {}