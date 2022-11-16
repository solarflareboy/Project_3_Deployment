import { request } from "../utils/client-requests.js";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const showPasswordButton = document.getElementById("show-password");

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

    const response = await request("/login", { username, password })

    console.log(response)

    switch (response) {
        // TODO: successful login will have cookie attached so only authenticated users can access pages

        case "LOGIN_MANAGER":
            console.log("fdsaf")
            window.location.href = "/manager";
            break;

        case "LOGIN_CASHIER":
            window.location.href = "/cashier";
            break;

        default: // LOGIN_FAILED
            alert("Error: Username or Password is incorrect.");
    }
});

const menuItems = document.getElementById("menu-items")
const receipt = document.getElementById("receipt")
const checkoutButton = document.getElementById("checkout-button")
const addedProducts = []

async function populate() {
    const products = await request("/menu-items")

    for (const product of products) {
        const item = document.createElement("button")

        item.innerText = product.product_name

        menuItems.appendChild(item)

        item.addEventListener("click", () => {
            const item = document.createElement("div")

            item.className = "menu-item"
            item.innerText = product.product_name

            receipt.appendChild(item)
            addedProducts.push(product)
        })
    }
}

checkoutButton.addEventListener("click", async () => {
    const result = await request("/checkout", addedProducts)

    alert(result)

    window.location.href = "/"
})

populate()