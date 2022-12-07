import { request } from "../utils/client-requests.js"

const popup = document.getElementById("popup");
const popupWindow = document.getElementById("popup-window");
const logoutButton = document.getElementById("logout-button");
const kioskView = document.getElementById("kiosk-view");

kioskView.addEventListener("click", function() {
    window.location.href = "/customer";
})

logoutButton.addEventListener("click", async function() {
    localStorage.removeItem("employeeInfo")
    await request("/logout")
    window.location.href = "/"
})

const managerName = document.getElementById("manager-name")
const employeeInfo = JSON.parse(localStorage.getItem("employeeInfo"))

if (employeeInfo) {
    managerName.innerText = `Manager: ${employeeInfo.first_name} ${employeeInfo.last_name}`
}

function openPopup(popupType) {
    const frame = document.createElement("iframe");

    frame.classList.add("popup-frame");
    frame.src = `./view-${popupType}/${popupType}.html`;

    const children = popupWindow.children;

    for (let i = 0; i < children.length; i++) {
        if (children[i].id !== "close-popup") {
            popupWindow.removeChild(children[i]);
        }
    }
    
    if (frame) {
        popupWindow.appendChild(frame);
    }

    popup.style.display = "flex";
}

let isClosing = false;

function closePopup() {
    if (isClosing) {
        return;
    }

    isClosing = true;

    popup.classList.add("closing");

    setTimeout(() => {
        popup.style.display = "none";
        popup.classList.remove("closing");

        isClosing = false;
    }, 275);
}

document.getElementById("close-popup").addEventListener("click", closePopup);
document.getElementById("viewInventory").addEventListener("click", () => openPopup("inventory"));
document.getElementById("viewProducts").addEventListener("click", () => openPopup("products"));
document.getElementById("viewReports").addEventListener("click", () => openPopup("reports"));
document.getElementById("viewEmployees").addEventListener("click", () => openPopup("employees"));

document.addEventListener("keydown", function(event) {
    if (event.key === "Escape") {
        closePopup();
    }
})

popup.addEventListener("click", function(event) {
    const { target } = event;

    if (target.id === "popup") {
        closePopup();
    }
})