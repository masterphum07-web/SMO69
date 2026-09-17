/**
 * Mock Data Engine for offline testing & initial preview
 * ตามสเปก Master Prompt (Branches, Students, Sessions, Attendance, Admins, Dashboard)
 */
const MOCK_DATA_KEY = 'smo69_mock_database_v1';

const INITIAL_MOCK_DATA = {
  branches: [
    { branch_id: 'RT01', branch_name: 'รังสีเทคนิค', color_hex: '#2563EB' },
    { branch_id: 'PH01', branch_name: 'สาธารณสุขชุมชน', color_hex: '#10B981' },
    { branch_id: 'DT01', branch_name: 'ทันตสาธารณสุข', color_hex: '#F59E0B' }
  ],
  students: [
    { student_id: '6911001', full_name: 'กิตติศักดิ์ เจริญผล', branch_id: 'RT01' },
    { student_id: '6911002', full_name: 'จิราพร วงศ์สวัสดิ์', branch_id: 'RT01' },
    { student_id: '6911003', full_name: 'ชานนท์ สิทธิพงศ์', branch_id: 'RT01' },
    { student_id: '6911004', full_name: 'ณัฐวุฒิ บุญมี', branch_id: 'RT01' },
    { student_id: '6912001', full_name: 'ธนากร ภักดีชน', branch_id: 'PH01' },
    { student_id: '6912002', full_name: 'เบญจมาศ ศรีสุข', branch_id: 'PH01' },
    { student_id: '6912003', full_name: 'ปิยะวัฒน์ ทองหล่อ', branch_id: 'PH01' },
    { student_id: '6912004', full_name: 'พิมลดา สุวรรณโชติ', branch_id: 'PH01' },
    { student_id: '6913001', full_name: 'วรินทร ดำรงเกียรติ', branch_id: 'DT01' },
    { student_id: '6913002', full_name: 'ศิริพร บุญรักษา', branch_id: 'DT01' },
    { student_id: '6913003', full_name: 'อนันดา พงษ์ศิริ', branch_id: 'DT01' },
    { student_id: '6913004', full_name: 'อาริยา สมบูรณ์', branch_id: 'DT01' }
  ],
  sessions: [
    {
      session_id: 'SESS-20260901-01',
      session_title: 'ปฐมนิเทศสโมสรนักศึกษาปี 69',
      session_date: '2026-09-01',
      branch_scope: 'ALL',
      status: 'submitted',
      created_by: 'admin01',
      created_at: '2026-09-01 09:00:00'
    },
    {
      session_id: 'SESS-20260910-02',
      session_title: 'ประชุมเตรียมงานกีฬาสานสัมพันธ์ วทก.',
      session_date: '2026-09-10',
      branch_scope: 'ALL',
      status: 'submitted',
      created_by: 'admin01',
      created_at: '2026-09-10 13:30:00'
    },
    {
      session_id: 'SESS-20260917-03',
      session_title: 'องค์ประชุมสโมสรนักศึกษาประจำสัปดาห์',
      session_date: '2026-09-17',
      branch_scope: 'ALL',
      status: 'draft',
      created_by: 'admin01',
      created_at: '2026-09-17 17:00:00'
    }
  ],
  attendance: [
    // Session 1
    { session_id: 'SESS-20260901-01', student_id: '6911001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6911002', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6911003', status: 'สาย', checked_by: 'admin01', timestamp: '2026-09-01 09:15:00' },
    { session_id: 'SESS-20260901-01', student_id: '6911004', status: 'ลา', checked_by: 'admin01', timestamp: '2026-09-01 09:00:00' },
    { session_id: 'SESS-20260901-01', student_id: '6912001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6912002', status: 'ขาด', checked_by: 'admin01', timestamp: '2026-09-01 09:30:00' },
    { session_id: 'SESS-20260901-01', student_id: '6912003', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6912004', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6913001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6913002', status: 'สาย', checked_by: 'admin01', timestamp: '2026-09-01 09:12:00' },
    { session_id: 'SESS-20260901-01', student_id: '6913003', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },
    { session_id: 'SESS-20260901-01', student_id: '6913004', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-01 09:05:00' },

    // Session 2
    { session_id: 'SESS-20260910-02', student_id: '6911001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6911002', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6911003', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6911004', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6912001', status: 'สาย', checked_by: 'admin01', timestamp: '2026-09-10 13:45:00' },
    { session_id: 'SESS-20260910-02', student_id: '6912002', status: 'ขาด', checked_by: 'admin01', timestamp: '2026-09-10 14:00:00' },
    { session_id: 'SESS-20260910-02', student_id: '6912003', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6912004', status: 'ลา', checked_by: 'admin01', timestamp: '2026-09-10 13:30:00' },
    { session_id: 'SESS-20260910-02', student_id: '6913001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6913002', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },
    { session_id: 'SESS-20260910-02', student_id: '6913003', status: 'ขาด', checked_by: 'admin01', timestamp: '2026-09-10 14:00:00' },
    { session_id: 'SESS-20260910-02', student_id: '6913004', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-10 13:35:00' },

    // Session 3 (Draft)
    { session_id: 'SESS-20260917-03', student_id: '6911001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-17 17:05:00' },
    { session_id: 'SESS-20260917-03', student_id: '6911002', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-17 17:05:00' },
    { session_id: 'SESS-20260917-03', student_id: '6911003', status: 'สาย', checked_by: 'admin01', timestamp: '2026-09-17 17:15:00' },
    { session_id: 'SESS-20260917-03', student_id: '6912001', status: 'มา', checked_by: 'admin01', timestamp: '2026-09-17 17:05:00' }
  ],
  admins: [
    { admin_id: 'admin01', pin: '1234', role: 'admin', name: 'แอดมินสโมสร' },
    { admin_id: 'checker01', pin: '1234', role: 'checker', name: 'ผู้เช็คชื่อประจำวัน' }
  ]
};

const MockDB = {
  get() {
    const raw = localStorage.getItem(MOCK_DATA_KEY);
    if (!raw) {
      this.reset();
      return JSON.parse(localStorage.getItem(MOCK_DATA_KEY));
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      this.reset();
      return JSON.parse(localStorage.getItem(MOCK_DATA_KEY));
    }
  },

  save(data) {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(data));
  },

  reset() {
    localStorage.setItem(MOCK_DATA_KEY, JSON.stringify(INITIAL_MOCK_DATA));
  },

  loginCheck(adminId, pin) {
    const db = this.get();
    const user = db.admins.find(a => a.admin_id.toLowerCase() === String(adminId).toLowerCase() && String(a.pin) === String(pin));
    if (user) {
      return {
        success: true,
        user: { adminId: user.admin_id, role: user.role, name: user.name }
      };
    }
    return { success: false, error: 'รหัสผู้ใช้งานหรือ PIN ไม่ถูกต้อง (ทดสอบ: admin01 / 1234)' };
  },

  getBranches() {
    return this.get().branches;
  },

  getStudents(branchFilter) {
    const db = this.get();
    if (!branchFilter || branchFilter === 'ALL') return db.students;
    return db.students.filter(s => s.branch_id === branchFilter);
  },

  getSessions() {
    const db = this.get();
    return [...db.sessions].reverse();
  },

  getSessionAttendance(sessionId) {
    const db = this.get();
    return db.attendance.filter(a => a.session_id === sessionId);
  },

  createSession(title, date, branchScope, adminId) {
    const db = this.get();
    const sessionId = 'SESS-' + Date.now();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const newSession = {
      session_id: sessionId,
      session_title: title,
      session_date: date,
      branch_scope: branchScope || 'ALL',
      status: 'draft',
      created_by: adminId || 'admin01',
      created_at: now
    };
    db.sessions.push(newSession);
    this.save(db);
    return { success: true, session: newSession, message: 'สร้างองค์ประชุมสำเร็จ' };
  },

  saveAttendanceDraft(sessionId, records, adminId) {
    const db = this.get();
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    records.forEach(rec => {
      const idx = db.attendance.findIndex(a => a.session_id === sessionId && a.student_id === rec.student_id);
      if (idx !== -1) {
        db.attendance[idx].status = rec.status;
        db.attendance[idx].checked_by = adminId || 'admin01';
        db.attendance[idx].timestamp = now;
      } else {
        db.attendance.push({
          session_id: sessionId,
          student_id: rec.student_id,
          status: rec.status,
          checked_by: adminId || 'admin01',
          timestamp: now
        });
      }
    });
    this.save(db);
    return { success: true, message: `บันทึกร่างเรียบร้อยแล้ว (${records.length} รายการ)` };
  },

  submitAttendance(sessionId, adminId) {
    const db = this.get();
    const sess = db.sessions.find(s => s.session_id === sessionId);
    if (!sess) return { success: false, error: 'ไม่พบองค์ประชุม' };
    sess.status = 'submitted';
    this.save(db);
    return { success: true, message: 'ยืนยันและปิดรอบการเช็คชื่อเรียบร้อยแล้ว' };
  },

  getLeaderboard() {
    const dash = this.getDashboard();
    const students = dash.students;
    const topPresent = [...students].sort((a, b) => (b.present + b.late) - (a.present + a.late)).slice(0, 5);
    const topAbsent = [...students].sort((a, b) => b.absent - a.absent).slice(0, 5);
    return {
      topPresent,
      topAbsent,
      totalStudents: students.length
    };
  },

  getDashboard(filterBranch) {
    const db = this.get();
    const students = db.students;
    const attendance = db.attendance;
    const submittedSessions = new Set(db.sessions.filter(s => s.status === 'submitted').map(s => s.session_id));

    const list = [];
    let totalPresent = 0;
    let totalLate = 0;
    let totalExcused = 0;
    let totalAbsent = 0;

    students.forEach(st => {
      if (filterBranch && filterBranch !== 'ALL' && st.branch_id !== filterBranch) return;

      const userAtts = attendance.filter(a => a.student_id === st.student_id && submittedSessions.has(a.session_id));
      let p = 0, l = 0, e = 0, a = 0;

      userAtts.forEach(att => {
        if (att.status === 'มา') p++;
        else if (att.status === 'สาย') l++;
        else if (att.status === 'ลา') e++;
        else if (att.status === 'ขาด') a++;
      });

      totalPresent += p;
      totalLate += l;
      totalExcused += e;
      totalAbsent += a;

      const total = p + l + e + a;
      const weighted = p + (l * 0.75);
      const rate = total > 0 ? ((weighted / total) * 100).toFixed(1) + '%' : '0%';

      list.push({
        student_id: st.student_id,
        full_name: st.full_name,
        branch_id: st.branch_id,
        present: p,
        late: l,
        excused: e,
        absent: a,
        total: total,
        rate: rate
      });
    });

    return {
      summary: {
        totalPresent,
        totalLate,
        totalExcused,
        totalAbsent,
        totalRecords: list.length
      },
      students: list
    };
  }
};
