/**
 * Mock Data Engine for offline testing & initial preview
 * สโมสรนักศึกษาปี 2569 (วทก.) รวม 6 สาขาวิชา 53 คน (ไม่มี student_id)
 */
const MOCK_DATA_KEY = 'smo69_mock_database_v6_clean';

const INITIAL_MOCK_DATA = {
  branches: [
    {
        "branch_id": "RT",
        "branch_name": "รังสีเทคนิค",
        "color_hex": "#2563EB"
    },
    {
        "branch_id": "HCI",
        "branch_name": "นวัตกรรมสื่อสารสุขภาพ",
        "color_hex": "#8B5CF6"
    },
    {
        "branch_id": "PMD",
        "branch_name": "ฉุกเฉินการแพทย์",
        "color_hex": "#EF4444"
    },
    {
        "branch_id": "BSC",
        "branch_name": "วท.บ.เวชระเบียน",
        "color_hex": "#06B6D4"
    },
    {
        "branch_id": "TTM",
        "branch_name": "การแพทย์แผนไทย",
        "color_hex": "#10B981"
    },
    {
        "branch_id": "DIP",
        "branch_name": "ปวส.เวชระเบียน",
        "color_hex": "#F59E0B"
    }
],
  students: [
    {
        "full_name": "นางสาวภัทรวรินทร์ เกษมสุข",
        "branch_id": "RT",
        "position": "นายก"
    },
    {
        "full_name": "นางสาวประภัสสร วงษ์กำภู",
        "branch_id": "RT",
        "position": "ฝ่ายเลขานุการ (เฮด)"
    },
    {
        "full_name": "นายบดินทร์ การุณเวทย์",
        "branch_id": "RT",
        "position": "ฝ่ายเหรัญญิก"
    },
    {
        "full_name": "นายภูมิภัทร สว่างเวียง",
        "branch_id": "RT",
        "position": "ฝ่ายวิชาการ"
    },
    {
        "full_name": "นางสาวดอกรัก อิสระอังกูร",
        "branch_id": "RT",
        "position": "ฝ่ายประสานงาน (เฮด)"
    },
    {
        "full_name": "นางสาวอัญญานี อาสะหนิ",
        "branch_id": "RT",
        "position": "ฝ่ายประชาสัมพันธ์"
    },
    {
        "full_name": "นางสาวพิมพ์พันธุ์ กล่องทอง",
        "branch_id": "RT",
        "position": "ฝ่ายกิจกรรม (เฮด)"
    },
    {
        "full_name": "นายศรัณย์ อินทรีย์",
        "branch_id": "RT",
        "position": "ฝ่ายโสต"
    },
    {
        "full_name": "นางสาวจินตนา ศรีเริ่มสกุล",
        "branch_id": "RT",
        "position": "ฝ่ายสถานที่ (เฮด)"
    },
    {
        "full_name": "นางสาวจุฑามณี สมบัติ",
        "branch_id": "HCI",
        "position": "อุปนายก"
    },
    {
        "full_name": "นางสาวณัจมีย์ ปูเตะ",
        "branch_id": "HCI",
        "position": "ฝ่ายประชาสัมพันธ์"
    },
    {
        "full_name": "นางสาวปิญชาน อุดมโภชน์",
        "branch_id": "HCI",
        "position": "ฝ่ายเลขานุการ"
    },
    {
        "full_name": "นายคิมภกรณ์ ไชยขันธุ์",
        "branch_id": "HCI",
        "position": "ฝ่ายโสต"
    },
    {
        "full_name": "นางสาวกุลนิษฐ์ ประดิษฐ์ธรรม",
        "branch_id": "HCI",
        "position": "ฝ่ายเฮดวิชาการ"
    },
    {
        "full_name": "นางสาวอนัญญา ปานหงษ์",
        "branch_id": "HCI",
        "position": "ฝ่ายประสานงาน"
    },
    {
        "full_name": "นางสาวปาลิดา โลกาวัฒนะ",
        "branch_id": "HCI",
        "position": "ฝ่ายเฮดฝ่ายทะเบียน"
    },
    {
        "full_name": "นางสาวแวตัสนีม แวหะมุ",
        "branch_id": "HCI",
        "position": "ฝ่ายสวัสดิการ"
    },
    {
        "full_name": "นางสาวพัทรวรรณ คำภิโล",
        "branch_id": "HCI",
        "position": "ฝ่ายกีฬา"
    },
    {
        "full_name": "นายอนุชา รักบูรณ์",
        "branch_id": "HCI",
        "position": "ฝ่ายเหรัญญิก"
    },
    {
        "full_name": "นายธนโชติ พันธุ์ลำเจียก",
        "branch_id": "PMD",
        "position": "ฝ่ายอุปนายก"
    },
    {
        "full_name": "นายแทนไท พรมชาติ",
        "branch_id": "PMD",
        "position": "ฝ่ายเลขานุการ"
    },
    {
        "full_name": "นางสาวจิรภา แดงสังวาลย์",
        "branch_id": "PMD",
        "position": "ฝ่ายเหรัญญิก"
    },
    {
        "full_name": "นางสาวสุภัสสรา ธรรมจิตติ",
        "branch_id": "PMD",
        "position": "ฝ่ายวิชาการ"
    },
    {
        "full_name": "นางสาวธนพร ตรีโอษฐ์",
        "branch_id": "PMD",
        "position": "ฝ่ายประสานงาน"
    },
    {
        "full_name": "นางสาวณัฐนิชา ครุฑวิชิต",
        "branch_id": "PMD",
        "position": "ฝ่ายประชาสัมพันธ์ (เฮด)"
    },
    {
        "full_name": "นางสาวณัฐกมล สีชมภู",
        "branch_id": "PMD",
        "position": "ฝ่านอาคารและสถานที่"
    },
    {
        "full_name": "นางสาวธันณธรณ์ จวงจันทร์",
        "branch_id": "PMD",
        "position": "ฝ่ายกีฬา (เฮด)"
    },
    {
        "full_name": "นางสาวสุพาณี ผมเหมาะ",
        "branch_id": "PMD",
        "position": "ฝ่ายสวัสดิการ"
    },
    {
        "full_name": "นายณัฐเศรษฐ ใจสุข",
        "branch_id": "PMD",
        "position": "ฝ่ายโสต (เฮด)"
    },
    {
        "full_name": "นางสาวหทัยรัตน์ ชูรักษ์",
        "branch_id": "PMD",
        "position": "ฝ่ายประสานงาน"
    },
    {
        "full_name": "นางสาวชนันภรณ์ เผือกผุด",
        "branch_id": "BSC",
        "position": "อุปนายก"
    },
    {
        "full_name": "ลาภวัต มหาวงศ์",
        "branch_id": "BSC",
        "position": "ฝ่ายเลขานุการ"
    },
    {
        "full_name": "นางสาวฤทัยชนก วัตนานุสิทธิ์",
        "branch_id": "BSC",
        "position": "ฝ่ายกิจกรรม"
    },
    {
        "full_name": "นางสาวศิริยาพร บุญมี",
        "branch_id": "BSC",
        "position": "ฝ่ายประสานงาน"
    },
    {
        "full_name": "นางสาวเกวลิน ฤาชา",
        "branch_id": "BSC",
        "position": "ฝ่ายเหรัญญิก (เฮด)"
    },
    {
        "full_name": "นางสาวบุษรากร ชูคันหอม",
        "branch_id": "BSC",
        "position": "ฝ่ายสวัสดิการ"
    },
    {
        "full_name": "นางสาวณัฐฐา ตราโต",
        "branch_id": "BSC",
        "position": "ฝ่ายสวัสดิการ"
    },
    {
        "full_name": "นางสาวชุติกาญจน์ ละกะเต็บ",
        "branch_id": "BSC",
        "position": "ฝ่ายวิชาการ"
    },
    {
        "full_name": "นายพิทักษ์พงศ์ สาหินกอง",
        "branch_id": "BSC",
        "position": "ฝ่ายประชาสัมพันธ์"
    },
    {
        "full_name": "นายคุณากร ชุมพล",
        "branch_id": "BSC",
        "position": "ฝ่ายโสต"
    },
    {
        "full_name": "นายธนพันธุ์ จะปะการ",
        "branch_id": "BSC",
        "position": "ฝ่ายโสต"
    },
    {
        "full_name": "นายกรวิชญ์ เวฬุวนารักษ์",
        "branch_id": "TTM",
        "position": "อุปนายก"
    },
    {
        "full_name": "นายมหรรณพ มัฆมาน",
        "branch_id": "TTM",
        "position": "ฝ่ายเลขานุการ"
    },
    {
        "full_name": "นางสาวศุภิสรา สุขสมบูรณ์",
        "branch_id": "TTM",
        "position": "ฝ่ายพหุวัฒนธรรม (เฮด)"
    },
    {
        "full_name": "นางสาวอินทุอร พึ่งบุญ ณ อยุธยา",
        "branch_id": "TTM",
        "position": "ฝ่ายสวัสดิการ"
    },
    {
        "full_name": "นางสาวอาลียา กาซอ",
        "branch_id": "TTM",
        "position": "ฝ่ายกิจกรรม"
    },
    {
        "full_name": "นางสาวบุษย์ ช่วยเกิด",
        "branch_id": "TTM",
        "position": "ฝ่ายเหรัญญิก"
    },
    {
        "full_name": "นายพงศ์ดนัย ราษดี",
        "branch_id": "TTM",
        "position": "ฝ่ายประชาสัมพันธ์"
    },
    {
        "full_name": "นายตุลวัฒน์ สุวรรณวงศ์",
        "branch_id": "TTM",
        "position": "ฝ่ายวิชาการ"
    },
    {
        "full_name": "นางสาวสุภารัตน์ คงมั่น",
        "branch_id": "TTM",
        "position": "ฝ่ายพหุวัฒนธรรม"
    },
    {
        "full_name": "นายยศกร สุภัคจารุสิทธิ์",
        "branch_id": "TTM",
        "position": "ฝ่ายประสานงาน"
    },
    {
        "full_name": "นางสาวจุฑามาศ องอาจ",
        "branch_id": "DIP",
        "position": "อุปนายก"
    },
    {
        "full_name": "นางสาวภาณุมาศ บุญนวน",
        "branch_id": "DIP",
        "position": "สันทนาการ"
    }
],
  sessions: [],
  attendance: [],
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
      const idx = db.attendance.findIndex(a => a.session_id === sessionId && a.full_name === rec.full_name);
      if (idx !== -1) {
        db.attendance[idx].status = rec.status;
        db.attendance[idx].checked_by = adminId || 'admin01';
        db.attendance[idx].timestamp = now;
      } else {
        db.attendance.push({
          session_id: sessionId,
          full_name: rec.full_name,
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

  deleteSession(sessionId, adminId) {
    const db = this.get();
    db.sessions = (db.sessions || []).filter(s => s.session_id !== sessionId);
    db.attendance = (db.attendance || []).filter(a => a.session_id !== sessionId);
    this.save(db);
    return { success: true, message: 'ลบวาระองค์ประชุมเรียบร้อยแล้ว' };
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

      const userAtts = attendance.filter(a => a.full_name === st.full_name && submittedSessions.has(a.session_id));
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
        full_name: st.full_name,
        branch_id: st.branch_id,
        position: st.position || '',
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

window.MockDB = MockDB;
