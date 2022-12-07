import { request } from "../../utils/client-requests.js"

const inventoryItems = document.getElementById("inventory-items")
const restockContent = document.getElementById("restock-content")
const restockPreMessage = document.getElementById("restock-pre-message")
const restockIngredientName = document.getElementById("restock-ingredient-name")
const addToStock = document.getElementById("add-to-stock")
const restockQuantity = document.getElementById("restock-quantity")
const thresholdMessage = document.getElementById("threshold-message")

function addCommaToNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

let currentIngredient = null

async function restockIngredient(ingredient, amount) {
    const currentAmount = ingredient.quantity

    if (amount <= 0) {
        return
    }

    const newAmount = parseInt(currentAmount) + amount

    const result = await request("/restock-ingredient", {
        id: `'${ingredient.ingredient_id}'`,
        amount: newAmount
    })

    await populateInventory()

    restockPreMessage.innerText = `${ingredient.ingredient_name} has been restocked to ${addCommaToNumber(newAmount)}.`
    restockPreMessage.style.display = "flex"
    restockContent.style.display = "none"
}

function setRestockIngredient(ingredient) {
    restockPreMessage.style.display = "none"
    restockIngredientName.innerText = `Restock ${ingredient.ingredient_name}`
    thresholdMessage.innerText = `${ingredient.quantity < ingredient.minimum ? "This ingredient is low on stock! " : ""}Threshold: ${addCommaToNumber(ingredient.minimum)}`
    restockContent.style.display = "flex"
    
    currentIngredient = ingredient
}

addToStock.addEventListener("click", async function() {
    const amount = restockQuantity.value

    if (amount == "") {
        return
    }

    await restockIngredient(currentIngredient, parseInt(amount))
})

restockQuantity.addEventListener("keydown", function(event) {
    if (event.keyCode == 13) {
        addToStock.click()
    }
})

function removeNonIntegerInput(value) {
    return value.replace(/\D/g, "")
}

restockQuantity.addEventListener("input", function() {
    restockQuantity.value = removeNonIntegerInput(restockQuantity.value)

    if (this.value.length > 0) {
        addToStock.disabled = false
    } else {
        addToStock.disabled = true
    }
})

async function populateInventory() {
    while (inventoryItems.firstChild) {
        inventoryItems.removeChild(inventoryItems.firstChild)
    }

    const inventory = await request("/get-inventory")

    for (const ingredient of inventory) {
        if (ingredient.ingredient_name === "null") {
            continue
        }

        const item = document.createElement("button")

        item.classList.add("inventory-item")

        item.innerHTML = `
            <p class="ingredient-name">${ingredient.ingredient_name}</p>
            <div class="ingredient-property ingredient-property-id">
                <p class="property-name">ID</p>
                <p class="property-value">${ingredient.ingredient_id}</p>
            </div>
            <div class="ingredient-property ingredient-property-quantity">
                <p class="property-name">Quantity</p>
                <p class="property-value">${addCommaToNumber(ingredient.quantity)}</p>
            </div>
        `

        if (ingredient.quantity < ingredient.minimum) {
            item.classList.add("low-quantity")
        }

        item.addEventListener("click", function() {
            setRestockIngredient(ingredient)
        })

        inventoryItems.appendChild(item)
    }
}

populateInventory()