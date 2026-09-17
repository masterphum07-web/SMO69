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
 */
function setupInitialDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  // 1. ชีต Branches
  const bSheet = setSheet(SHEETS.BRANCHES);
  if (bSheet.getLastRow() === 0) {
    bSheet.appendRow(['branch_id', 'branch_name', 'color_hex']);
    bSheet.appendRow(['RT01', 'รังสีเทคนิค', '#2563EB']);
    bSheet.appendRow(['PH01', 'สาธารณสุขชุมชน', '#10B981']);
    bSheet.appendRow(['DT01', 'ทันตสาธารณสุข', '#F59E0B']);
    formatHeaderRow(bSheet, '#1E3A8A');
  }

  // 2. ชีต Students
  const sSheet = setSheet(SHEETS.STUDENTS);
  if (sSheet.getLastRow() === 0) {
    sSheet.appendRow(['student_id', 'full_name', 'branch_id']);
    const mockStudents = [
      ['6911001', 'กิตติศักดิ์ เจริญผล', 'RT01'],
      ['6911002', 'จิราพร วงศ์สวัสดิ์', 'RT01'],
      ['6911003', 'ชานนท์ สิทธิพงศ์', 'RT01'],
      ['6911004', 'ณัฐวุฒิ บุญมี', 'RT01'],
      ['6912001', 'ธนากร ภักดีชน', 'PH01'],
      ['6912002', 'เบญจมาศ ศรีสุข', 'PH01'],
      ['6912003', 'ปิยะวัฒน์ ทองหล่อ', 'PH01'],
      ['6912004', 'พิมลดา สุวรรณโชติ', 'PH01'],
      ['6913001', 'วรินทร ดำรงเกียรติ', 'DT01'],
      ['6913002', 'ศิริพร บุญรักษา', 'DT01'],
      ['6913003', 'อนันดา พงษ์ศิริ', 'DT01'],
      ['6913004', 'อาริยา สมบูรณ์', 'DT01']
    ];
    mockStudents.forEach(row => sSheet.appendRow(row));
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
    attSheet.appendRow(['session_id', 'student_id', 'status', 'checked_by', 'timestamp']);
    const nowStr = Utilities.formatDate(new Date(), 'Asia/Bangkok', 'yyyy-MM-dd HH:mm:ss');
    const mockAtt = [
      ['SESS-20260901-01', '6911001', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6911002', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6911003', 'สาย', 'admin01', nowStr],
      ['SESS-20260901-01', '6911004', 'ลา', 'admin01', nowStr],
      ['SESS-20260901-01', '6912001', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6912002', 'ขาด', 'admin01', nowStr],
      ['SESS-20260901-01', '6912003', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6912004', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6913001', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6913002', 'สาย', 'admin01', nowStr],
      ['SESS-20260901-01', '6913003', 'มา', 'admin01', nowStr],
      ['SESS-20260901-01', '6913004', 'มา', 'admin01', nowStr]
    ];
    mockAtt.forEach(row => attSheet.appendRow(row));
    formatHeaderRow(attSheet, '#1E3A8A');
  }

  // 5. ชีต Admins
  const admSheet = setSheet(SHEETS.ADMINS);
  if (admSheet.getLastRow() === 0) {
    admSheet.appendRow(['admin_id', 'pin', 'role', 'name']);
    admSheet.appendRow(['admin01', '1234', 'admin', 'แอดมินสโมสร']);
    admSheet.appendRow(['checker01', '1234', 'checker', 'ผู้เช็คชื่อ 1']);
    formatHeaderRow(admSheet, '#1E3A8A');
  }

  // 6. ชีต Dashboard_Summary
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  if (dashSheet.getLastRow() === 0) {
    dashSheet.appendRow([
      'student_id',
      'full_name',
      'branch_id',
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

  Logger.log('Setup Initial Database Completed Successfully!');
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
        // ดึงข้อมูลภาพรวมในครั้งเดียวเพื่อลด latency
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

/**
 * Helper จัดรูป JSON Response รองรับ JSONP (ถ้ามี callback)
 */
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
        student_id: String(row[0]).trim(),
        full_name: String(row[1]).trim(),
        branch_id: String(row[2]).trim()
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
  // เรียงลำดับจากล่าสุดไปเก่าสุด
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
        student_id: String(row[1]).trim(),
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

/**
 * สร้าง Session องค์ประชุมใหม่
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

/**
 * บันทึกร่างการเช็คชื่อทีละคน/หลายคน (Save Draft เรียลไทม์)
 * @param {string} sessionId
 * @param {Array<{student_id: string, status: string}>} records
 * @param {string} adminId
 */
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

    // สร้าง Map index ของข้อมูลเดิมตาม key: sessionId + '_' + studentId
    const existingRowMap = {};
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (String(row[0]).trim() === String(sessionId).trim()) {
        const studentId = String(row[1]).trim();
        existingRowMap[studentId] = i + 1; // 1-based row index
      }
    }

    const rowsToAppend = [];

    records.forEach(rec => {
      const studentId = String(rec.student_id).trim();
      const status = String(rec.status).trim();
      if (!studentId || !status) return;

      if (existingRowMap[studentId]) {
        // อัปเดตแถวเดิม
        const rowNum = existingRowMap[studentId];
        sheet.getRange(rowNum, 3, 1, 3).setValues([[status, checker, nowStr]]);
      } else {
        // แถวใหม่รอ append
        rowsToAppend.push([sessionId, studentId, status, checker, nowStr]);
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

/**
 * ยืนยันส่งผลการเช็คชื่อ (Submit Attendance)
 * เปลี่ยนสถานะ session เป็น 'submitted' และคำนวณ Dashboard_Summary ใหม่
 */
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

    // อัปเดตสถานะเป็น submitted
    sessSheet.getRange(foundRow, 5).setValue('submitted');
    SpreadsheetApp.flush();

    // คำนวณ Dashboard Summary
    updateDashboardSummary();

    return { success: true, message: 'ยืนยันและปิดรอบการเช็คชื่อเรียบร้อยแล้ว' };
  } catch (err) {
    return { success: false, error: err.toString() };
  } finally {
    lock.releaseLock();
  }
}

/**
 * คำนวณสรุปรายบุคคลลงในชีต Dashboard_Summary
 */
function updateDashboardSummary() {
  const students = getStudentsData();
  const attSheet = setSheet(SHEETS.ATTENDANCE);
  const sessSheet = setSheet(SHEETS.SESSIONS);

  const attData = attSheet.getDataRange().getValues();
  const sessData = sessSheet.getDataRange().getValues();

  // นับเฉพาะ sessions ที่มีสถานะ submitted (หรือทั้งหมดที่มีการเช็ค)
  const validSessionIds = new Set();
  for (let i = 1; i < sessData.length; i++) {
    if (sessData[i][0] && sessData[i][4] === 'submitted') {
      validSessionIds.add(String(sessData[i][0]).trim());
    }
  }

  // สร้าง Map สถิติต่อคน
  const statsMap = {};
  students.forEach(st => {
    statsMap[st.student_id] = {
      student_id: st.student_id,
      full_name: st.full_name,
      branch_id: st.branch_id,
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
    const stId = String(row[1]).trim();
    const status = String(row[2]).trim();

    // นับสถิติเมื่อตรงกับ student ในระบบ
    if (statsMap[stId]) {
      statsMap[stId].total++;
      if (status === 'มา') statsMap[stId].present++;
      else if (status === 'สาย') statsMap[stId].late++;
      else if (status === 'ลา') statsMap[stId].excused++;
      else if (status === 'ขาด') statsMap[stId].absent++;
    }
  }

  // เขียนทับลงในชีต Dashboard_Summary
  const dashSheet = setSheet(SHEETS.DASHBOARD_SUMMARY);
  const rows = [];

  students.forEach(st => {
    const s = statsMap[st.student_id];
    // อัตราการเข้าร่วม = (มา + สาย) / total * 100
    const totalCount = s.present + s.late + s.excused + s.absent;
    const attendedCount = s.present + (s.late * 0.75); // สายให้น้ำหนัก 75%
    const rate = totalCount > 0 ? ((attendedCount / totalCount) * 100).toFixed(1) + '%' : '0%';

    rows.push([
      s.student_id,
      s.full_name,
      s.branch_id,
      s.present,
      s.late,
      s.excused,
      s.absent,
      totalCount,
      rate
    ]);
  });

  // ล้างข้อมูลเดิมแถวที่ 2 เป็นต้นไป
  if (dashSheet.getLastRow() > 1) {
    dashSheet.getRange(2, 1, dashSheet.getLastRow() - 1, dashSheet.getLastColumn()).clearContent();
  }

  if (rows.length > 0) {
    dashSheet.getRange(2, 1, rows.length, 9).setValues(rows);
  }

  SpreadsheetApp.flush();
}

/**
 * ดึงข้อมูล Leaderboard (สรุปทั้งเทอม ไม่ต้อง Login)
 */
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
        student_id: String(row[0]).trim(),
        full_name: String(row[1]).trim(),
        branch_id: String(row[2]).trim(),
        present: Number(row[3]) || 0,
        late: Number(row[4]) || 0,
        excused: Number(row[5]) || 0,
        absent: Number(row[6]) || 0,
        total: Number(row[7]) || 0,
        rate: String(row[8] || '0%')
      });
    }
  }

  // เรียงคนที่เข้าร่วมมากที่สุด
  const topPresent = [...students].sort((a, b) => (b.present + b.late) - (a.present + a.late)).slice(0, 5);
  // เรียงคนที่ขาดมากที่สุด
  const topAbsent = [...students].sort((a, b) => b.absent - a.absent).slice(0, 5);

  return {
    topPresent: topPresent,
    topAbsent: topAbsent,
    totalStudents: students.length
  };
}

/**
 * ดึงข้อมูล Dashboard เต็มสำหรับแอดมิน (Filter สาขาได้)
 */
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
      const branchId = String(row[2]).trim();
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
          student_id: String(row[0]).trim(),
          full_name: String(row[1]).trim(),
          branch_id: branchId,
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
