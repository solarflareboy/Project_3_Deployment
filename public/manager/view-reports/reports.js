import { request } from "../../utils/client-requests.js"

const preMessage = document.getElementById("pre-message")
const defaultMessage = preMessage.innerText
const resultsText = document.getElementById("results-text")
const reportSelect = document.getElementById("report-select")

function updateDisplay(type, message) {
    if (type === "notification") {
        preMessage.innerHTML = message
        resultsText.style.display = "none"
        preMessage.style.display = "flex"
    } else if (type === "content") {
        resultsText.innerHTML = message
        preMessage.style.display = "none"
        resultsText.style.display = "flex"
    }
}

let currentReport

function setCurrentReport(reportName) {
    if (currentReport) {
        currentReport.style.display = "none"
    }

    currentReport = document.getElementById(`${reportName}-report-info`)
    currentReport.style.display = "block"
}

setCurrentReport(reportSelect.value)

reportSelect.addEventListener("change", function() {
    setCurrentReport(reportSelect.value)
    updateDisplay("notification", defaultMessage)
})

// Sales Report

const salesReportButton = document.getElementById("sales-report-button")
const salesStartDate = document.getElementById("sales-start-date")
const salesEndDate = document.getElementById("sales-end-date")

salesReportButton.addEventListener("click", async function() {
    const startDate = salesStartDate.value
    const endDate = salesEndDate.value

    if (!startDate || !endDate) {
        updateDisplay("notification", "Please specify a start and end date.")

        return
    }

    const result = await request("/sales-report", [startDate, endDate])

    updateDisplay("content", result)
})

// Excess Report

const excessReportButton = document.getElementById("excess-report-button")
const excessTimestamp = document.getElementById("excess-timestamp")

excessReportButton.addEventListener("click", async function() {
    const timestamp = excessTimestamp.value

    if (!timestamp) {
        updateDisplay("notification", "Please specify a timestamp.")

        return
    }

    // TODO: Excess Report
    const result = await request("/excess-report", {
        startDate: timestamp
    })

    updateDisplay("content", result)
})

// Restock Report

const restockReportButton = document.getElementById("restock-report-button")

restockReportButton.addEventListener("click", async function() {
    const result = await request("/restock-report")

    updateDisplay("content", result)
})

// Sells Together Report

const togetherReportButton = document.getElementById("together-report-button")
const togetherStartDate = document.getElementById("together-start-date")
const togetherEndDate = document.getElementById("together-end-date")

togetherReportButton.addEventListener("click", async function() {
    const startDate = togetherStartDate.value
    const endDate = togetherEndDate.value

    if (!startDate || !endDate) {
        updateDisplay("notification", "Please specify a start and end date.")

        return
    }

    // TODO: Sells Together Report

    const result = "SELLS_TOGETHER_REPORT_PLACEHOLDER"

    updateDisplay("content", result)
})