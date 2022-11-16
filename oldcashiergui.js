// This would have javasciprt for your gui.

function priceFromName(productName){
    var price = 0;
    for(let i in products){
        if(products[i].product_name == productName){
            price = products[i].price;
        }
    }
    return price;
}

function updateReceipt(productName){
    var price = 0;
    for(let i in products){
        if(products[i].product_name == productName){
            price = products[i].price;
        }
    }
    var receiptString = productName + "..." + price;
    return receiptString;
}

module.exports = {
    priceFromName: priceFromName,
    updateReceipt: updateReceipt
}