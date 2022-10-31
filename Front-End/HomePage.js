function showPassword() {
    var user_password = document.getElementById("password_user");
    if (user_password.type == "password") {
        user_password.type = "text";
    } 
    else {
        user_password.type = "password";
    }
  }
  
const loginForm = document.getElementById("login-form");
const loginButton = document.getElementById("login-form-submit");

loginButton.addEventListener("click", (event) => {
    event.preventDefault();
    const username = loginForm.username.value;
    const password = loginForm.password.value;

    if (username === "Manager" && password === "12345") {
        alert("You have successfully logged in.");
        location.replace("managergui.html");
    } else {
        alert("You have either wrong username or wrong password.");
    }
})