function showPassword() {
    var user_password = document.getElementById("password_user");
    if (user_password.type === "password") {
        user_password.type = "text";
    } 
    else {
        user_password.type = "password";
    }
  }
  