function logOut() {
    var url = "HomePage.html";
    var win = window.open(url, "_self");
    win.focus();
}

function getManagerName() {
    //TODO: Get the manager username that they inputted when they logged in
    var name = "Manager";
    document.getElementById("MgrNameLabel").innerHTML = name;
}

function openReports() {
    // window.open("Reports.html", "_self");
}

function openInventory() {
    // window.open("Inventory.html", "_self");
}

function openEmployees() {
    // window.open("Employees.html", "_self");
}

function openNewProductMaker() {
    // window.open("NewProductMaker.html", "_self");
}