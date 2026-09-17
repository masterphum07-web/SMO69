/**
 * =========================================================================
 * ระบบเช็คชื่อสโมสรนักศึกษาปี 69
 * วิทยาลัยเทคโนโลยีทางการแพทย์และสาธารณสุข กาญจนาภิเษก (วทก.)
 * Backend: Google Apps Script Web App API (Code.gs)
 * =========================================================================
 */

// ชื่อแท็บทั้งหมดในระบบ
const SHEETS = {
  BRANCHES: 'Branches',
  STUDENTS: 'Students',
  SESSIONS: 'Sessions',
  ATTENDANCE: 'Attendance',
  ADMINS: 'Admins',
  DASHBOARD_SUMMARY: 'Dashboard_Summary'
};

/**
 * ฟังก์ชันเลือกหรือสร้างชีตตามชื่อ (บังคับต้องมีตามสเปก)
 * @param {string} sheetName - ชื่อชีตที่ต้องการเข้าถึง
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function setSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * ฟังก์ชันสร้างฐานข้อมูลและตารางเริ่มต้นอัตโนมัติ (รันครั้งเดียวใน Apps Script)
 * บรรจุรายชื่อสโมสรนักศึกษาปี 2569 ครบทั้ง 6 สาขาวิชา รวม 53 คน (ไม่มี student_id ใช้ชื่อ-สกุลจริง)
 */
function setupInitialDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ชีต Branches (6 สาขาวิชา)
  const bSheet = setSheet(SHEETS.BRANCHES);
  if (bSheet.getLastRow() === 0) {
    bSheet.appendRow(['branch_id', 'branch_name', 'color_hex']);
    const branchList = [
      ['RT', 'รังสีเทคนิค', '#2563EB'],
      ['HCI', 'นวัตกรรมสื่อสารสุขภาพ', '#8B5CF6'],
      ['PMD', 'ฉุกเฉินการแพทย์', '#EF4444'],
      ['BSC', 'วท.บ.เวชระเบียน', '#06B6D4'],
      ['TTM', 'การแพทย์แผนไทย', '#10B981'],
      ['DIP', 'ปวส.เวชระเบียน', '#F59E0B']
    ];
    branchList.forEach(row => bSheet.appendRow(row));
    formatHeaderRow(bSheet, '#1E3A8A');
  }

  // 2. ชีต Students (53 คน)
  const sSheet = setSheet(SHEETS.STUDENTS);
  if (sSheet.getLastRow() === 0) {
    bSheet.setFrozenRows(1);
    sSheet.appendRow(['full_name', 'branch_id', 'position']);
    const realStudents = [
      ['นางสาวภัทรวรินทร์ เกษมสุข', 'RT', 'นายก'],
      ['นางสาวประภัสสร วงษ์กำภู', 'RT', 'ฝ่ายเลขานุการ (เฮด)'],
      ['นายบดินทร์ การุณเวทย์', 'RT', 'ฝ่ายเหรัญญิก'],
      ['นายภูมิภัทร สว่างเวียง', 'RT', 'ฝ่ายวิชาการ'],
      ['นางสาวดอกรัก อิสระอังกูร', 'RT', 'ฝ่ายประสานงาน (เฮด)'],
      ['นางสาวอัญญานี อาสะหนิ', 'RT', 'ฝ่ายประชาสัมพันธ์'],
      ['นางสาวพิมพ์พันธุ์ กล่องทอง', 'RT', 'ฝ่ายกิจกรรม (เฮด)'],
      ['นายศรัณย์ อินทรีย์', 'RT', 'ฝ่ายโสต'],
      ['นางสาวจินตนา ศรีเริ่มสกุล', 'RT', 'ฝ่ายสถานที่ (เฮด)'],
      ['นางสาวจุฑามณี สมบัติ', 'HCI', 'อุปนายก'],
      ['นางสาวณัจมีย์ ปูเตะ', 'HCI', 'ฝ่ายประชาสัมพันธ์'],
      ['นางสาวปิญชาน อุดมโภชน์', 'HCI', 'ฝ่ายเลขานุการ'],
      ['นายคิมภกรณ์ ไชยขันธุ์', 'HCI', 'ฝ่ายโสต'],
      ['นางสาวกุลนิษฐ์ ประดิษฐ์ธรรม', 'HCI', 'ฝ่ายเฮดวิชาการ'],
      ['นางสาวอนัญญา ปานหงษ์', 'HCI', 'ฝ่ายประสานงาน'],
      ['นางสาวปาลิดา โลกาวัฒนะ', 'HCI', 'ฝ่ายเฮดฝ่ายทะเบียน'],
      ['นางสาวแวตัสนีม แวหะมุ', 'HCI', 'ฝ่ายสวัสดิการ'],
      ['นางสาวพัทรวรรณ คำภิโล', 'HCI', 'ฝ่ายกีฬา'],
      ['นายอนุชา รักบูรณ์', 'HCI', 'ฝ่ายเหรัญญิก'],
      ['นายธนโชติ พันธุ์ลำเจียก', 'PMD', 'ฝ่ายอุปนายก'],
      ['นายแทนไท พรมชาติ', 'PMD', 'ฝ่ายเลขานุการ'],
      ['นางสาวจิรภา แดงสังวาลย์', 'PMD', 'ฝ่ายเหรัญญิก'],
      ['นางสาวสุภัสสรา ธรรมจิตติ', 'PMD', 'ฝ่ายวิชาการ'],
      ['นางสาวธนพร ตรีโอษฐ์', 'PMD', 'ฝ่ายประสานงาน'],
      ['นางสาวณัฐนิชา ครุฑวิชิต', 'PMD', 'ฝ่ายประชาสัมพันธ์ (เฮด)'],
      ['นางสาวณัฐกมล สีชมภู', 'PMD', 'ฝ่านอาคารและสถานที่'],
      ['นางสาวธันณธรณ์ จวงจันทร์', 'PMD', 'ฝ่ายกีฬา (เฮด)'],
      ['นางสาวสุพาณี ผมเหมาะ', 'PMD', 'ฝ่ายสวัสดิการ'],
      ['นายณัฐเศรษฐ ใจสุข', 'PMD', 'ฝ่ายโสต (เฮด)'],
      ['นางสาวหทัยรัตน์ ชูรักษ์', 'PMD', 'ฝ่ายประสานงาน'],
      ['นางสาวชนันภรณ์ เผือกผุด', 'BSC', 'อุปนายก'],
      ['ลาภวัต มหาวงศ์', 'BSC', 'ฝ่ายเลขานุการ'],
      ['นางสาวฤทัยชนก วัตนานุสิทธิ์', 'BSC', 'ฝ่ายกิจกรรม'],
      ['นางสาวศิริยาพร บุญมี', 'BSC', 'ฝ่ายประสานงาน'],
      ['นางสาวเกวลิน ฤาชา', 'BSC', 'ฝ่ายเหรัญญิก (เฮด)'],
      ['นางสาวบุษรากร ชูคันหอม', 'BSC', 'ฝ่ายสวัสดิการ'],
      ['นางสาวณัฐฐา ตราโต', 'BSC', 'ฝ่ายสวัสดิการ'],
      ['นางสาวชุติกาญจน์ ละกะเต็บ', 'BSC', 'ฝ่ายวิชาการ'],
      ['นายพิทักษ์พงศ์ สาหินกอง', 'BSC', 'ฝ่ายประชาสัมพันธ์'],
      ['นายคุณากร ชุมพล', 'BSC', 'ฝ่ายโสต'],
      ['นายธนพันธุ์ จะปะการ', 'BSC', 'ฝ่ายโสต'],
      ['นายกรวิชญ์ เวฬุวนารักษ์', 'TTM', 'อุปนายก'],
      ['นายมหรรณพ มัฆมาน', 'TTM', 'ฝ่ายเลขานุการ'],
      ['นางสาวศุภิสรา สุขสมบูรณ์', 'TTM', 'ฝ่ายพหุวัฒนธรรม (เฮด)'],
      ['นางสาวอินทุอร พึ่งบุญ ณ อยุธยา', 'TTM', 'ฝ่ายสวัสดิการ'],
      ['นางสาวอาลียา กาซอ', 'TTM', 'ฝ่ายกิจกรรม'],
      ['นางสาวบุษย์ ช่วยเกิด', 'TTM', 'ฝ่ายเหรัญญิก'],
      ['นายพงศ์ดนัย ราษดี', 'TTM', 'ฝ่ายประชาสัมพันธ์'],
      ['นายตุลวัฒน์ สุวรรณวงศ์', 'TTM', 'ฝ่ายวิชาการ'],
      ['นางสาวสุภารัตน์ คงมั่น', 'TTM', 'ฝ่ายพหุวัฒนธรรม'],
      ['นายยศกร สุภัคจารุสิทธิ์', 'TTM', 'ฝ่ายประสานงาน'],
      ['นางสาวจุฑามาศ องอาจ', 'DIP', 'อุปนายก'],
      ['นางสาวภาณุมาศ บุญนวน', 'DIP', 'สันทนาการ']
    ];
    realStudents.forEach(row => sSheet.appendRow(row));
    formatHeaderRow(sSheet, '#1E3A8A');
  }

  // 3. ชีต Sessions
  const sessSheet = setSheet(SHEETS.SESSIONS);
  if (sessSheet.getLastRow() === 0) {
    sessSheet.appendRow(['session_id', 'session_title', 'session_date', 'branch_scope', 'status', 'created_by', 'created_at']);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    sessSheet.appendRow(['SESS-20260901-01', 'ปฐมนิเทศสโมสรนักศึกษาปี 69', '2026-09-01', 'ALL', 'submitted', 'admin01', nowStr]);
    formatHeaderRow(sessSheet, '#1E3A8A');
  }

  // 4. ชีต Attendance
  const attSheet = setSheet(SHEETS.ATTENDANCE);
  if (attSheet.getLastRow() === 0) {
    attSheet.appendRow(['session_id', 'full_name', 'status', 'checked_by', 'timestamp']);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    // เช็คชื่อตัวอย่าง 10 คนแรก
    for (let i = 0; i < Math.min(10, realStudents.length); i++) {
      attSheet.appendRow(['SESS-20260901-01', realStudents[i][0], 'มา', 'admin01', nowStr]);
    }
    formatHeaderRow(attSheet, '#1E3A8A');
  }

  // 5. ชีต Admins
  const admSheet = setSheet(SHEETS.ADMINS);
  if (admSheet.getLastRow() === 0) {
    admSheet.appendRow(['admin_id', 'pin', 'role', 'name']);
    admSheet.appendRow(['admin01', '1234', 'admin', 'แอดมินสโมสร']);
    admSheet.appendRow(['checker01', '1234', 'checker', 'ผู้เช็คชื่อประจำวัน']);
    formatHeaderRow(admSheet, '#1E3A8A');
  }

  // 6. ชีต Dashboard_Summary
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  if (dashSheet.getLastRow() === 0) {
    dashSheet.appendRow([
      'full_name',
      'branch_id',
      'position',
      'present_count',
      'late_count',
      'excused_count',
      'absent_count',
      'total_sessions',
      'attendance_rate_pct'
    ]);
    formatHeaderRow(dashSheet, '#1E3A8A');
  }

  // อัปเดต Summary รอบแรก
  updateDashboardSummary();

  Logger.log('Setup Initial Database Completed Successfully with 53 students (No student_id)!');
}

function formatHeaderRow(sheet, bgColor) {
  const range = sheet.getRange(1, 1, 1, sheet.getLastColumn());
  range.setBackground(bgColor);
  range.setFontColor('#FFFFFF');
  range.setFontWeight('bold');
  sheet.setFrozenRows(1);
}

/**
 * =========================================================================
 * HTTP GET Router
 * =========================================================================
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : '';
    let result = { success: false, message: 'Action not specified' };

    switch (action) {
      case 'ping':
        result = { success: true, message: 'SMO69 Attendance API is online', timestamp: new Date().toISOString() };
        break;

      case 'getBranches':
        result = { success: true, data: getBranchesData() };
        break;

      case 'getStudents':
        result = { success: true, data: getStudentsData(e.parameter.branch) };
        break;

      case 'getSessions':
        result = { success: true, data: getSessionsData() };
        break;

      case 'getSessionAttendance':
        result = { success: true, data: getSessionAttendanceData(e.parameter.sessionId) };
        break;

      case 'getLeaderboard':
        result = { success: true, data: getLeaderboard() };
        break;

      case 'getDashboard':
        result = { success: true, data: getDashboard(e.parameter.branch) };
        break;

      case 'getInitialData':
        result = {
          success: true,
          data: {
            branches: getBranchesData(),
            students: getStudentsData(),
            sessions: getSessionsData(),
            leaderboard: getLeaderboard(),
            dashboard: getDashboard()
          }
        };
        break;

      default:
        result = { success: false, error: 'Unknown GET action: ' + action };
    }

    return createJsonResponse(result, e);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, e);
  }
}

/**
 * =========================================================================
 * HTTP POST Router
 * =========================================================================
 */
function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (jsonErr) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action || (e && e.parameter && e.parameter.action);
    let result = { success: false, message: 'Action not specified' };

    switch (action) {
      case 'login':
        result = loginCheck(payload.adminId, payload.pin);
        break;

      case 'createSession':
        result = createSession(payload.title, payload.date, payload.branchScope, payload.adminId);
        break;

      case 'saveAttendanceDraft':
        result = saveAttendanceDraft(payload.sessionId, payload.records, payload.adminId);
        break;

      case 'submitAttendance':
        result = submitAttendance(payload.sessionId, payload.adminId);
        break;

      default:
        result = { success: false, error: 'Unknown POST action: ' + action };
    }

    return createJsonResponse(result, e);
  } catch (err) {
    return createJsonResponse({ success: false, error: err.toString() }, e);
  }
}

function createJsonResponse(data, e) {
  const jsonString = JSON.stringify(data);
  const callback = (e && e.parameter && e.parameter.callback) ? e.parameter.callback : null;

  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + jsonString + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(jsonString)
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * =========================================================================
 * Authentication & Verification
 * =========================================================================
 */
function loginCheck(adminId, pin) {
  if (!adminId || !pin) {
    return { success: false, error: 'กรุณากรอกรหัสผู้ใช้งานและ PIN' };
  }

  const sheet = setSheet(SHEETS.ADMINS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    return { success: false, error: 'ไม่พบรายชื่อแอดมินในระบบ' };
  }

  const header = data[0];
  const idIdx = header.indexOf('admin_id');
  const pinIdx = header.indexOf('pin');
  const roleIdx = header.indexOf('role');
  const nameIdx = header.indexOf('name');

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[idIdx]).trim() === String(adminId).trim() && String(row[pinIdx]).trim() === String(pin).trim()) {
      return {
        success: true,
        user: {
          adminId: String(row[idIdx]).trim(),
          role: String(row[roleIdx] || 'checker').trim(),
          name: nameIdx !== -1 ? String(row[nameIdx]).trim() : String(row[idIdx]).trim()
        }
      };
    }
  }

  return { success: false, error: 'รหัสผู้ใช้งานหรือ PIN ไม่ถูกต้อง' };
}

/**
 * =========================================================================
 * Data Fetching Functions
 * =========================================================================
 */
function getBranchesData() {
  const sheet = setSheet(SHEETS.BRANCHES);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const branches = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      branches.push({
        branch_id: String(row[0]).trim(),
        branch_name: String(row[1]).trim(),
        color_hex: String(row[2] || '#2563EB').trim()
      });
    }
  }
  return branches;
}

function getStudentsData(branchFilter) {
  const sheet = setSheet(SHEETS.STUDENTS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const students = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      const student = {
        full_name: String(row[0]).trim(),
        branch_id: String(row[1]).trim(),
        position: row[2] ? String(row[2]).trim() : ''
      };
      if (!branchFilter || branchFilter === 'ALL' || student.branch_id === branchFilter) {
        students.push(student);
      }
    }
  }
  return students;
}

function getSessionsData() {
  const sheet = setSheet(SHEETS.SESSIONS);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const sessions = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      sessions.push({
        session_id: String(row[0]).trim(),
        session_title: String(row[1]).trim(),
        session_date: row[2] instanceof Date ? Utilities.formatDate(row[2], 'Asia/Bangkok', 'yyyy-MM-dd') : String(row[2]),
        branch_scope: String(row[3]).trim(),
        status: String(row[4]).trim(),
        created_by: String(row[5]).trim(),
        created_at: String(row[6])
      });
    }
  }
  return sessions.reverse();
}

function getSessionAttendanceData(sessionId) {
  if (!sessionId) return [];
  const sheet = setSheet(SHEETS.ATTENDANCE);
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const records = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (String(row[0]).trim() === String(sessionId).trim()) {
      records.push({
        session_id: String(row[0]).trim(),
        full_name: String(row[1]).trim(),
        status: String(row[2]).trim(),
        checked_by: String(row[3]).trim(),
        timestamp: String(row[4])
      });
    }
  }
  return records;
}

/**
 * =========================================================================
 * Core Business Logic
 * =========================================================================
 */
function createSession(title, date, branchScope, adminId) {
  if (!title || !date) {
    return { success: false, error: 'กรุณากรอกชื่อหัวข้อและวันที่' };
  }

  const sheet = setSheet(SHEETS.SESSIONS);
  const timestamp = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyyMMdd-HHmmss');
  const sessionId = 'SESS-' + timestamp;
  const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  const scope = branchScope || 'ALL';
  const creator = adminId || 'admin';

  sheet.appendRow([sessionId, title, date, scope, 'draft', creator, nowStr]);

  return {
    success: true,
    message: 'สร้างองค์ประชุมสำเร็จ',
    session: {
      session_id: sessionId,
      session_title: title,
      session_date: date,
      branch_scope: scope,
      status: 'draft',
      created_by: creator,
      created_at: nowStr
    }
  };
}

function saveAttendanceDraft(sessionId, records, adminId) {
  if (!sessionId || !records || !Array.isArray(records)) {
    return { success: false, error: 'ข้อมูลสำหรับบันทึกไม่ถูกต้อง' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sheet = setSheet(SHEETS.ATTENDANCE);
    const data = sheet.getDataRange().getValues();
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    const checker = adminId || 'admin';

    const existingRowMap = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[0]).trim() === String(sessionId).trim()) {
        const fullName = String(row[1]).trim();
        existingRowMap[fullName] = i + 1;
      }
    }

    const rowsToAppend = [];

    records.forEach(rec => {
      const fullName = String(rec.full_name).trim();
      const status = String(rec.status).trim();
      if (!fullName || !status) return;

      if (existingRowMap[fullName]) {
        const rowNum = existingRowMap[fullName];
        sheet.getRange(rowNum, 3, 1, 3).setValues([[status, checker, nowStr]]);
      } else {
        rowsToAppend.push([sessionId, fullName, status, checker, nowStr]);
      }
    });

    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, 5).setValues(rowsToAppend);
    }

    SpreadsheetApp.flush();
    return { success: true, message: 'บันทึกสถานะเรียบร้อยแล้ว (' + records.length + ' รายการ)' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

function submitAttendance(sessionId, adminId) {
  if (!sessionId) {
    return { success: false, error: 'ไม่พบ Session ID' };
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(15000);

  try {
    const sessSheet = setSheet(SHEETS.SESSIONS);
    const data = sessSheet.getDataRange().getValues();
    let foundRow = -1;

    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(sessionId).trim()) {
        foundRow = i + 1;
        break;
      }
    }

    if (foundRow === -1) {
      return { success: false, error: 'ไม่พบข้อมูลองค์ประชุมนี้ในระบบ' };
    }

    sessSheet.getRange(foundRow, 5).setValue('submitted');
    SpreadsheetApp.flush();

    updateDashboardSummary();

    return { success: true, message: 'ยืนยันและปิดรอบการเช็คชื่อเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

function updateDashboardSummary() {
  const students = getStudentsData();
  const attSheet = setSheet(SHEETS.ATTENDANCE);
  const sessSheet = setSheet(SHEETS.SESSIONS);

  const attData = attSheet.getDataRange().getValues();
  const sessData = sessSheet.getDataRange().getValues();

  const validSessionIds = new Set();
  for (let i = 1; i < sessData.length; i++) {
    if (sessData[i][0] && sessData[i][4] === 'submitted') {
      validSessionIds.add(String(sessData[i][0]).trim());
    }
  }

  const statsMap = {};
  students.forEach(st => {
    statsMap[st.full_name] = {
      full_name: st.full_name,
      branch_id: st.branch_id,
      position: st.position || '',
      present: 0,
      late: 0,
      excused: 0,
      absent: 0,
      total: 0
    };
  });

  for (let i = 1; i < attData.length; i++) {
    const row = attData[i];
    const sId = String(row[0]).trim();
    const fullName = String(row[1]).trim();
    const status = String(row[2]).trim();

    if (statsMap[fullName]) {
      statsMap[fullName].total++;
      if (status === 'มา') statsMap[fullName].present++;
      else if (status === 'สาย') statsMap[fullName].late++;
      else if (status === 'ลา') statsMap[fullName].excused++;
      else if (status === 'ขาด') statsMap[fullName].absent++;
    }
  }

  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  const rows = [];

  students.forEach(st => {
    const s = statsMap[st.full_name];
    const totalCount = s.present + s.late + s.excused + s.absent;
    const attendedCount = s.present + (s.late * 0.75);
    const rate = totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(1) + '%' : '0%';

    rows.push([
      s.full_name,
      s.branch_id,
      s.position,
      s.present,
      s.late,
      s.excused,
      s.absent,
      totalCount,
      rate
    ]);
  });

  if (dashSheet.getLastRow() > 1) {
    dashSheet.getRange(2, 1, dashSheet.getLastRow() - 1, dashSheet.getLastColumn()).clearContent();
  }

  if (rows.length > 0) {
    dashSheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }

  SpreadsheetApp.flush();
}

function getLeaderboard() {
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  const data = dashSheet.getDataRange().getValues();
  if (data.length <= 1) {
    updateDashboardSummary();
    return getLeaderboard();
  }

  const students = [];
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[0]) {
      students.push({
        full_name: String(row[0]).trim(),
        branch_id: String(row[1]).trim(),
        position: String(row[2] || '').trim(),
        present: Number(row[3]) || 0,
        late: Number(row[4]) || 0,
        excused: Number(row[5]) || 0,
        absent: Number(row[6]) || 0,
        total: Number(row[7]) || 0,
        rate: String(row[8] || '0%')
      });
    }
  }

  const topPresent = [...students].sort((a, b) => (b.present + b.late) - (a.present + a.late)).slice(0, 5);
  const topAbsent = [...students].sort((a, b) => b.absent - a.absent).slice(0, 5);

  return {
    topPresent: topPresent,
    topAbsent: topAbsent,
    totalStudents: students.length
  };
}

function getDashboard(filterBranch) {
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  const data = dashSheet.getDataRange().getValues();
  if (data.length <= 1) {
    updateDashboardSummary();
  }

  const freshData = dashSheet.getDataRange().getValues();
  const list = [];
  let totalPresent = 0;
  let totalLate = 0;
  let totalExcused = 0;
  let totalAbsent = 0;

  for (let i = 1; i < freshData.length; i++) {
    const row = freshData[i];
    if (row[0]) {
      const branchId = String(row[1]).trim();
      if (!filterBranch || filterBranch === 'ALL' || branchId === filterBranch) {
        const p = Number(row[3]) || 0;
        const l = Number(row[4]) || 0;
        const e = Number(row[5]) || 0;
        const a = Number(row[6]) || 0;
        totalPresent += p;
        totalLate += l;
        totalExcused += e;
        totalAbsent += a;

        list.push({
          full_name: String(row[0]).trim(),
          branch_id: branchId,
          position: String(row[2] || '').trim(),
          present: p,
          late: l,
          excused: e,
          absent: a,
          total: Number(row[7]) || 0,
          rate: String(row[8] || '0%')
        });
      }
    }
  }

  return {
    summary: {
      totalPresent: totalPresent,
      totalLate: totalLate,
      totalExcused: totalExcused,
      totalAbsent: totalAbsent,
      totalRecords: list.length
    },
    students: list
  };
}
