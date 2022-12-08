import { request } from "../../utils/client-requests.js"

const employeesWindow = document.getElementById("employees-window");
const modifyPreMessage = document.getElementById("modify-pre-message");
const modifyContent = document.getElementById("modify-content");
const modifyEmployeeName = document.getElementById("modify-employee-name");
const firstNameInput = document.getElementById("first-name-input");
const lastNameInput = document.getElementById("last-name-input");
const confirmChanges = document.getElementById("confirm-changes");
const promoteEmployee = document.getElementById("promote-employee");
const fireEmployee = document.getElementById("fire-employee");

let currentEmployee = null

/**
 * Sets the panel to display a message instead of the modify employee form, automatically hiding the form.
 * @param message The message to display.
 */
function setPanelMessage(message) {
    modifyPreMessage.innerText = message;
    modifyPreMessage.style.display = "flex";
    modifyContent.style.display = "none";
}

/**
 * Saves the changes made to the currently-selected employee.
 */
async function saveChanges() {
    const success = await request("/modify-employee", {
        employee_id: currentEmployee.employee_id,
        first_name: firstNameInput.value,
        last_name: lastNameInput.value
    })

    if (success) {
        setPanelMessage(`Successfully saved ${firstNameInput.value} ${lastNameInput.value}.`);
    } else {
        setPanelMessage(`Failed to save ${currentEmployee.first_name} ${currentEmployee.last_name}.`);
    }

    populateEmployees();
}

lastNameInput.addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        saveChanges();
    }
})

confirmChanges.addEventListener("click", saveChanges);

// Promotes the currently-selected employee to a manager.
promoteEmployee.addEventListener("click", async function() {
    if (firstNameInput.value !== currentEmployee.first_name || lastNameInput.value !== currentEmployee.last_name) {
        await request("/modify-employee", {
            employee_id: currentEmployee.employee_id,
            first_name: firstNameInput.value,
            last_name: lastNameInput.value
        })
    }

    await request("/promote-employee", {
        employee_id: currentEmployee.employee_id
    })

    setPanelMessage(`Successfully promoted ${firstNameInput.value} ${lastNameInput.value} to Manager.`);

    populateEmployees();
})

// Fires the currently-selected employee.
fireEmployee.addEventListener("click", async function() {
    const success = await request("/remove-employee", {
        employee_id: currentEmployee.employee_id
    })

    if (success) {
        setPanelMessage(`Successfully fired ${firstNameInput.value} ${lastNameInput.value}.`);
    } else {
        setPanelMessage(`Failed to fire ${currentEmployee.first_name} ${currentEmployee.last_name}.`);
    }

    populateEmployees();
})

/**
 * Sets an employee to be the currently-selected employee.
 * @param {Employee} employee An employee object.
 */
function setCurrentEmployee(employee) {
    currentEmployee = employee;

    modifyPreMessage.style.display = "none";
    modifyEmployeeName.innerText = `${employee.last_name}, ${employee.first_name} (${employee.is_manager ? "Manager" : "Cashier"})`;
    firstNameInput.value = employee.first_name;
    lastNameInput.value = employee.last_name;

    if (employee.is_manager) {
        promoteEmployee.style.display = "none";
        fireEmployee.style.display = "none";
    } else {
        promoteEmployee.style.display = "block";
        fireEmployee.style.display = "block";
    }

    modifyContent.style.display = "flex";
}

/**
 * Populates the employees window with all employees.
 */
async function populateEmployees() {
    while (employeesWindow.firstChild) {
        employeesWindow.removeChild(employeesWindow.firstChild);
    }

    const employees = await request("/get-employees");

    for (const employee of employees) {
        const item = document.createElement("button");

        item.classList.add("employee");

        item.innerHTML = `
            <p class="employee-name">${employee.last_name}, ${employee.first_name}</p>
            <div class="employee-property">
                <p class="property-name">ID</p>
                <p class="property-value">${employee.employee_id}</p>
            </div>
            <div class="employee-property employee-type">
                <p class="property-name">Type</p>
                <p class="property-value">${employee.is_manager ? "Manager" : "Cashier"}</p>
            </div>
        `;

        item.addEventListener("click", function() {
            setCurrentEmployee(employee);
        })

        employeesWindow.appendChild(item);
    }
}

populateEmployees()

const addEmployeeFirstName = document.getElementById("add-employee-first-name");
const addEmployeeLastName = document.getElementById("add-employee-last-name");
const addEmployeePassword = document.getElementById("add-employee-password");
const addEmployeePasswordConfirm = document.getElementById("add-employee-password-confirm");
const confirmAdd = document.getElementById("confirm-add");
const matchMessage = document.getElementById("match-message");

/**
 * Checks whether the text in the password and confirm password fields match.
 * @returns {boolean} Whether the passwords match.
 */
function arePasswordsMatching() {
    return addEmployeePassword.value === addEmployeePasswordConfirm.value;
}

/**
 * Checks whether the input for adding an employee is valid.
 * @returns {boolean} Whether the input is valid.
 */
function checkInputValidity() {
    if (arePasswordsMatching()) {
        matchMessage.innerText = "";
    } else {
        matchMessage.innerText = "Passwords do not match.";
        confirmAdd.disabled = true;

        return;
    }

    if (addEmployeeFirstName.value.length > 0 && addEmployeeLastName.value.length > 0 && addEmployeePassword.value.length > 0 && addEmployeePasswordConfirm.value.length > 0) {
        confirmAdd.disabled = false;
    } else {
        confirmAdd.disabled = true;
    }
}

addEmployeeFirstName.addEventListener("input", checkInputValidity);
addEmployeeLastName.addEventListener("input", checkInputValidity);
addEmployeePassword.addEventListener("input", checkInputValidity);
addEmployeePasswordConfirm.addEventListener("input", checkInputValidity);

/**
 * Adds an employee to the database.
 */
async function addEmployee() {
    await request("/add-employee", {
        first_name: addEmployeeFirstName.value,
        last_name: addEmployeeLastName.value,
        password: addEmployeePassword.value
    })

    addEmployeeFirstName.value = "";
    addEmployeeLastName.value = "";
    addEmployeePassword.value = "";
    addEmployeePasswordConfirm.value = "";

    populateEmployees();
}

confirmAdd.addEventListener("click", addEmployee);

addEmployeePasswordConfirm.addEventListener("keydown", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        addEmployee();
    }
})