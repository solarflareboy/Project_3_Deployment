import { request } from "../utils/client-requests.js"

const menuItems = document.getElementById("menu-items")
const receiptItems = document.getElementById("receipt-items")
const checkoutButton = document.getElementById("checkout-button")
const runningTotal = document.getElementById("running-total")
const logoutButton = document.getElementById("logout-button")
const addedProducts = []

let total = 0

function updatePrice(newPrice) {
    total = Math.abs(newPrice)
    runningTotal.innerHTML = `<p>Total: $${parseFloat(total).toFixed(2)}</p>`
}

async function populate() {
    const products = await request("/menu-items")

    for (const product of products) {
        const item = document.createElement("button")

        item.className = "menu-tile"
        item.innerText = product.product_name

        menuItems.appendChild(item)

        item.addEventListener("click", () => {
            const item = document.createElement("div")

            item.className = "receipt-item"
            item.style = "position: relative"
            item.innerText = `${product.product_name} - $${parseFloat(product.price).toFixed(2)}`

            const xButton = document.createElement("p")

            xButton.innerText = "\u2716"
            xButton.className = "receipt-item-x"
            xButton.addEventListener("click", function() {
                updatePrice(total - product.price)
                item.remove()
            })

            item.appendChild(xButton)

            receiptItems.appendChild(item)
            addedProducts.push(product)

            updatePrice(total + product.price)
        })
    }
}

checkoutButton.addEventListener("click", async () => {
    const result = await request("/checkout", addedProducts)

    alert(result)

    window.location.href = "/cashier"
})

logoutButton.addEventListener("click", function() {
    window.location.href = "../"
})

populate()