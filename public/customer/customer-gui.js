import { request } from "../utils/client-requests.js";

const menuItems = document.getElementById("menu-items");
const receipt = document.getElementById("receipt");
const checkoutButton = document.getElementById("checkout-button");
const receiptItems = document.getElementById("receipt-items");
const runningTotal = document.getElementById("running-total");
const categories = document.getElementById("categories");
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const showPasswordButton = document.getElementById("show-password");
var inputPassword = document.getElementById("password_user");
const warning = document.querySelector('.warning');

const addedProducts = [];

let total = 0;

function updatePrice(newPrice) {
    total = Math.abs(newPrice);
    runningTotal.innerHTML = `<p>Subtotal: $${parseFloat(total).toFixed(2)}</p>`;
}

function textToTitleCase(text) {
    return text.replace(/\w\S*/g, function(txt) {
        return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    })
}

async function populate() {
    const products = await request("/menu-items");
    const organizedProducts = {};

    for (const product of products) {
        if (organizedProducts[product.product_type] === undefined) {
            organizedProducts[product.product_type] = [];
        }

        const item = document.createElement("button");

        item.className = "menu-tile";
        item.innerText = product.product_name;

        const image = document.createElement("img");

        if (product.image_url && product.image_url !== "") {
            image.src = product.image_url;
        } else {
            image.src = "../media/no-image.png";
        }
        
        image.className = "menu-tile-image";

        item.appendChild(image);

        item.addEventListener("click", () => {
            const item = document.createElement("div");

            item.className = "receipt-item";
            item.style = "position: relative";
            item.innerText = `${product.product_name} - $${parseFloat(product.price).toFixed(2)}`;

            const xButton = document.createElement("p");

            xButton.innerText = "\u2716";
            xButton.className = "receipt-item-x";
            xButton.addEventListener("click", function() {
                updatePrice(total - product.price);
                item.remove();
            });

            item.appendChild(xButton);

            receiptItems.appendChild(item);
            addedProducts.push(product);

            updatePrice(total + product.price);
        })

        product.element = item;

        organizedProducts[product.product_type].push(product);
    }

    const firstCategory = Object.keys(organizedProducts)[0];

    for (const product of organizedProducts[firstCategory]) {
        menuItems.appendChild(product.element);
    }

    for (const productType in organizedProducts) {
        const category = document.createElement("button");

        category.classList.add("category");
        category.classList.add("glow-button");
        category.innerText = textToTitleCase(productType);

        category.addEventListener("click", function() {
            menuItems.innerHTML = "";

            for (const product of organizedProducts[productType]) {
                menuItems.appendChild(product.element);
            }
        })

        categories.appendChild(category);
    }
}

checkoutButton.addEventListener("click", async () => {
    const result = await request("/checkout", { products: addedProducts });

    alert(result);

    // Clear the receipt
    receiptItems.innerHTML = "";
    window.location.reload();
})

populate();

showPasswordButton.addEventListener("click", function() {
    var user_password = document.getElementById("password_user");
    if (user_password.type == "password") {
        user_password.type = "text";
    } else {
        user_password.type = "password";
    }
});

loginButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const username = loginForm.username.value;
    const password = loginForm.password.value;

    const response = await request("/login", { username, password });

    console.log(response);

    switch (response) {
        // TODO: successful login will have cookie attached so only authenticated users can access pages

        case "LOGIN_MANAGER":
            window.location.href = "/manager";
            break;

        case "LOGIN_CASHIER":
            window.location.href = "/cashier";
            break;

        default: // LOGIN_FAILED
            alert("Error: Username or Password is incorrect.");
    }
});

inputPassword.addEventListener("keypress", function(event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("login-form-submit").click();
    }
});

inputPassword.addEventListener('keyup', function(e) {
    if (e.getModifierState('CapsLock')) {
        warning.textContent = 'Caps lock is on!!';
    } else {
        warning.textContent = '';
    }
});