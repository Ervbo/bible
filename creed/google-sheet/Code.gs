/**
 * The Apostles' Creed, Examined - response collector.
 * Paste this into Extensions > Apps Script in your Google Sheet,
 * then Deploy > New deployment > Web app (Execute as: Me, Who has access: Anyone).
 * Each "Send to Erv" from the app adds one row to the "Responses" tab.
 */
var SHEET_NAME = 'Responses';
var ITEM_COUNT = 59;
var ARTICLE_COUNT = 12;

function headers_() {
  var h = ['Timestamp', 'Name', 'Email', 'Note', 'Survey', 'Essentials %', 'Affirmed', 'Of',
           'Worth exploring', 'Differs', 'Differs (statement #)', 'Worth exploring (statement #)'];
  for (var a = 1; a <= ARTICLE_COUNT; a++) h.push('Article ' + a + ' %');
  for (var q = 1; q <= ITEM_COUNT; q++) h.push('Q' + q);
  h.push('Page');
  return h;
}

function sheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) {
    var h = headers_();
    sh.getRange(1, 1, 1, h.length).setValues([h]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

// Keeps text from being treated as a spreadsheet formula and limits length.
function clean_(v, max) {
  if (v === null || v === undefined) return '';
  var s = String(v).slice(0, max || 500);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}
function num_(v, lo, hi) {
  var n = Number(v);
  return isFinite(n) && n >= lo && n <= hi ? n : '';
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var d = JSON.parse(e.postData.contents);
    var row = [new Date(), clean_(d.name, 80), clean_(d.email, 120), clean_(d.note, 1000),
      clean_(d.mode, 40), num_(d.pct, 0, 100), num_(d.affirmed, 0, 99), num_(d.total, 0, 99),
      num_(d.exploring, 0, 99), num_(d.differs, 0, 99), clean_(d.flagged, 300), clean_(d.unsure, 300)];
    var arts = d.articles || {}, ans = d.answers || {};
    for (var a = 1; a <= ARTICLE_COUNT; a++) row.push(num_(arts[a], 0, 100));
    for (var q = 1; q <= ITEM_COUNT; q++) row.push(num_(ans[q], 1, 5));
    row.push(clean_(d.page, 200));
    sheet_().appendRow(row);
    return ContentService.createTextOutput('ok');
  } catch (err) {
    return ContentService.createTextOutput('error');
  } finally {
    lock.releaseLock();
  }
}

// Visiting the web app URL in a browser shows this, which confirms the deployment works.
function doGet() {
  sheet_();
  return ContentService.createTextOutput("The Apostles' Creed, Examined: response collector is running.");
}
