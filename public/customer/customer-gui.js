import { request } from "../utils/client-requests.js";

const menuItems = document.getElementById("menu-items")
const receipt = document.getElementById("receipt")
const checkoutButton = document.getElementById("checkout-button")
const receiptItems = document.getElementById("receipt-items")
const runningTotal = document.getElementById("running-total")
const categories = document.getElementById("categories")

const addedProducts = []

let total = 0

function updatePrice(newPrice) {
    total = Math.abs(newPrice)
    runningTotal.innerHTML = `<p>Subtotal: $${parseFloat(total).toFixed(2)}</p>`
}

function textToTitleCase(text) {
    return text.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
    })
}

async function populate() {
    const products = await request("/menu-items")
    const organizedProducts = {}

    for (const product of products) {
        if (organizedProducts[product.product_type] === undefined) {
            organizedProducts[product.product_type] = []
        }

        const item = document.createElement("button")

        item.className = "menu-tile"
        item.innerText = product.product_name

        const image = document.createElement("img")

        if (product.image_url && product.image_url !== "") {
            image.src = product.image_url
        } else {
            image.src = "../media/no-image.png"
        }
        
        image.className = "menu-tile-image"

        item.appendChild(image)

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

        product.element = item

        organizedProducts[product.product_type].push(product)
    }

    const firstCategory = Object.keys(organizedProducts)[0]

    for (const product of organizedProducts[firstCategory]) {
        menuItems.appendChild(product.element)
    }

    for (const productType in organizedProducts) {
        const category = document.createElement("button")

        category.classList.add("category")
        category.classList.add("glow-button")
        category.innerText = textToTitleCase(productType)

        category.addEventListener("click", function() {
            menuItems.innerHTML = ""

            for (const product of organizedProducts[productType]) {
                menuItems.appendChild(product.element)
            }
        })

        categories.appendChild(category)
    }
}

checkoutButton.addEventListener("click", async () => {
    const result = await request("/checkout", addedProducts)

    alert(result)

    // Clear the receipt
    receiptItems.innerHTML = ""
    window.location.reload()
})

populate()