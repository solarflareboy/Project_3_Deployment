
/**
 * Authenticates the user with Google OAuth, logging them in if they are registered
 * @param {*} googleUser A Google user object
 */
async function signInOAuth(googleUser) {
    const token = googleUser.credential;

    const result = await fetch("/oauth-signin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
    })

    const data = await result.text();

    if (!data) {
        alert("Error: this Google account is not registered with the system.");

        return;
    }

    const employeeInfo = JSON.parse(data);

    localStorage.setItem("employeeInfo", JSON.stringify(employeeInfo));

    if (employeeInfo.employee_type === "manager") {
        window.location.href = "/manager";
    } else {
        window.location.href = "/cashier";
    }
}