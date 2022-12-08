import { request } from "../utils/client-requests.js"

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const showPasswordButton = document.getElementById("show-password");
const inputPassword = document.getElementById("password_user");
const capsWarning = document.getElementById("caps-warning");

// Show the password when the user clicks the "show password" button.
showPasswordButton.addEventListener("click", function () {
    const user_password = document.getElementById("password_user");

    if (user_password.type == "password") {
        user_password.type = "text";
    } else {
        user_password.type = "password";
    }
});

// Attempt to log in the user when they click the "login" button.
loginButton.addEventListener("click", async (event) => {
    event.preventDefault();

    const username = loginForm.username.value;
    const password = loginForm.password.value;
    const employeeInfo = await request("/login", { username, password });

    if (!employeeInfo) {
        alert("Error: Username or Password is incorrect.");
    }

    localStorage.setItem("employeeInfo", JSON.stringify(employeeInfo));

    if (employeeInfo.employee_type === "manager") {
        window.location.href = "/manager";
    } else {
        window.location.href = "/cashier";
    }
});

// Attempt to log in the user when they press the "enter" key.
inputPassword.addEventListener("keypress", function (event) {
    if (event.key === "Enter") {
        event.preventDefault();
        document.getElementById("login-form-submit").click();
    }
});

// Show a warning if the user has caps lock on.
inputPassword.addEventListener("keyup", function (e) {
    if (e.getModifierState("CapsLock")) {
        capsWarning.textContent = "Caps lock is on!!";
    } else {
        capsWarning.textContent = "";
    }
});