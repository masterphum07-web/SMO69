/**
 * Attendance Management Module
 * จัดการหน้าเช็คชื่อ, การเปลี่ยนสถานะรายบุคคล, บันทึกร่างอัตโนมัติ และการส่งผลสรุป
 */

const Attendance = {
  currentSessionId: null,
  currentSession: null,
  branches: [],
  students: [],
  records: {}, // Map student_id -> status ('มา', 'สาย', 'ลา', 'ขาด')
  branchFilter: 'ALL',
  searchQuery: '',
  draftTimeout: null,
  isSaving: false,

  async init() {
    await this.loadInitialData();
  },

  async loadInitialData(force = false) {
    // 1. ถ้ามีข้อมูลแคชอยู่แล้ว นำมาแสดงผลทันที (เร็วใน 0 ms)
    if (!force && Api.cache.initialData) {
      const d = Api.cache.initialData;
      this.branches = d.branches || [];
      this.students = d.students || [];
      this.populateSessions(d.sessions || []);
      return;
    }

    // 2. ดึงผ่าน Api.getInitialData() แบบครั้งเดียวจบ
    const initRes = await Api.getInitialData(force);
    if (initRes && initRes.success && initRes.data) {
      const d = initRes.data;
      this.branches = d.branches || [];
      this.students = d.students || [];
      this.populateSessions(d.sessions || []);
      return;
    }

    // 3. Fallback ดึงทีละส่วนหากจำเป็น
    const bRes = await Api.requestGet('getBranches');
    if (bRes && bRes.success) this.branches = bRes.data || [];
    const sRes = await Api.requestGet('getStudents');
    if (sRes && sRes.success) this.students = sRes.data || [];
    await this.loadSessionsList();
  },

  populateSessions(sessions) {
    const select = document.getElementById('session-select');
    if (!select) return;

    select.innerHTML = '';
    const sessList = Array.isArray(sessions) ? sessions : [];

    if (sessList.length === 0) {
      select.innerHTML = '<option value="">-- ยังไม่มีองค์ประชุม (กรุณากด "+ สร้างองค์ประชุมใหม่") --</option>';
      this.currentSessionId = null;
      this.currentSession = null;
      this.records = {};
      this.render();
      return;
    }

    sessList.forEach((s, idx) => {
      const opt = document.createElement('option');
      opt.value = s.session_id;
      const statusBadge = s.status === 'submitted' ? '✅ [สรุปผลแล้ว]' : '📝 [แบบร่าง]';
      opt.textContent = `${statusBadge} ${s.session_title} (${s.session_date})`;
      if (idx === 0 && !this.currentSessionId) {
        opt.selected = true;
      } else if (s.session_id === this.currentSessionId) {
        opt.selected = true;
      }
      select.appendChild(opt);
    });

    if (!this.currentSessionId && sessList.length > 0) {
      this.currentSessionId = sessList[0].session_id;
      this.currentSession = sessList[0];
    } else {
      this.currentSession = sessList.find(s => s.session_id === this.currentSessionId) || sessList[0];
    }

    if (this.currentSessionId) {
      this.loadSessionAttendance(this.currentSessionId);
    } else {
      this.render();
    }
  },

  async loadSessionsList() {
    const res = await Api.requestGet('getSessions');
    const sessions = (res && res.success) ? res.data : [];
    this.populateSessions(sessions);
  },

  async loadSessionAttendance(sessionId) {
    if (!sessionId) {
      this.records = {};
      this.render();
      return;
    }

    this.currentSessionId = sessionId;
    const res = await Api.requestGet('getSessionAttendance', { sessionId });
    this.records = {};

    if (res && res.success && Array.isArray(res.data)) {
      res.data.forEach(item => {
        const key = item.full_name || item.student_id;
        this.records[key] = item.status;
      });
    }

    this.render();
  },

  setStatus(fullName, status) {
    if (!this.currentSession) {
      alert('กรุณาเลือกหรือสร้างองค์ประชุมก่อนเช็คชื่อ');
      return;
    }

    if (this.currentSession.status === 'submitted') {
      const confirmEdit = confirm('องค์ประชุมนี้ส่งสรุปผลไปแล้ว ต้องการแก้ไขเพิ่มเติมใช่หรือไม่?');
      if (!confirmEdit) return;
    }

    this.records[fullName] = status;
    this.updateRowUI(fullName, status);
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
    if (!this.currentSessionId) return;

    const user = Auth.getUser();
    const adminId = user ? user.adminId : 'admin01';

    const recordsArray = Object.keys(this.records).map(name => ({
      full_name: name,
      status: this.records[name]
    }));

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
        statusText.innerHTML = `⚠️ บันทึกล้มเหลว: ${res.error || 'โปรดตรวจสอบการเชื่อมต่อ'}`;
        statusText.className = 'status-text error';
      }
    }
  },

  async submitSession() {
    if (!this.currentSessionId) {
      alert('ไม่พบองค์ประชุม');
      return;
    }

    // นับจำนวนคนที่ยังไม่เช็ค
    const totalTarget = this.getFilteredStudents().length;
    const checkedCount = Object.keys(this.records).length;
    const uncheckedCount = totalTarget - checkedCount;

    let confirmMsg = `ยืนยันการ "ส่งสรุปผล" องค์ประชุมนี้หรือไม่?\n\n` +
      `องค์ประชุม: ${this.currentSession ? this.currentSession.session_title : ''}\n` +
      `เช็คแล้ว: ${checkedCount} คน\n` +
      (uncheckedCount > 0 ? `⚠️ ยังไม่ได้เช็ค: ${uncheckedCount} คน (จะถือว่ายังไม่สมบูรณ์)\n` : `✓ เช็คครบทุกคนแล้ว\n`) +
      `\nเมื่อส่งแล้ว ระบบจะคำนวณสถิติและอัปเดต Dashboard ใน Google Sheets ทันที`;

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
      await this.loadSessionsList();
      if (window.Dashboard) {
        window.Dashboard.load();
      }
    } else {
      alert('เกิดข้อผิดพลาด: ' + (res.error || 'ไม่สามารถส่งได้'));
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

    if (res && res.success) {
      alert('สร้างองค์ประชุมสำเร็จ!');
      this.currentSessionId = res.session.session_id;
      this.currentSession = res.session;
      await this.loadSessionsList();
      return true;
    } else {
      alert('ไม่สามารถสร้างองค์ประชุมได้: ' + (res.error || 'ข้อผิดพลาดไม่ทราบสาเหตุ'));
      return false;
    }
  },

  markAllAs(status) {
    if (!this.currentSession) return;
    const students = this.getFilteredStudents();
    if (students.length === 0) return;

    if (!confirm(`ต้องการตั้งสถานะทุกคนที่แสดงอยู่ (${students.length} คน) เป็น "${status}" ใช่หรือไม่?`)) return;

    students.forEach(st => {
      this.records[st.student_id] = status;
    });

    this.render();
    this.triggerAutoSave();
  },

  clearCurrentFilters() {
    this.records = {};
    this.render();
    this.triggerAutoSave();
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

    if (!this.currentSession) {
      container.innerHTML = `<tr><td colspan="4" class="empty-state" style="padding: 3rem 1rem; text-align: center; color: var(--text-muted); font-size: 0.95rem;">📋 ยังไม่มีการเปิดองค์ประชุม กรุณากดปุ่ม <b>"+ สร้างองค์ประชุมใหม่"</b> ด้านบนเพื่อเริ่มการเช็คชื่อ</td></tr>`;
      this.updateSummaryCounts();
      return;
    }

    const filtered = this.getFilteredStudents();
    container.innerHTML = '';

    if (filtered.length === 0) {
      container.innerHTML = `<tr><td colspan="4" class="empty-state">ไม่พบข้อมูลสมาชิกตามเงื่อนไขที่เลือก</td></tr>`;
      this.updateSummaryCounts();
      return;
    }

    filtered.forEach((st, idx) => {
      const currentStatus = this.records[st.full_name] || '';
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
          <span id="badge-${idx}" class="status-badge status-${this.getStatusClass(currentStatus)}">
            ${currentStatus || 'ยังไม่เช็ค'}
          </span>
        </td>
        <td class="col-actions text-center">
          <div class="btn-status-group">
            <button type="button" class="btn-status btn-present ${currentStatus === 'มา' ? 'active' : ''}" onclick="Attendance.setStatus('${st.full_name}', 'มา', ${idx})">
              ✓ มา
            </button>
            <button type="button" class="btn-status btn-late ${currentStatus === 'สาย' ? 'active' : ''}" onclick="Attendance.setStatus('${st.full_name}', 'สาย', ${idx})">
              ⏰ สาย
            </button>
            <button type="button" class="btn-status btn-excused ${currentStatus === 'ลา' ? 'active' : ''}" onclick="Attendance.setStatus('${st.full_name}', 'ลา', ${idx})">
              ✉️ ลา
            </button>
            <button type="button" class="btn-status btn-absent ${currentStatus === 'ขาด' ? 'active' : ''}" onclick="Attendance.setStatus('${st.full_name}', 'ขาด', ${idx})">
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

    filtered.forEach(st => {
      const s = this.records[st.full_name];
      if (s === 'มา') present++;
      else if (s === 'สาย') late++;
      else if (s === 'ลา') excused++;
      else if (s === 'ขาด') absent++;
      else pending++;
    });

    const setEl = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setEl('count-present', present);
    setEl('count-late', late);
    setEl('count-excused', excused);
    setEl('count-absent', absent);
    setEl('count-pending', pending);
    setEl('count-total', filtered.length);
  },

  getStatusClass(status) {
    switch (status) {
      case 'มา': return 'present';
      case 'สาย': return 'late';
      case 'ลา': return 'excused';
      case 'ขาด': return 'absent';
      default: return 'pending';
    }
  },

  updateBranchBadges() {
    const container = document.getElementById('branch-filter-container');
    if (!container) return;

    container.innerHTML = `
      <button class="branch-filter-btn ${this.branchFilter === 'ALL' ? 'active' : ''}" onclick="Attendance.setBranchFilter('ALL')">
        ทุกสาขา (${this.students.length})
      </button>
    `;

    this.branches.forEach(b => {
      const count = this.students.filter(s => s.branch_id === b.branch_id).length;
      const isActive = this.branchFilter === b.branch_id;
      const btn = document.createElement('button');
      btn.className = `branch-filter-btn ${isActive ? 'active' : ''}`;
      btn.style.setProperty('--branch-color', b.color_hex);
      btn.innerHTML = `<span class="color-dot" style="background-color: ${b.color_hex}"></span> ${b.branch_name} (${count})`;
      btn.onclick = () => Attendance.setBranchFilter(b.branch_id);
      container.appendChild(btn);
    });
  },

  setBranchFilter(branchId) {
    this.branchFilter = branchId;
    this.render();
  },

  setSearchQuery(q) {
    this.searchQuery = q;
    this.render();
  }
};

window.Attendance = Attendance;
