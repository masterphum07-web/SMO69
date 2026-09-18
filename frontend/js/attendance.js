/**
 * Attendance Management Module
 * จัดการหน้าเช็คชื่อ, การเปลี่ยนสถานะรายบุคคล, บันทึกร่างอัตโนมัติ และการส่งผลสรุป
 */

const Attendance = {
  currentSessionId: null,
  currentSession: null,
  sessions: [],
  branches: [],
  students: [],
  records: {}, // Map full_name -> status ('มา', 'สาย', 'ลา', 'ขาด')
  branchFilter: 'ALL',
  searchQuery: '',
  draftTimeout: null,
  isSaving: false,

  async init() {
    await this.loadInitialData();
  },

  async loadInitialData(force = false) {
    // 1. ถ้ามีข้อมูลแคชอยู่แล้ว นำมาแสดงผลทันที
    if (!force && Api.cache.initialData) {
      const d = Api.cache.initialData;
      this.branches = d.branches || [];
      this.students = d.students || [];
      this.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      this.populateSessions(this.sessions);
      return;
    }

    // 2. ดึงผ่าน Api.getInitialData() แบบครั้งเดียวจบ
    const initRes = await Api.getInitialData(force);
    if (initRes && initRes.success && initRes.data) {
      const d = initRes.data;
      this.branches = (d.branches && d.branches.length > 0) ? d.branches : (window.MockDB ? MockDB.getBranches() : []);
      this.students = (d.students && d.students.length > 0) ? d.students : (window.MockDB ? MockDB.getStudents() : []);
      this.sessions = Array.isArray(d.sessions) ? d.sessions : [];
      this.populateSessions(this.sessions);
      return;
    }

    // 3. Fallback ดึงทีละส่วนหากจำเป็น
    const bRes = await Api.requestGet('getBranches');
    this.branches = (bRes && bRes.success && bRes.data && bRes.data.length > 0) ? bRes.data : (window.MockDB ? MockDB.getBranches() : []);
    const sRes = await Api.requestGet('getStudents');
    this.students = (sRes && sRes.success && sRes.data && sRes.data.length > 0) ? sRes.data : (window.MockDB ? MockDB.getStudents() : []);
    await this.loadSessionsList();
  },

  populateSessions(sessions) {
    const select = document.getElementById('session-select');
    if (!select) return;

    select.innerHTML = '';

    if (Array.isArray(sessions)) {
      this.sessions = sessions;
    }

    if (!this.sessions || this.sessions.length === 0) {
      select.innerHTML = '<option value="">-- ยังไม่มีองค์ประชุม (กรุณากด "+ สร้างองค์ประชุมใหม่") --</option>';
      this.currentSessionId = null;
      this.currentSession = null;
      this.records = {};
      this.updateSessionNotice();
      this.render();
      return;
    }

    // ตรวจสอบและเลือก Session ที่ Active
    if (!this.currentSessionId || !this.sessions.some(s => s.session_id === this.currentSessionId)) {
      this.currentSessionId = this.sessions[0].session_id;
      this.currentSession = this.sessions[0];
    } else {
      this.currentSession = this.sessions.find(s => s.session_id === this.currentSessionId) || this.sessions[0];
    }

    this.sessions.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s.session_id;
      const statusBadge = s.status === 'submitted' ? '✅ [สรุปผลแล้ว]' : '📝 [แบบร่าง]';
      opt.textContent = `${statusBadge} ${s.session_title} (${s.session_date})`;
      if (s.session_id === this.currentSessionId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    this.updateSessionNotice();

    if (this.currentSessionId) {
      this.loadSessionAttendance(this.currentSessionId);
    } else {
      this.render();
    }
  },

  updateSessionNotice() {
    const el = document.getElementById('attendance-session-notice');
    const delBtn = document.getElementById('btn-delete-session');
    if (delBtn) {
      delBtn.style.display = this.currentSession ? 'inline-flex' : 'none';
    }

    if (!el) return;

    if (!this.currentSession) {
      el.className = 'session-notice-bar locked';
      el.innerHTML = '💡 <b>รายชื่อสมาชิกสโมสร 53 คนพร้อมแล้ว</b> — กรุณาเลือกองค์ประชุมที่กล่องด้านบน หรือกดปุ่ม <b>"+ สร้างองค์ประชุมใหม่"</b> เพื่อเริ่มการเช็คชื่อ';
    } else {
      const isSub = this.currentSession.status === 'submitted';
      const badgeClass = isSub ? 'status-present' : 'status-late';
      const badgeText = isSub ? '✅ ยืนยันสรุปผลแล้ว' : '📝 ฉบับร่าง (กำลังเช็คชื่อ)';
      el.className = 'session-notice-bar active';
      el.innerHTML = `📌 กำลังเช็คชื่อ: <b>${this.currentSession.session_title}</b> (${this.currentSession.session_date}) &nbsp;|&nbsp; สาขาวิชา: <b>${this.currentSession.branch_scope}</b> &nbsp;|&nbsp; <span class="status-badge ${badgeClass}" style="font-size: 0.72rem; padding: 0.15rem 0.55rem;">${badgeText}</span>`;
    }
  },

  async loadSessionsList() {
    const res = await Api.requestGet('getSessions');
    const sessions = (res && res.success && Array.isArray(res.data)) ? res.data : [];
    this.populateSessions(sessions);
  },

  async loadSessionAttendance(sessionId) {
    if (!sessionId) {
      this.records = {};
      this.render();
      return;
    }

    this.currentSessionId = sessionId;
    if (this.sessions && this.sessions.length > 0) {
      this.currentSession = this.sessions.find(s => s.session_id === sessionId) || this.currentSession;
    }

    const res = await Api.requestGet('getSessionAttendance', { sessionId });
    this.records = {};

    if (res && res.success && Array.isArray(res.data)) {
      res.data.forEach(item => {
        const key = item.full_name || item.student_id;
        const st = item.status ? String(item.status).trim() : '';
        if (key && st && st !== 'ยังไม่เช็ค') {
          this.records[key] = st;
        }
      });
    }

    this.updateSessionNotice();
    this.render();
  },

  setStatus(fullName, status, idx) {
    if (!this.currentSession) {
      alert('⚠️ ยังไม่ได้เลือกองค์ประชุม!\n\nกรุณาเลือกองค์ประชุมที่กล่องด้านบน หรือกดปุ่ม "+ สร้างองค์ประชุมใหม่" ก่อนเริ่มเช็คชื่อครับ');
      return;
    }

    if (this.currentSession.status === 'submitted') {
      const confirmEdit = confirm('องค์ประชุมนี้ส่งสรุปผลไปแล้ว ต้องการแก้ไขสถานะเพิ่มเติมใช่หรือไม่?');
      if (!confirmEdit) return;
    }

    // หากกดปุ่มสถานะเดิมซ้ำ ให้ยกเลิกกลับเป็น 'ยังไม่เช็ค'
    if (this.records[fullName] === status) {
      delete this.records[fullName];
      status = '';
    } else {
      this.records[fullName] = status;
    }

    if (idx !== undefined && idx !== null) {
      this.updateRowUI(idx, status);
    } else {
      const filtered = this.getFilteredStudents();
      const foundIdx = filtered.findIndex(s => s.full_name === fullName);
      if (foundIdx !== -1) {
        this.updateRowUI(foundIdx, status);
      }
    }

    this.updateSummaryCounts();

    // Auto-save draft แบบ debounce 800ms
    this.triggerAutoSave();
  },

  triggerAutoSave() {
    const statusText = document.getElementById('draft-status-indicator');
    if (statusText) {
      statusText.innerHTML = '<span class="saving-dot"></span> กำลังบันทึกร่าง...';
      statusText.className = 'status-text saving';
    }

    clearTimeout(this.draftTimeout);
    this.draftTimeout = setTimeout(async () => {
      await this.saveDraft(false);
    }, 800);
  },

  async saveDraft(showSuccessAlert = true) {
    if (!this.currentSessionId) {
      if (showSuccessAlert) {
        alert('⚠️ กรุณาเลือกหรือสร้างองค์ประชุมก่อนทำการบันทึก');
      }
      return;
    }

    const user = Auth.getUser();
    const adminId = user ? user.adminId : 'admin01';

    // ส่งรายชื่อสมาชิกทุกคน 53 คนเสมอ เพื่อซิงค์สถานะจริงลงชีต (คนที่ยังไม่กด จะส่งเป็น 'ยังไม่เช็ค')
    const allStudents = (this.students && this.students.length > 0) ? this.students : [];
    const recordsArray = allStudents.map(st => {
      const s = this.records[st.full_name];
      return {
        full_name: st.full_name,
        status: (s && s !== 'ยังไม่เช็ค') ? s : 'ยังไม่เช็ค'
      };
    });

    if (recordsArray.length === 0) return;

    this.isSaving = true;
    const res = await Api.requestPost('saveAttendanceDraft', {
      sessionId: this.currentSessionId,
      records: recordsArray,
      adminId: adminId
    });
    this.isSaving = false;

    const statusText = document.getElementById('draft-status-indicator');
    if (res && res.success) {
      const timeStr = new Date().toLocaleTimeString('th-TH');
      if (statusText) {
        statusText.innerHTML = `✓ บันทึกร่างเรียบร้อยแล้วเมื่อ ${timeStr}`;
        statusText.className = 'status-text saved';
      }
      if (showSuccessAlert) {
        alert('บันทึกร่างข้อมูลเรียบร้อยแล้ว!');
      }
    } else {
      if (statusText) {
        statusText.innerHTML = `⚠️ บันทึกล้มเหลว: ${res ? res.error : 'โปรดตรวจสอบการเชื่อมต่อ'}`;
        statusText.className = 'status-text error';
      }
    }
  },

  async syncReportToSheets(e) {
    if (!this.currentSessionId) {
      alert('⚠️ กรุณาเลือกองค์ประชุมด้านบนก่อน เพื่อสร้างหรืออัปเดตรายงานผลขององค์ประชุมนั้นลงใน Google Sheets ครับ');
      return;
    }
    const btn = (e && e.target) ? e.target : null;
    const oldText = btn ? btn.textContent : '';
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ กำลังสร้างแท็บใน Google Sheets...';
    }
    try {
      // บันทึกสถานะล่าสุดก่อน
      await this.saveDraft(false);
      const res = await Api.requestGet('generateReport', { sessionId: this.currentSessionId });
      if (res && res.success) {
        const sessionTitle = this.currentSession ? this.currentSession.session_title : '';
        const cleanName = sessionTitle ? `วาระ_${sessionTitle.substring(0, 20)}` : 'แท็บประจำวาระ';
        alert(`✅ สร้าง/อัปเดตแท็บใน Google Sheets เรียบร้อยแล้ว!\n\n📑 แท็บเฉพาะของวาระนี้: "${cleanName}" (แยกแท็บถาวร ไม่ทับกับวาระอื่น)\n📊 แท็บสรุปล่าสุด: "บันทึกผลการเช็คชื่อ"\n\nคุณสามารถเปิดดูใน Google Sheets ได้ทันทีครับ`);
      } else {
        alert('⚠️ บันทึกข้อมูลเรียบร้อยแล้ว หากยังไม่เห็นแท็บใหม่ กรุณาเปิด Google Sheets แล้วกดรีเฟรช (F5) ครับ');
      }
    } catch (err) {
      alert('⚠️ เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = oldText || '📊 อัปเดตชีตรายงานผล (Google Sheet)';
      }
    }
  },

  async submitSession() {
    if (!this.currentSessionId || !this.currentSession) {
      alert('⚠️ ไม่พบองค์ประชุม กรุณาเลือกหรือสร้างองค์ประชุมก่อน');
      return;
    }

    const totalTarget = this.getFilteredStudents().length;
    const checkedCount = Object.keys(this.records).length;
    const uncheckedCount = totalTarget - checkedCount;

    let confirmMsg = `ยืนยันการ "ส่งสรุปผล" องค์ประชุมนี้หรือไม่?\n\n` +
      `องค์ประชุม: ${this.currentSession.session_title}\n` +
      `เช็คแล้ว: ${checkedCount} คน\n` +
      (uncheckedCount > 0 ? `⚠️ ยังไม่ได้เช็ค: ${uncheckedCount} คน (จะถือว่าขาด/ยังไม่ระบุ)\n` : `✓ เช็คครบทุกคนแล้ว\n`) +
      `\nเมื่อส่งแล้ว ระบบจะคำนวณสถิติและอัปเดตลง Google Sheets ทันที`;

    if (!confirm(confirmMsg)) return;

    // บันทึก draft ล่าสุดก่อน
    await this.saveDraft(false);

    const user = Auth.getUser();
    const adminId = user ? user.adminId : 'admin01';

    const res = await Api.requestPost('submitAttendance', {
      sessionId: this.currentSessionId,
      adminId: adminId
    });

    if (res && res.success) {
      alert('🎉 ส่งสรุปผลและปิดรอบการเช็คชื่อสำเร็จแล้ว! สถิติถูกอัปเดตเรียบร้อย');
      this.currentSession.status = 'submitted';
      await this.loadSessionsList();
      if (window.Dashboard && typeof Dashboard.loadPublicStats === 'function') {
        Dashboard.loadPublicStats(true);
      }
    } else {
      alert('เกิดข้อผิดพลาด: ' + (res ? res.error : 'ไม่สามารถส่งได้'));
    }
  },

  async createNewSession(title, date, branchScope) {
    const user = Auth.getUser();
    const adminId = user ? user.adminId : 'admin01';

    const res = await Api.requestPost('createSession', {
      title,
      date,
      branchScope,
      adminId
    });

    if (res && res.success && res.session) {
      const newSession = res.session;

      // 1. ตั้งเป็น Active Session ทันทีในหน่วยความจำ
      this.currentSessionId = newSession.session_id;
      this.currentSession = newSession;
      this.records = {};

      // 2. อัปเดตรายการ sessions ทันที
      const existing = Array.isArray(this.sessions) ? this.sessions : [];
      this.sessions = [newSession, ...existing.filter(s => s.session_id !== newSession.session_id)];

      // 3. แสดงผลใน Dropdown และหน้าตารางทันที (พร้อมเช็คชื่อได้เลย!)
      this.populateSessions(this.sessions);

      // 4. โหลดสถิติ Dashboard ใหม่ใน background
      if (window.Dashboard && typeof Dashboard.loadPublicStats === 'function') {
        Dashboard.loadPublicStats(true);
      }

      alert(`✅ สร้างองค์ประชุม "${newSession.session_title}" สำเร็จแล้ว! พร้อมเริ่มเช็คชื่อได้ทันที`);
      return true;
    } else {
      alert('ไม่สามารถสร้างองค์ประชุมได้: ' + (res && res.error ? res.error : 'ข้อผิดพลาดไม่ทราบสาเหตุ'));
      return false;
    }
  },

  async deleteCurrentSession() {
    if (!this.currentSessionId || !this.currentSession) {
      alert('⚠️ ยังไม่ได้เลือกองค์ประชุมที่จะลบ');
      return;
    }

    const title = this.currentSession.session_title;
    const deletedId = this.currentSessionId;
    const confirmMsg = `⚠️ คำเตือน: คุณต้องการลบวาระองค์ประชุมนี้ใช่หรือไม่?\n\n` +
      `📌 หัวข้อ: "${title}" (${this.currentSession.session_date})\n\n` +
      `เมื่อลบแล้ว:\n` +
      `• รายการองค์ประชุมนี้จะถูกลบออกจากระบบ\n` +
      `• ข้อมูลการเช็คชื่อทั้งหมดของวาระนี้จะถูกลบ\n\n` +
      `ยืนยันการลบหรือไม่? (การกระทำนี้ไม่สามารถย้อนกลับได้)`;

    if (!confirm(confirmMsg)) return;

    const user = Auth.getUser();
    const adminId = user ? user.adminId : 'admin01';

    const btn = document.getElementById('btn-delete-session');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ กำลังลบ...';
    }

    let apiOk = false;
    let apiError = '';

    // พยายามลบผ่าน API
    try {
      const res = await Api.requestPost('deleteSession', {
        sessionId: deletedId,
        adminId: adminId
      });
      apiOk = (res && res.success);
      if (!apiOk) {
        apiError = (res && res.error) ? res.error : 'ไม่ทราบสาเหตุ';
      }
    } catch (err) {
      apiError = err.message || 'การเชื่อมต่อขัดข้อง';
    }

    // ✅ ลบสำเร็จจาก API → ลบออกจาก UI และแคชทันที
    if (apiOk) {
      alert(`✅ ลบวาระ "${title}" สำเร็จเรียบร้อยแล้ว!`);
      this._removeSessionFromUI(deletedId);
    } else {
      // ❌ API ล้มเหลวหรือวาระถูกลบไปแล้ว → ถามยืนยันเพื่อลบออกจากหน้าเว็บและแคชเครื่อง
      const forceRemove = confirm(
        `⚠️ ไม่สามารถลบผ่าน Google Sheets ได้ (${apiError})\n\n` +
        `(อาจเป็นเพราะวาระนี้ถูกลบจากชีตไปแล้ว หรือเครือข่ายขัดข้อง)\n\n` +
        `🔹 ต้องการลบวาระ "${title}" ออกจากหน้าเว็บและแคชเครื่องทันทีหรือไม่?\n` +
        `(กด "ตกลง" เพื่อล้างออกถาวร)`
      );
      if (forceRemove) {
        this._removeSessionFromUI(deletedId);
        alert(`✅ ลบวาระ "${title}" ออกจากหน้าเว็บและแคชเรียบร้อยแล้ว`);
      }
    }

    if (btn) {
      btn.disabled = false;
      btn.textContent = '🗑️ ลบวาระนี้';
    }
  },

  /** ฟังก์ชันภายใน: ลบ session ออกจาก UI/state/cache ทันที 100% */
  _removeSessionFromUI(sessionId) {
    this.currentSessionId = null;
    this.currentSession = null;
    this.records = {};

    if (Array.isArray(this.sessions)) {
      this.sessions = this.sessions.filter(s => s.session_id !== sessionId);
    }

    // ล้างออกจากแคชทั้งในหน่วยความจำและ localStorage
    Api.purgeSessionFromCache(sessionId);

    // ล้างออกจาก MockDB เผื่อไว้
    if (window.MockDB && typeof MockDB.deleteSession === 'function') {
      try { MockDB.deleteSession(sessionId); } catch (e) {}
    }

    // เรนเดอร์ Dropdown และตารางในหน้า Attendance ใหม่
    this.populateSessions(this.sessions);

    // อัปเดต Dropdown และตารางหน้าแรก (Dashboard) ทันที 100%
    if (window.Dashboard) {
      if (Array.isArray(Dashboard.publicSessions)) {
        Dashboard.publicSessions = Dashboard.publicSessions.filter(s => s.session_id !== sessionId);
        if (Dashboard.selectedPublicSessionId === sessionId) {
          Dashboard.selectedPublicSessionId = Dashboard.publicSessions.length > 0 ? Dashboard.publicSessions[0].session_id : null;
        }
        Dashboard.populatePublicSessionSelect();
        if (Dashboard.selectedPublicSessionId) {
          Dashboard.loadSelectedPublicSession(Dashboard.selectedPublicSessionId);
        } else {
          Dashboard.renderNoSessionsState();
        }
      }
      try { Dashboard.loadPublicStats(true); } catch (e) {}
    }
  },

  markRemainingAs(status = 'มา') {
    if (!this.currentSession) {
      alert('⚠️ ยังไม่ได้เลือกองค์ประชุม!\n\nกรุณาเลือกองค์ประชุมที่กล่องด้านบน หรือกดปุ่ม "+ สร้างองค์ประชุมใหม่" ก่อนเริ่มเช็คชื่อครับ');
      return;
    }

    if (this.currentSession.status === 'submitted') {
      const confirmEdit = confirm('องค์ประชุมนี้ส่งสรุปผลไปแล้ว ต้องการแก้ไขสถานะเพิ่มเติมใช่หรือไม่?');
      if (!confirmEdit) return;
    }

    const filtered = this.getFilteredStudents();
    // คัดกรองเฉพาะคนที่ยังไม่ได้เช็ค (ยังไม่มีสถานะ หรือสถานะเป็น 'ยังไม่เช็ค')
    const remaining = filtered.filter(st => {
      const s = this.records[st.full_name];
      return !s || s === 'ยังไม่เช็ค';
    });

    if (remaining.length === 0) {
      alert('💡 สมาชิกทุกคนที่แสดงอยู่ได้รับการเช็คชื่อครบเรียบร้อยแล้ว ไม่มีคนที่เหลือครับ');
      return;
    }

    const countAlready = filtered.length - remaining.length;
    let detailMsg = `ต้องการตั้งสถานะคนที่ยังไม่ได้เช็ค (${remaining.length} คน) ให้เป็น "${status}" ใช่หรือไม่?`;
    if (countAlready > 0) {
      detailMsg += `\n\n(สมาชิกอีก ${countAlready} คนที่เช็คสถานะไว้แล้ว เช่น สาย, ลา, ขาด จะคงเดิม ไม่ถูกเปลี่ยนแปลง)`;
    }

    if (!confirm(detailMsg)) return;

    remaining.forEach(st => {
      this.records[st.full_name] = status;
    });

    this.render();
    this.triggerAutoSave();
  },

  markAllAs(status) {
    if (!this.currentSession) {
      alert('⚠️ ยังไม่ได้เลือกองค์ประชุม!\n\nกรุณาเลือกองค์ประชุมที่กล่องด้านบน หรือกดปุ่ม "+ สร้างองค์ประชุมใหม่" ก่อนเริ่มเช็คชื่อครับ');
      return;
    }

    const students = this.getFilteredStudents();
    if (students.length === 0) return;

    if (!confirm(`ต้องการตั้งสถานะทุกคนที่แสดงอยู่ (${students.length} คน) เป็น "${status}" ใช่หรือไม่?`)) return;

    students.forEach(st => {
      this.records[st.full_name] = status;
    });

    this.render();
    this.triggerAutoSave();
  },

  async resetAllAttendance() {
    if (!this.currentSession) {
      alert('⚠️ ยังไม่ได้เลือกองค์ประชุม!\n\nกรุณาเลือกองค์ประชุมที่กล่องด้านบน หรือกดปุ่ม "+ สร้างองค์ประชุมใหม่" ก่อนครับ');
      return;
    }

    if (!confirm('⚠️ ยืนยันการล้างผลเช็คชื่อทั้งหมดขององค์ประชุมนี้หรือไม่?\n\n(สถานะของทุกคนจะกลับเป็น "ยังไม่เช็ค" ทั้งบนหน้าเว็บและใน Google Sheets ทันที)')) {
      return;
    }

    this.records = {};
    this.render();

    const statusText = document.getElementById('draft-status-indicator');
    if (statusText) {
      statusText.innerHTML = '<span class="saving-dot"></span> กำลังรีเซ็ตสถานะทุกคนใน Google Sheet เป็น "ยังไม่เช็ค"...';
      statusText.className = 'status-text saving';
    }

    await this.saveDraft(false);

    if (statusText) {
      const timeStr = new Date().toLocaleTimeString('th-TH');
      statusText.innerHTML = `✓ รีเซ็ตผลเช็คชื่อเป็น "ยังไม่เช็ค" ครบทุกคนแล้วเมื่อ ${timeStr}`;
      statusText.className = 'status-text saved';
    }
    alert('✅ ล้างผลการเช็คชื่อเรียบร้อยแล้ว ทุกคนกลับเป็น "ยังไม่เช็ค" ทั้งบนหน้าเว็บและใน Google Sheets');
  },

  clearCurrentFilters() {
    this.resetAllAttendance();
  },

  getFilteredStudents() {
    return this.students.filter(st => {
      let matchBranch = (this.branchFilter === 'ALL');
      if (!matchBranch) {
        if (this.branchFilter === 'PMD' || this.branchFilter === 'EMT') {
          matchBranch = (st.branch_id === 'PMD' || st.branch_id === 'EMT');
        } else if (this.branchFilter === 'BSC' || this.branchFilter === 'MR_BSC') {
          matchBranch = (st.branch_id === 'BSC' || st.branch_id === 'MR_BSC');
        } else if (this.branchFilter === 'DIP' || this.branchFilter === 'MR_DIP') {
          matchBranch = (st.branch_id === 'DIP' || st.branch_id === 'MR_DIP');
        } else {
          matchBranch = (st.branch_id === this.branchFilter);
        }
      }
      const query = this.searchQuery.trim().toLowerCase();
      const matchSearch = !query ||
        st.full_name.toLowerCase().includes(query) ||
        (st.position && st.position.toLowerCase().includes(query));
      return matchBranch && matchSearch;
    });
  },

  render() {
    const container = document.getElementById('attendance-table-body');
    if (!container) return;

    this.updateSessionNotice();

    const filtered = this.getFilteredStudents();
    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="empty-state" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted);">ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก</td></tr>`;
      this.updateSummaryCounts();
      return;
    }

    const isLocked = !this.currentSession;

    filtered.forEach((st, idx) => {
      const currentStatus = isLocked ? '' : (this.records[st.full_name] || '');
      const branch = this.branches.find(b => {
        if (b.branch_id === st.branch_id) return true;
        if ((st.branch_id === 'EMT' && b.branch_id === 'PMD') || (st.branch_id === 'PMD' && b.branch_id === 'EMT')) return true;
        if ((st.branch_id === 'MR_BSC' && b.branch_id === 'BSC') || (st.branch_id === 'BSC' && b.branch_id === 'MR_BSC')) return true;
        if ((st.branch_id === 'MR_DIP' && b.branch_id === 'DIP') || (st.branch_id === 'DIP' && b.branch_id === 'MR_DIP')) return true;
        return false;
      }) || { branch_name: st.branch_id, color_hex: '#6B7280' };

      const tr = document.createElement('tr');
      tr.id = `row-student-${idx}`;
      tr.className = 'student-row';

      const statusBadgeHtml = isLocked
        ? `<span class="status-badge status-pending" title="กรุณาเลือกหรือสร้างองค์ประชุมก่อน">⏳ รอเลือกวาระ</span>`
        : `<span id="badge-${idx}" class="status-badge status-${this.getStatusClass(currentStatus)}">${currentStatus || 'ยังไม่เช็ค'}</span>`;

      const btnDisabledClass = isLocked ? 'disabled' : '';
      const btnTitle = isLocked ? 'กรุณาเลือกหรือสร้างองค์ประชุมด้านบนก่อนเริ่มเช็คชื่อ' : '';

      tr.innerHTML = `
        <td class="col-num text-center">${idx + 1}</td>
        <td class="col-name">
          <div class="name-box">
            <span class="student-name">${st.full_name}</span>
            <span class="branch-badge" style="background-color: ${branch.color_hex}20; color: ${branch.color_hex}; border-color: ${branch.color_hex}50">
              ${branch.branch_name}
            </span>
            ${st.position ? `<span class="position-badge">${st.position}</span>` : ''}
          </div>
        </td>
        <td class="col-status-badge text-center">
          ${statusBadgeHtml}
        </td>
        <td class="col-actions text-center">
          <div class="btn-status-group">
            <button type="button" class="btn-status btn-present ${currentStatus === 'มา' ? 'active' : ''} ${btnDisabledClass}" title="${btnTitle}" onclick="Attendance.setStatus('${st.full_name}', 'มา', ${idx})">
              ✓ มา
            </button>
            <button type="button" class="btn-status btn-late ${currentStatus === 'สาย' ? 'active' : ''} ${btnDisabledClass}" title="${btnTitle}" onclick="Attendance.setStatus('${st.full_name}', 'สาย', ${idx})">
              ⏰ สาย
            </button>
            <button type="button" class="btn-status btn-excused ${currentStatus === 'ลา' ? 'active' : ''} ${btnDisabledClass}" title="${btnTitle}" onclick="Attendance.setStatus('${st.full_name}', 'ลา', ${idx})">
              ✉️ ลา
            </button>
            <button type="button" class="btn-status btn-absent ${currentStatus === 'ขาด' ? 'active' : ''} ${btnDisabledClass}" title="${btnTitle}" onclick="Attendance.setStatus('${st.full_name}', 'ขาด', ${idx})">
              ✕ ขาด
            </button>
          </div>
        </td>
      `;
      container.appendChild(tr);
    });

    this.updateSummaryCounts();
    this.updateBranchBadges();
  },

  updateRowUI(idx, status) {
    const badge = document.getElementById(`badge-${idx}`);
    if (badge) {
      badge.textContent = status || 'ยังไม่เช็ค';
      badge.className = `status-badge status-${this.getStatusClass(status)}`;
    }

    const row = document.getElementById(`row-student-${idx}`);
    if (row) {
      const btns = row.querySelectorAll('.btn-status');
      btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.classList.contains('btn-present') && status === 'มา') btn.classList.add('active');
        if (btn.classList.contains('btn-late') && status === 'สาย') btn.classList.add('active');
        if (btn.classList.contains('btn-excused') && status === 'ลา') btn.classList.add('active');
        if (btn.classList.contains('btn-absent') && status === 'ขาด') btn.classList.add('active');
      });
    }
  },

  updateSummaryCounts() {
    let present = 0, late = 0, excused = 0, absent = 0, pending = 0;
    const filtered = this.getFilteredStudents();

    if (!this.currentSession) {
      pending = filtered.length;
    } else {
      filtered.forEach(st => {
        const s = this.records[st.full_name];
        if (s === 'มา') present++;
        else if (s === 'สาย') late++;
        else if (s === 'ลา') excused++;
        else if (s === 'ขาด') absent++;
        else pending++;
      });
    }

    const elP = document.getElementById('count-present');
    const elL = document.getElementById('count-late');
    const elE = document.getElementById('count-excused');
    const elA = document.getElementById('count-absent');
    const elPend = document.getElementById('count-pending');
    const elTot = document.getElementById('count-total');

    if (elP) elP.textContent = present;
    if (elL) elL.textContent = late;
    if (elE) elE.textContent = excused;
    if (elA) elA.textContent = absent;
    if (elPend) elPend.textContent = pending;
    if (elTot) elTot.textContent = filtered.length;
  },

  updateBranchBadges() {
    const container = document.getElementById('branch-filter-container');
    if (!container) return;

    if (container.children.length > 0) return;

    let html = `
      <button class="branch-filter-btn ${this.branchFilter === 'ALL' ? 'active' : ''}" onclick="Attendance.setBranchFilter('ALL')">
        ทั้งหมด (${this.students.length})
      </button>
    `;

    this.branches.forEach(b => {
      const count = this.students.filter(s => {
        if (s.branch_id === b.branch_id) return true;
        if ((s.branch_id === 'EMT' && b.branch_id === 'PMD') || (s.branch_id === 'PMD' && b.branch_id === 'EMT')) return true;
        if ((s.branch_id === 'MR_BSC' && b.branch_id === 'BSC') || (s.branch_id === 'BSC' && b.branch_id === 'MR_BSC')) return true;
        if ((s.branch_id === 'MR_DIP' && b.branch_id === 'DIP') || (s.branch_id === 'DIP' && b.branch_id === 'MR_DIP')) return true;
        return false;
      }).length;
      const isActive = this.branchFilter === b.branch_id;
      html += `
        <button class="branch-filter-btn ${isActive ? 'active' : ''}" onclick="Attendance.setBranchFilter('${b.branch_id}')">
          ${b.branch_name} (${count})
        </button>
      `;
    });

    container.innerHTML = html;
  },

  setBranchFilter(branchId) {
    this.branchFilter = branchId;
    const container = document.getElementById('branch-filter-container');
    if (container) {
      Array.from(container.querySelectorAll('.branch-filter-btn')).forEach(btn => {
        const text = btn.textContent.trim();
        if (branchId === 'ALL') {
          btn.classList.toggle('active', text.startsWith('ทั้งหมด'));
        } else {
          const b = this.branches.find(item => item.branch_id === branchId);
          const bName = b ? b.branch_name : branchId;
          btn.classList.toggle('active', text.startsWith(bName));
        }
      });
    }
    this.render();
  },

  setSearchQuery(query) {
    this.searchQuery = query;
    this.render();
  },

  getStatusClass(status) {
    switch (status) {
      case 'มา': return 'present';
      case 'สาย': return 'late';
      case 'ลา': return 'excused';
      case 'ขาด': return 'absent';
      default: return 'pending';
    }
  }
};
