import { request } from "../utils/client-requests.js";

const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");
const showPasswordButton = document.getElementById("show-password");
// let darkModeButton = document.querySelector('.darkMode')
var inputPassword = document.getElementById("password_user");
const warning = document.querySelector('.warning');

// darkModeButton.addEventListener('click', () => {
//   document.documentElement.classList.toggle('dark-mode')
// })

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

inputPassword.addEventListener("keypress", function(event) {

  if (event.key === "Enter") {
    event.preventDefault();
    document.getElementById("login-form-submit").click();
  }
});

inputPassword.addEventListener('keyup', function (e) {
    if (e.getModifierState('CapsLock')) {
        warning.textContent = 'Caps lock is on!!';
    } else {
        warning.textContent = '';
    }
});