const { GoogleSpreadsheet } = require("google-spreadsheet");
const schedule = require("node-schedule");
const config = require('../config.json');

let reminderPromptsSheet;
let bookingConfirmationsSheet;

let sayings = {
    reminderPrompts: [],
    bookingConfirmations: []
};

const fallbackReminderPrompt = "Reminder to book your time in Troi.";
const fallbackBookingConfirmation = "Your time was booked.";

exports.initGoogleSheets = async () => {
    const doc = new GoogleSpreadsheet(config.GOOGLE_SHEET_TROI_SAYINGS_ID);
    await doc.useApiKey(config.GOOGLE_SHEETS_API_KEY);
    await doc.loadInfo();
    reminderPromptsSheet = doc.sheetsByTitle["reminder_prompt"];
    bookingConfirmationsSheet = doc.sheetsByTitle["booking_confirmation"];
    console.log("Connection to the Google Sheet is initialized");
    schedule.scheduleJob("fetch_sayings", "1 * * * *", () => { // = 1min after each hour
        fetchSayings();
    });
    fetchSayings().then(() => {});
}

const fetchSayings = async () => {
    await fetchSayingsForSheet(reminderPromptsSheet, "reminderPrompts");
    await fetchSayingsForSheet(bookingConfirmationsSheet, "bookingConfirmations");
    console.log("Sayings were fetched");
}

const fetchSayingsForSheet = async (sheet, arrName) => {
    let rawRows = await sheet.getRows();
    rawRows.forEach(rawRow => {
        let data = rawRow._rawData;
        if (data.length < 3) return;
        sayings[arrName].push({ lang: data[0], dramaLevel: data[1], saying: data[2] });
    });
}

const getRandomSaying = (arr, deOk = true, dramaLevel = undefined) => {
    if (!deOk) arr = arr.filter(row => row.lang === "EN"); // support more languages that might be added in the Google Sheet TODO
    if (dramaLevel) arr = arr.filter(row => row.dramaLevel === dramaLevel);
    return arr.length > 0 && arr[Math.floor(Math.random() * arr.length)].saying;
}

exports.getRandomReminderPrompt = (deOk = true, dramaLevel = undefined) => {
    let saying = getRandomSaying(sayings.reminderPrompts, deOk, dramaLevel);
    if (!saying) return fallbackReminderPrompt;
    return saying;
};

exports.getRandomBookingConfirmation = (deOk = true, dramaLevel = undefined) => {
    let saying = getRandomSaying(sayings.bookingConfirmations, deOk, dramaLevel);
    if (!saying) return fallbackBookingConfirmation;
    return saying;
};
