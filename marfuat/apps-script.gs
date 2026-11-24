/**
 * محاضرة المرفوعات — استقبال إجابات الطلاب في جدول Google
 * الصق هذا الملف في: الجدول ← الإضافات ← Apps Script، ثم انشره تطبيق ويب.
 */
const SHEET = 'responses';

function sheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let s = ss.getSheetByName(SHEET);
  if (!s) {
    s = ss.insertSheet(SHEET);
    s.appendRow(['id', 'lecture', 'name', 'ts', 'answers']);
  }
  return s;
}

function out_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const r = JSON.parse(e.postData.contents);
    if (!r.id || !r.name) return out_({ ok: false });
    const s = sheet_();
    const row = [
      String(r.id).slice(0, 40),
      String(r.lecture || '').slice(0, 40),
      String(r.name).slice(0, 60),
      Number(r.ts) || Date.now(),
      JSON.stringify(r.ans || {}).slice(0, 5000)
    ];
    const last = s.getLastRow();
    const ids = last > 1 ? s.getRange(2, 1, last - 1, 1).getValues().map(x => x[0]) : [];
    const i = ids.indexOf(row[0]);
    if (i >= 0) s.getRange(i + 2, 1, 1, 5).setValues([row]);
    else s.appendRow(row);
    return out_({ ok: true });
  } finally {
    lock.releaseLock();
  }
}

function doGet(e) {
  const lecture = (e && e.parameter && e.parameter.lecture) || '';
  const s = sheet_();
  const last = s.getLastRow();
  if (last < 2) return out_([]);
  const rows = s.getRange(2, 1, last - 1, 5).getValues();
  return out_(rows
    .filter(x => !lecture || x[1] === lecture)
    .map(x => ({ id: x[0], name: x[2], ts: Number(x[3]), ans: JSON.parse(x[4] || '{}') })));
}
