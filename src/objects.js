// Employee object
const Employee = {
    employeeId: 1,
    isManager: false
}

// Order Object
const Order = {
    items: [],
    cashierID: -1,
    addItem: function(item) {
        this.items.push(item);
    },
    removeItem: function(item) {
        const index = this.items.indexOf(item);
        if (index > -1){
            this.items.splice(index, 1);
        }
    }
}

// Export objects to be used
module.exports = {
    Employee,
    Order
}   