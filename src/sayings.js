const { GoogleSpreadsheet } = require("google-spreadsheet");
const config = require('../config.json');

let reminderPromptsSheet;
let bookingConfirmationsSheet;

exports.initGoogleSheets = async () => {
    const doc = new GoogleSpreadsheet(config.GOOGLE_SHEET_TROI_SAYINGS_ID);
    await doc.useApiKey(config.GOOGLE_SHEETS_API_KEY);
    await doc.loadInfo();
    reminderPromptsSheet = doc.sheetsByTitle["reminder_prompt"];
    bookingConfirmationsSheet = doc.sheetsByTitle["booking_confirmation"];
    console.log("Connection to the Google Sheet is initialized");
}

const getRandomSaying = async (sheet, deOk = true, dramaLevel = undefined) => {
    let rows = [];
    let rawRows = await sheet.getRows();
    rawRows.forEach(rawRow => {
        let data = rawRow._rawData;
        if (data.length < 3) return;
        rows.push({ lang: data[0], dramaLevel: data[1], saying: data[2] })
    });
    if (!deOk) rows = rows.filter(row => row.lang === "EN"); // support more languages that might be added in the Google Sheet TODO
    if (dramaLevel) rows = rows.filter(row => row.dramaLevel === dramaLevel);
    return rows.length > 0 && rows[Math.floor(Math.random() * rows.length)].saying;
}

exports.getRandomReminderPrompt = async (deOk = true, dramaLevel = undefined) => {
    return getRandomSaying(reminderPromptsSheet, deOk, dramaLevel);
};

exports.getRandomBookingConfirmation = async (deOk = true, dramaLevel = undefined) => {
    return getRandomSaying(bookingConfirmationsSheet, deOk, dramaLevel);
};
