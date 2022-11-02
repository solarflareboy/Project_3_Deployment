const express = require("express")
const app = express()
const port = 8000 | process.env.PORT

app.use("/", express.static("./public/homepage"))
app.use("/cashier", express.static("./public/cashier"))
app.use("/manager", express.static("./public/manager"))

app.listen(port, () => {
    console.log(`The server has started on port ${port}.`)
})
