const express = require("express")
const app = express()
const port = 8000 | process.env.PORT

// The routing for URLs is done here
app.use("/", express.static("./public/homepage"))
app.use("/cashier", express.static("./public/cashier"))
app.use("/manager", express.static("./public/manager"))

// This allows other subfolders such as "media" to be shared
app.use(express.static("./public"))

// Starting the server
app.listen(port, () => {
    console.log(`The server has started on port ${port}.`)
})
