import { request } from "../../utils/client-requests.js"

const productItems = document.getElementById("product-items")
const modifyContent = document.getElementById("modify-content")
const modifyPreMessage = document.getElementById("modify-pre-message")
const modifyProductName = document.getElementById("modify-product-name")
const modifyProductNameInput = document.getElementById("modify-product-name-input")
const modifyProductPriceInput = document.getElementById("modify-product-price-input")
const confirmChanges = document.getElementById("confirm-changes")
const removeProduct = document.getElementById("remove-product")
const ingredientsItems = document.getElementById("ingredients-items")

let inventory = null
let currentProduct = null

function convertToDollars(num) {
    return parseFloat(num).toFixed(2)
}

confirmChanges.addEventListener("click", async function() {
    await request("/modify-product", {
        product_id: currentProduct.product_id,
        product_name: modifyProductNameInput.value,
        price: modifyProductPriceInput.value
    })

    modifyPreMessage.innerText = `Successfully saved ${modifyProductNameInput.value} with price $${modifyProductPriceInput.value}.`
    modifyPreMessage.style.display = "flex"
    modifyContent.style.display = "none"

    populateProducts()
})

removeProduct.addEventListener("click", async function() {
    var id = currentProduct.product_id
    await request("/remove-product", {
        product_id: id
    })

    modifyPreMessage.innerText = `Successfully removed ${currentProduct.product_name}.`
    modifyPreMessage.style.display = "flex"
    modifyContent.style.display = "none"

    populateProducts()
})

modifyProductPriceInput.addEventListener("input", function() {
    modifyProductPriceInput.value = convertToDollars(modifyProductPriceInput.value)
})

function setCurrentProduct(product) {
    currentProduct = product

    modifyPreMessage.style.display = "none"
    modifyProductName.innerText = product.product_name
    modifyProductNameInput.value = product.product_name
    modifyProductPriceInput.value = convertToDollars(product.price)
    modifyContent.style.display = "flex"
}

const typeSelect = document.getElementById("type-select")
const productTypes = []

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1)
}

async function populateProducts() {
    while (productItems.firstChild) {
        productItems.removeChild(productItems.firstChild)
    }

    const products = await request("/menu-items")

    for (const product of products) {
        if (product.product_name === "null") {
            continue
        }

        if (!productTypes.includes(product.product_type)) {
            productTypes.push(product.product_type)

            const option = document.createElement("option")

            option.value = product.product_type
            option.innerText = capitalizeFirstLetter(product.product_type)

            typeSelect.appendChild(option)
        }

        const item = document.createElement("button")

        item.classList.add("product-item")

        item.innerHTML = `
            <p class="product-name">${product.product_name}</p>
            <div class="product-property product-property-id">
                <p class="property-name">ID</p>
                <p class="property-value">${product.product_id}</p>
            </div>
            <div class="product-property product-property-price">
                <p class="property-name">Price</p>
                <p class="property-value">$${convertToDollars(product.price)}</p>
            </div>
        `

        item.addEventListener("click", function() {
            setCurrentProduct(product)
        })

        productItems.appendChild(item)
    }
}

const checked = []
const createProductNameInput = document.getElementById("create-product-name-input")
const createProductPriceInput = document.getElementById("create-product-price-input")
const confirmCreate = document.getElementById("confirm-create")

function updateButton() {
    if (checked.length === 0 || createProductNameInput.value === "" || createProductPriceInput.value === "") {
        confirmCreate.disabled = true
    } else {
        confirmCreate.disabled = false
    }
}

async function setupIngredients() {
    inventory = await request("/get-inventory")

    for (const ingredient of inventory) {
        const item = document.createElement("label")
        const checkbox = document.createElement("input")
        const text = document.createElement("p")

        item.classList.add("ingredient-item")

        checkbox.type = "checkbox"
        checkbox.id = `ingredient-${ingredient.ingredient_id}`
        checkbox.name = ingredient.ingredient_name

        text.innerText = ingredient.ingredient_name

        item.appendChild(checkbox)
        item.appendChild(text)

        ingredientsItems.appendChild(item)
        
        checkbox.addEventListener("change", function() {
            if (checkbox.checked) {
                checked.push(ingredient.ingredient_id)
            } else {
                checked.splice(checked.indexOf(ingredient.ingredient_id), 1)
            }

            updateButton()
        })
    }
}

createProductNameInput.addEventListener("input", updateButton)
createProductPriceInput.addEventListener("input", updateButton)

confirmCreate.addEventListener("click", async function() {
    var name = createProductNameInput.value
    var price = createProductPriceInput.value
    var type = typeSelect.value

    const result = await request("/create-product", {
        product_name: name,
        price: price,
        product_type: type,
        ingredients: checked
    })

    populateProducts()
})

populateProducts()
setupIngredients()