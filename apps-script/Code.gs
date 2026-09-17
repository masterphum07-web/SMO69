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
  DASHBOARD_SUMMARY: 'Dashboard_Summary',
  SESSION_REPORT: 'บันทึกผลการเช็คชื่อ'
};

/**
 * =========================================================================
 * 🚀 ฟังก์ชันหลักสำหรับกดปุ่ม "เรียกใช้ (Run)":
 * 1. ใน Google Apps Script ให้เลือกฟังก์ชัน "createReportSheetNow" ในเมนู Dropdown ด้านบน
 * 2. กดปุ่ม "เรียกใช้ (Run)"
 * 3. ระบบจะสร้างแท็บ "บันทึกผลการเช็คชื่อ" พร้อมรายชื่อ 53 คน และสีไฮไลต์อย่างเป็นทางการทันที!
 * =========================================================================
 */
function createReportSheetNow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('ไม่พบ Google Spreadsheet กรุณาเปิด Apps Script จากเมนู "ส่วนขยาย (Extensions)" > "Apps Script" ภายใน Google Sheet');
  }

  // 1. ตรวจสอบ/เตรียมชีต Branches (6 สาขา)
  const bSheet = ss.getSheetByName(SHEETS.BRANCHES);
  if (!bSheet || bSheet.getLastRow() <= 1) {
    updateBranchesOnly();
  }

  // 2. ตรวจสอบ/เตรียมชีต Students (53 คน)
  const sSheet = ss.getSheetByName(SHEETS.STUDENTS);
  if (!sSheet || sSheet.getLastRow() <= 1) {
    updateStudentsOnly();
  }

  // 3. ตรวจสอบชีต Sessions
  const sessSheet = setSheet(SHEETS.SESSIONS);
  if (sessSheet.getLastRow() === 0) {
    sessSheet.appendRow(['session_id', 'session_title', 'session_date', 'branch_scope', 'status', 'created_by', 'created_at']);
    formatHeaderRow(sessSheet, '#0F2F57');
  }

  // 4. ตรวจสอบชีต Attendance
  const attSheet = setSheet(SHEETS.ATTENDANCE);
  if (attSheet.getLastRow() === 0) {
    attSheet.appendRow(['session_id', 'full_name', 'status', 'checked_by', 'timestamp']);
    formatHeaderRow(attSheet, '#0F2F57');
  }

  // 5. สร้างหรืออัปเดตแท็บแยกให้ครบทุกวาระองค์ประชุม และอัปเดตแท็บสรุปล่าสุด
  if (sessSheet.getLastRow() > 1) {
    generateAllSessionsReports();
    generateLatestSessionReport();
  } else {
    setupSessionReportTemplate();
  }

  // สลับหน้าจอมาที่แท็บรายงานผลล่าสุด
  const reportSheet = ss.getSheetByName(SHEETS.SESSION_REPORT);
  if (reportSheet) {
    try {
      ss.setActiveSheet(reportSheet);
    } catch (e) {}
  }

  try {
    ss.toast('✅ สร้างแท็บแยกให้ครบทุกวาระองค์ประชุม และอัปเดตแท็บรายงานผลเรียบร้อยแล้ว!', 'SMO 69 ระบบเช็คชื่อ', 8);
  } catch (e) {}

  Logger.log('===========================================================');
  Logger.log('✅ สร้างแท็บแยกให้ครบทุกวาระองค์ประชุม และอัปเดตแท็บรายงานผลสำเร็จ!');
  Logger.log('👉 กลับไปดูที่หน้า Google Sheets จะเห็นแท็บแยกของแต่ละวาระทันที');
  Logger.log('===========================================================');

  return 'SUCCESS';
}

/**
 * ฟังก์ชันภาษาไทย สำรองไว้สำหรับผู้ที่สะดวกเลือกเมนูภาษาไทยใน Apps Script
 */
function สร้างแท็บบันทึกผลการเช็คชื่อ() {
  return createReportSheetNow();
}

/**
 * ฟังก์ชันเลือกหรือสร้างชีตตามชื่อ (ปลอดภัย: หากไม่ระบุชื่อจะสร้างแท็บบันทึกผลทันที)
 * @param {string} sheetName - ชื่อชีตที่ต้องการเข้าถึง
 * @returns {GoogleAppsScript.Spreadsheet.Sheet}
 */
function setSheet(sheetName) {
  if (!sheetName || typeof sheetName !== 'string') {
    sheetName = SHEETS.SESSION_REPORT;
  }
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error('ไม่พบ Google Spreadsheet กรุณาเปิด Apps Script จากเมนู "ส่วนขยาย" > "Apps Script" ภายใน Google Sheet');
  }
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

/**
 * ⚡ ฟังก์ชันพิเศษ: อัปเดตเฉพาะชีต Branches ให้เป็นรหัสใหม่ (RT, HCI, PMD, BSC, TTM, DIP) ทันที
 */
function updateBranchesOnly() {
  const bSheet = setSheet(SHEETS.BRANCHES);
  bSheet.clear(); // ล้างของเก่าทิ้งเพื่อใส่คำย่อใหม่
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
  Logger.log('✅ อัปเดตชีต Branches เรียบร้อย: RT, HCI, PMD, BSC, TTM, DIP');
}

/**
 * ⚡ ฟังก์ชันพิเศษ: อัปเดตเฉพาะชีต Students 53 คน (ลบ student_id และใช้รหัสสาขาใหม่)
 */
function updateStudentsOnly() {
  const sSheet = setSheet(SHEETS.STUDENTS);
  sSheet.clear(); // ล้างข้อมูลเก่า
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
  Logger.log('✅ อัปเดตชีต Students 53 คน เรียบร้อย (ไม่มี student_id)');
  return realStudents;
}

/**
 * ฟังก์ชันสร้างฐานข้อมูลและตารางเริ่มต้นอัตโนมัติ (รันครั้งเดียวหรือรันเพื่อรีเซ็ต)
 * บรรจุรายชื่อสโมสรนักศึกษาปี 2569 ครบทั้ง 6 สาขาวิชา รวม 53 คน (ไม่มี student_id ใช้ชื่อ-สกุลจริง)
 */
function setupInitialDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ชีต Branches (6 สาขาวิชา)
  updateBranchesOnly();

  // 2. ชีต Students (53 คน)
  const realStudents = updateStudentsOnly();

  // 3. ชีต Sessions (ตารางว่างพร้อมบันทึกของจริง ไม่มีข้อมูลจำลอง)
  const sessSheet = setSheet(SHEETS.SESSIONS);
  if (sessSheet.getLastRow() === 0) {
    sessSheet.appendRow(['session_id', 'session_title', 'session_date', 'branch_scope', 'status', 'created_by', 'created_at']);
    formatHeaderRow(sessSheet, '#0F2F57');
  }

  // 4. ชีต Attendance (ตารางว่างพร้อมบันทึกของจริง ไม่มีข้อมูลจำลอง)
  const attSheet = setSheet(SHEETS.ATTENDANCE);
  if (attSheet.getLastRow() === 0) {
    attSheet.appendRow(['session_id', 'full_name', 'status', 'checked_by', 'timestamp']);
    formatHeaderRow(attSheet, '#0F2F57');
  }

  // 5. ชีต Admins
  const admSheet = setSheet(SHEETS.ADMINS);
  if (admSheet.getLastRow() === 0) {
    admSheet.appendRow(['admin_id', 'pin', 'role', 'name']);
    admSheet.appendRow(['admin01', '1234', 'admin', 'แอดมินสโมสร']);
    admSheet.appendRow(['checker01', '1234', 'checker', 'ผู้เช็คชื่อประจำวัน']);
    formatHeaderRow(admSheet, '#0F2F57');
  }

  // 6. ชีต Dashboard_Summary
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  dashSheet.clear();
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
  formatHeaderRow(dashSheet, '#0F2F57');

  // 7. ชีต บันทึกผลการเช็คชื่อ (หน้าสำหรับบันทึกหลังจากเช็คเสร็จ พร้อมหัวข้อและไฮไลต์สี)
  setupSessionReportTemplate();

  // อัปเดต Summary รอบแรก
  updateDashboardSummary();

  Logger.log('Setup Initial Database Completed Successfully with 53 students (Clean: No sample data)!');
}

/**
 * ⚡ ฟังก์ชันพิเศษ: ล้างข้อมูลจำลององค์ประชุมและประวัติการเช็คชื่อตัวอย่างทั้งหมดในชีตจริง
 * เหลือเฉพาะหัวตาราง เพื่อให้ระบบพร้อมใช้งานจริงแบบคลีน 100%
 */
function clearAllSampleData() {
  const sessSheet = setSheet(SHEETS.SESSIONS);
  sessSheet.clear();
  sessSheet.appendRow(['session_id', 'session_title', 'session_date', 'branch_scope', 'status', 'created_by', 'created_at']);
  formatHeaderRow(sessSheet, '#0F2F57');

  const attSheet = setSheet(SHEETS.ATTENDANCE);
  attSheet.clear();
  attSheet.appendRow(['session_id', 'full_name', 'status', 'checked_by', 'timestamp']);
  formatHeaderRow(attSheet, '#0F2F57');

  updateDashboardSummary();
  setupSessionReportTemplate();
  Logger.log('✅ ลบข้อมูลจำลองทั้งหมดใน Google Sheet เรียบร้อยแล้ว!');
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

    if (!action) {
      // หากกดปุ่ม "เรียกใช้ (Run)" บนฟังก์ชัน doGet โดดๆ หรือเปิด URL ตรงๆ ให้สร้างแท็บรายงานผลทันที
      try {
        createReportSheetNow();
        result = {
          success: true,
          message: 'SMO69 Attendance API is online & สร้างแท็บ "บันทึกผลการเช็คชื่อ" เรียบร้อยแล้ว'
        };
      } catch (ex) {
        result = { success: true, message: 'SMO69 Attendance API is online', note: ex.toString() };
      }
      return createJsonResponse(result, e);
    }

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

      case 'generateReport':
        result = generateSessionReport(e.parameter.sessionId);
        break;

      case 'generateAllReports':
        result = generateAllSessionsReports();
        break;

      case 'createSession':
        result = createSession(e.parameter.title, e.parameter.date, e.parameter.branchScope, e.parameter.adminId);
        break;

      case 'saveAttendanceDraft':
        let draftRecords = [];
        try {
          draftRecords = typeof e.parameter.records === 'string' ? JSON.parse(e.parameter.records) : (e.parameter.records || []);
        } catch (jsonErr) {
          draftRecords = [];
        }
        result = saveAttendanceDraft(e.parameter.sessionId, draftRecords, e.parameter.adminId);
        break;

      case 'submitAttendance':
        result = submitAttendance(e.parameter.sessionId, e.parameter.adminId);
        break;

      case 'login':
        result = loginCheck(e.parameter.adminId, e.parameter.pin);
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

  // สร้างแท็บเฉพาะสำหรับวาระนี้ใน Google Sheet ทันที พร้อมรายชื่อ 53 คน
  try {
    generateSessionReport(sessionId);
  } catch (repErr) {
    Logger.log('Warning generating session report in createSession: ' + repErr.toString());
  }

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
      const status = String(rec.status).trim() || 'ยังไม่เช็ค';
      if (!fullName) return;

      const recordTime = (status === 'ยังไม่เช็ค') ? '-' : nowStr;

      if (existingRowMap[fullName]) {
        const rowNum = existingRowMap[fullName];
        sheet.getRange(rowNum, 3, 1, 3).setValues([[status, checker, recordTime]]);
      } else {
        rowsToAppend.push([sessionId, fullName, status, checker, recordTime]);
      }
    });

    if (rowsToAppend.length > 0) {
      const startRow = sheet.getLastRow() + 1;
      sheet.getRange(startRow, 1, rowsToAppend.length, 5).setValues(rowsToAppend);
    }

    SpreadsheetApp.flush();
    try {
      generateSessionReport(sessionId);
    } catch (repErr) {
      Logger.log('Warning generating draft report: ' + repErr.toString());
    }

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

    // ⚡ สร้างแท็บบันทึกรายงานผลการเช็คชื่อ พร้อมหัวข้อและไฮไลต์สี
    try {
      generateSessionReport(sessionId);
    } catch (repErr) {
      Logger.log('Warning generating session report: ' + repErr.toString());
    }

    return { success: true, message: 'ยืนยันและปิดรอบการเช็คชื่อเรียบร้อยแล้ว พร้อมบันทึกรายงานผลใน Google Sheets สำเร็จ' };
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

/**
 * =========================================================================
 * Session Report Sheet Generator (พร้อมหัวข้อองค์ประชุมและไฮไลต์สี)
 * =========================================================================
 */

/**
 * ฟังก์ชันสร้าง/รีเซ็ตแม่แบบแท็บ 'บันทึกผลการเช็คชื่อ'
 */
function setupSessionReportTemplate() {
  const sheet = setSheet(SHEETS.SESSION_REPORT);
  sheet.clear();

  const titleRange = sheet.getRange(1, 1, 1, 6);
  titleRange.merge();
  titleRange.setValue('📋 บันทึกรายงานผลการเช็คชื่อองค์ประชุม (SMO 69 วทก.)');
  titleRange.setBackground('#0F2F57');
  titleRange.setFontColor('#FFFFFF');
  titleRange.setFontSize(13);
  titleRange.setFontWeight('bold');
  titleRange.setHorizontalAlignment('center');
  titleRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 38);

  const subRange = sheet.getRange(2, 1, 1, 6);
  subRange.merge();
  subRange.setValue('ℹ️ ระบบจะสร้างและอัปเดตรายงานพร้อมไฮไลต์สีอัตโนมัติทันทีที่มีการบันทึกหรือส่งสรุปผลการเช็คชื่อ');
  subRange.setBackground('#1E3A8A');
  subRange.setFontColor('#E2E8F0');
  subRange.setFontSize(10);
  subRange.setHorizontalAlignment('center');
  subRange.setVerticalAlignment('middle');
  sheet.setRowHeight(2, 26);

  const statRange = sheet.getRange(3, 1, 1, 6);
  statRange.merge();
  statRange.setValue('📊 สถานะ: พร้อมบันทึกข้อมูลองค์ประชุมใหม่');
  statRange.setBackground('#D97706');
  statRange.setFontColor('#FFFFFF');
  statRange.setFontSize(10);
  statRange.setFontWeight('bold');
  statRange.setHorizontalAlignment('center');
  statRange.setVerticalAlignment('middle');
  sheet.setRowHeight(3, 28);

  sheet.setRowHeight(4, 10);
  sheet.getRange(4, 1, 1, 6).setBackground('#F8FAFC');

  const colHeaders = ['ลำดับ', 'สาขาวิชา', 'ชื่อ - นามสกุล', 'ตำแหน่ง', 'สถานะการเข้าร่วม', 'วันเวลาที่บันทึก'];
  const headerRange = sheet.getRange(5, 1, 1, 6);
  headerRange.setValues([colHeaders]);
  headerRange.setBackground('#0F2F57');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontSize(10);
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(5, 28);

  let students = getStudentsData();
  if (!students || students.length === 0) {
    updateStudentsOnly();
    students = getStudentsData();
  }
  
  const attMap = {};
  const stats = { present: 0, late: 0, excused: 0, absent: 0, pending: (students ? students.length : 0), rate: '0%' };
  const dummySession = {
    title: 'พร้อมบันทึกผลการเช็คชื่อ',
    date: Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd'),
    scope: 'ALL',
    sessionId: 'READY',
    status: 'ready'
  };
  renderReportToSheet(sheet, dummySession, students || [], attMap, stats);
}

/**
 * ฟังก์ชันสร้างรายงานขององค์ประชุมล่าสุด (สามารถคลิกสั่งการจาก Google Sheet ได้โดยตรง)
 */
function generateLatestSessionReport() {
  const sessSheet = setSheet(SHEETS.SESSIONS);
  const data = sessSheet.getDataRange().getValues();
  if (data.length <= 1) {
    setupSessionReportTemplate();
    return { success: false, error: 'ยังไม่มีองค์ประชุมในระบบ' };
  }

  for (let i = data.length - 1; i >= 1; i--) {
    if (data[i][0]) {
      return generateSessionReport(String(data[i][0]).trim());
    }
  }
  return { success: false, error: 'ไม่พบข้อมูลองค์ประชุม' };
}

/**
 * ฟังก์ชันสร้างและวาดหน้าแท็บบันทึกผลการเช็คชื่อ พร้อมหัวข้อและไฮไลต์สีอย่างเป็นทางการ
 * @param {string} sessionId - รหัสองค์ประชุม
 */
function generateSessionReport(sessionId) {
  if (!sessionId) {
    return generateLatestSessionReport();
  }

  const sessSheet = setSheet(SHEETS.SESSIONS);
  const sessData = sessSheet.getDataRange().getValues();
  let session = null;

  for (let i = 1; i < sessData.length; i++) {
    if (String(sessData[i][0]).trim() === String(sessionId).trim()) {
      session = {
        sessionId: String(sessData[i][0]).trim(),
        title: String(sessData[i][1]).trim(),
        date: sessData[i][2] instanceof Date ? Utilities.formatDate(sessData[i][2], 'Asia/Bangkok', 'yyyy-MM-dd') : String(sessData[i][2]),
        scope: String(sessData[i][3]).trim(),
        status: String(sessData[i][4]).trim(),
        createdBy: String(sessData[i][5]).trim(),
        createdAt: String(sessData[i][6])
      };
      break;
    }
  }

  if (!session) {
    return { success: false, error: 'ไม่พบองค์ประชุม ID: ' + sessionId };
  }

  let students = getStudentsData();
  if (!students || students.length === 0) {
    updateStudentsOnly();
    students = getStudentsData();
  }
  const attData = getSessionAttendanceData(sessionId);
  const attMap = {};
  attData.forEach(rec => {
    attMap[rec.full_name] = rec;
  });

  let pCount = 0, lCount = 0, eCount = 0, aCount = 0, pendingCount = 0;
  students.forEach(st => {
    const att = attMap[st.full_name];
    const s = att ? att.status : 'ยังไม่เช็ค';
    if (s === 'มา') pCount++;
    else if (s === 'สาย') lCount++;
    else if (s === 'ลา') eCount++;
    else if (s === 'ขาด') aCount++;
    else pendingCount++;
  });

  const total = students.length;
  const attendedCount = pCount + (lCount * 0.75);
  const rate = total > 0 ? ((attendedCount / total) * 100).toFixed(1) + '%' : '0%';

  const stats = {
    present: pCount,
    late: lCount,
    excused: eCount,
    absent: aCount,
    pending: pendingCount,
    rate: rate
  };

  // 1. สร้าง/อัปเดตแท็บเฉพาะของวาระนี้เสมอ (แยกแท็บทุกวาระองค์ประชุม ไม่ว่าจะ draft หรือ submitted ไม่ทับกันแน่นอน)
  const cleanTitle = (session.title || session.sessionId)
    .replace(/[\[\]\*\?:\/\\\'\"]/g, '')
    .trim()
    .substring(0, 25);
  const sessionSheetName = 'วาระ_' + (cleanTitle || session.sessionId);
  const sessionSheet = setSheet(sessionSheetName);
  renderReportToSheet(sessionSheet, session, students, attMap, stats);

  // 2. ซิงค์ลงแท็บสรุปรวมล่าสุด 'บันทึกผลการเช็คชื่อ'
  const reportSheet = setSheet(SHEETS.SESSION_REPORT);
  renderReportToSheet(reportSheet, session, students, attMap, stats);

  SpreadsheetApp.flush();
  Logger.log('✅ สร้างแท็บบันทึกรายงานผลการเช็คชื่อเรียบร้อย: ' + sessionSheetName);
  return { success: true, sheetName: sessionSheetName, message: 'สร้างแท็บ ' + sessionSheetName + ' เรียบร้อย' };
}

/**
 * ฟังก์ชันสร้าง/อัปเดตแท็บแยกให้ครบทุกวาระองค์ประชุมที่มีในระบบ
 */
function generateAllSessionsReports() {
  const sessSheet = setSheet(SHEETS.SESSIONS);
  const data = sessSheet.getDataRange().getValues();
  if (data.length <= 1) {
    setupSessionReportTemplate();
    return { success: false, error: 'ยังไม่มีองค์ประชุมในระบบ' };
  }

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const sId = String(data[i][0]).trim();
    if (sId) {
      try {
        generateSessionReport(sId);
        count++;
      } catch (err) {
        Logger.log('Error in generateAllSessionsReports for ' + sId + ': ' + err.toString());
      }
    }
  }

  SpreadsheetApp.flush();
  Logger.log('✅ สร้างแท็บแยกให้ครบทุกวาระองค์ประชุมแล้ว รวม ' + count + ' วาระ');
  return { success: true, count: count, message: 'สร้างแท็บแยกครบทุกวาระแล้ว (' + count + ' วาระ)' };
}

/**
 * Helper: ลงข้อมูล จัดเลย์เอาต์ และระบายสีไฮไลต์ลงในชีตเป้าหมาย
 */
function renderReportToSheet(sheet, session, students, attMap, stats) {
  sheet.clear();

  // ปลดการ Merge เดิม (ถ้ามี)
  const maxRows = sheet.getMaxRows();
  const maxCols = sheet.getMaxColumns();
  if (maxRows > 1 && maxCols > 1) {
    try {
      sheet.getRange(1, 1, maxRows, maxCols).breakApart();
    } catch (e) {}
  }

  // ปรับจำนวนแถวและคอลัมน์ให้เพียงพอ
  const neededRows = students.length + 8;
  if (sheet.getMaxRows() < neededRows) {
    sheet.insertRowsAfter(sheet.getMaxRows(), neededRows - sheet.getMaxRows());
  }
  if (sheet.getMaxColumns() < 6) {
    sheet.insertColumnsAfter(sheet.getMaxColumns(), 6 - sheet.getMaxColumns());
  }

  // ---------------- แถวที่ 1: หัวข้อองค์ประชุมหลัก ----------------
  const titleRange = sheet.getRange(1, 1, 1, 6);
  titleRange.merge();
  titleRange.setValue('📋 รายงานผลการเช็คชื่อองค์ประชุม: ' + (session.title || 'ไม่ระบุชื่อวาระ'));
  titleRange.setBackground('#0F2F57'); // Royal Navy
  titleRange.setFontColor('#FFFFFF');
  titleRange.setFontSize(13);
  titleRange.setFontWeight('bold');
  titleRange.setHorizontalAlignment('center');
  titleRange.setVerticalAlignment('middle');
  sheet.setRowHeight(1, 38);

  // ---------------- แถวที่ 2: ข้อมูลองค์ประชุมและวันเวลา ----------------
  const subRange = sheet.getRange(2, 1, 1, 6);
  subRange.merge();
  const statusThai = session.status === 'submitted' ? '✅ ยืนยันสรุปผลแล้ว' : '📝 ฉบับร่าง (กำลังเช็คชื่อ)';
  const subText = '📅 วันที่จัดประชุม: ' + session.date + 
                  '   |   🎯 กลุ่มเป้าหมาย: ' + session.scope + 
                  '   |   🆔 รหัส: ' + session.sessionId + 
                  '   |   สถานะ: ' + statusThai + 
                  '   |   อัปเดตล่าสุด: ' + Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
  subRange.setValue(subText);
  subRange.setBackground('#1E3A8A');
  subRange.setFontColor('#E2E8F0');
  subRange.setFontSize(9);
  subRange.setFontWeight('normal');
  subRange.setHorizontalAlignment('center');
  subRange.setVerticalAlignment('middle');
  sheet.setRowHeight(2, 26);

  // ---------------- แถวที่ 3: แถบสรุปยอดตัวเลขและเปอร์เซ็นต์ ----------------
  const statRange = sheet.getRange(3, 1, 1, 6);
  statRange.merge();
  const statText = '📊 สรุปยอด:  มา ' + stats.present + ' คน   |   ' +
                   'มาสาย ' + stats.late + ' คน   |   ' +
                   'ขอลา ' + stats.excused + ' คน   |   ' +
                   'ขาด ' + stats.absent + ' คน   |   ' +
                   'ยังไม่เช็ค ' + stats.pending + ' คน   |   ' +
                   'รวมทั้งสิ้น ' + students.length + ' คน  (คิดเป็น ' + stats.rate + ')';
  statRange.setValue(statText);
  statRange.setBackground('#D97706'); // Imperial Gold
  statRange.setFontColor('#FFFFFF');
  statRange.setFontSize(10);
  statRange.setFontWeight('bold');
  statRange.setHorizontalAlignment('center');
  statRange.setVerticalAlignment('middle');
  sheet.setRowHeight(3, 28);

  // ---------------- แถวที่ 4: แถวว่างคั่นสายตา ----------------
  sheet.setRowHeight(4, 10);
  sheet.getRange(4, 1, 1, 6).setBackground('#F8FAFC');

  // ---------------- แถวที่ 5: หัวตารางข้อมูล ----------------
  const colHeaders = ['ลำดับ', 'สาขาวิชา', 'ชื่อ - นามสกุล', 'ตำแหน่ง', 'สถานะการเข้าร่วม', 'วันเวลาที่บันทึก'];
  const headerRange = sheet.getRange(5, 1, 1, 6);
  headerRange.setValues([colHeaders]);
  headerRange.setBackground('#0F2F57');
  headerRange.setFontColor('#FFFFFF');
  headerRange.setFontSize(10);
  headerRange.setFontWeight('bold');
  headerRange.setHorizontalAlignment('center');
  headerRange.setVerticalAlignment('middle');
  sheet.setRowHeight(5, 28);

  // ---------------- แถวที่ 6 เป็นต้นไป: ข้อมูลรายชื่อ 53 คน พร้อมไฮไลต์สี ----------------
  const values = [];
  const backgrounds = [];
  const fontColors = [];
  const fontWeights = [];
  const alignments = [];

  students.forEach((st, idx) => {
    const att = attMap[st.full_name];
    const rawStatus = att ? att.status : 'ยังไม่เช็ค';
    const timestamp = att ? att.timestamp : '-';

    // การกำหนดข้อความและสีไฮไลต์ของแต่ละสถานะ (ตรงตามที่ผู้ใช้ร้องขอ)
    let statusDisplay = '⏳ ยังไม่เช็ค';
    let statusBg = '#F1F5F9';
    let statusText = '#475569';

    if (rawStatus === 'มา') {
      statusDisplay = '✅ มา';
      statusBg = '#DCFCE7'; // เขียวอ่อนพาสเทล
      statusText = '#15803D'; // เขียวเข้ม
    } else if (rawStatus === 'สาย') {
      statusDisplay = '⏰ มาสาย';
      statusBg = '#FEF3C7'; // ส้ม/เหลืองอ่อน
      statusText = '#B45309'; // ส้มเข้ม
    } else if (rawStatus === 'ลา') {
      statusDisplay = '📝 ขอลา';
      statusBg = '#DBEAFE'; // ฟ้าอ่อน
      statusText = '#1D4ED8'; // น้ำเงินเข้ม
    } else if (rawStatus === 'ขาด') {
      statusDisplay = '❌ ขาด';
      statusBg = '#FEE2E2'; // แดงอ่อน
      statusText = '#B91C1C'; // แดงเข้ม
    }

    // สีอ่อนประจำสาขาวิชาในคอลัมน์ที่ 2
    let branchBg = '#FFFFFF';
    if (st.branch_id === 'RT')  branchBg = '#EFF6FF';
    else if (st.branch_id === 'HCI') branchBg = '#F5F3FF';
    else if (st.branch_id === 'PMD') branchBg = '#FEF2F2';
    else if (st.branch_id === 'BSC') branchBg = '#ECFEFF';
    else if (st.branch_id === 'TTM') branchBg = '#ECFDF5';
    else if (st.branch_id === 'DIP') branchBg = '#FFFBEB';

    const rowBg = (idx % 2 === 0) ? '#FFFFFF' : '#F8FAFC';

    values.push([
      idx + 1,
      st.branch_id,
      st.full_name,
      st.position || '-',
      statusDisplay,
      timestamp
    ]);

    backgrounds.push([
      rowBg,
      branchBg,
      rowBg,
      rowBg,
      statusBg,
      rowBg
    ]);

    fontColors.push([
      '#64748B',
      '#0F172A',
      '#0F172A',
      '#334155',
      statusText,
      '#64748B'
    ]);

    fontWeights.push([
      'normal',
      'bold',
      'normal',
      'normal',
      'bold',
      'normal'
    ]);

    alignments.push([
      'center',
      'center',
      'left',
      'left',
      'center',
      'center'
    ]);
  });

  if (values.length > 0) {
    const dataRange = sheet.getRange(6, 1, values.length, 6);
    dataRange.setValues(values);
    dataRange.setBackgrounds(backgrounds);
    dataRange.setFontColors(fontColors);
    dataRange.setFontWeights(fontWeights);
    dataRange.setHorizontalAlignments(alignments);
    dataRange.setVerticalAlignment('middle');
    dataRange.setFontSize(9);

    // ตั้งค่าความสูงแถว
    for (let r = 0; r < values.length; r++) {
      sheet.setRowHeight(6 + r, 24);
    }

    // ใส่เส้นขอบตาราง (Borders)
    const fullTableRange = sheet.getRange(5, 1, values.length + 1, 6);
    try {
      fullTableRange.setBorder(true, true, true, true, true, true, '#CBD5E1', SpreadsheetApp.BorderStyle.SOLID);
    } catch (e) {
      try {
        fullTableRange.setBorder(true, true, true, true, true, true);
      } catch (e2) {}
    }
  }

  // กำหนดความกว้างคอลัมน์ให้อ่านง่าย พอดีกับข้อความ
  sheet.setColumnWidth(1, 55);   // ลำดับ
  sheet.setColumnWidth(2, 85);   // สาขาวิชา
  sheet.setColumnWidth(3, 230);  // ชื่อ - นามสกุล
  sheet.setColumnWidth(4, 180);  // ตำแหน่ง
  sheet.setColumnWidth(5, 140);  // สถานะการเข้าร่วม (พร้อมไฮไลต์)
  sheet.setColumnWidth(6, 170);  // วันเวลาที่บันทึก

  // ตรึงแถวที่ 1-5 ไว้ด้านบนเสมอ
  try {
    sheet.setFrozenRows(5);
  } catch (e) {}

  // สลับหน้าจอมาที่ชีตนี้ทันทีเพื่อให้ผู้ใช้เห็น
  try {
    sheet.activate();
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) ss.setActiveSheet(sheet);
  } catch (e) {}
}

/**
 * เมนูด่วนบน Google Sheets (ปรากฏอัตโนมัติเมื่อเปิดไฟล์)
 */
function onOpen() {
  try {
    const ui = SpreadsheetApp.getUi();
    ui.createMenu('📋 ระบบเช็คชื่อ SMO 69')
      .addItem('📑 สร้างแท็บแยกให้ครบทุกวาระองค์ประชุม', 'generateAllSessionsReports')
      .addItem('📊 ซิงค์/อัปเดตแท็บสรุปล่าสุด (บันทึกผลการเช็คชื่อ)', 'createReportSheetNow')
      .addSeparator()
      .addItem('⚡ อัปเดตชีต Branches (6 สาขา)', 'updateBranchesOnly')
      .addItem('👥 อัปเดตชีต Students (53 คน)', 'updateStudentsOnly')
      .addItem('🧹 ล้างข้อมูลตัวอย่างทั้งหมด', 'clearAllSampleData')
      .addItem('⚙️ รีเซ็ตระบบเริ่มต้น (setupInitialDatabase)', 'setupInitialDatabase')
      .addToUi();
  } catch (err) {
    // กรณีที่ไม่ได้เปิดผ่าน Spreadsheet UI โดยตรง
  }
}
