/**
 * Dashboard & Leaderboard Module
 * จัดการหน้าสถิติสาธารณะ (Public Stats/Leaderboard พร้อม Realtime Polling)
 * และ แดชบอร์ดแอดมิน (Admin Summary & History)
 */

const Dashboard = {
  pollingTimer: null,
  isPollingActive: false,
  branches: [],

  async init() {
    const bRes = await Api.requestGet('getBranches');
    if (bRes && bRes.success) {
      this.branches = bRes.data || [];
    }
    await this.loadPublicStats();
    this.startRealtimePolling();
  },

  startRealtimePolling() {
    if (this.pollingTimer) clearInterval(this.pollingTimer);
    const interval = Config.getPollInterval();
    this.pollingTimer = setInterval(async () => {
      // โหลดเฉพาะเมื่อหน้าเว็บยังเปิดอยู่
      if (!document.hidden) {
        await this.loadPublicStats(true);
      }
    }, interval);
    this.isPollingActive = true;
  },

  stopRealtimePolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPollingActive = false;
  },

  async loadPublicStats(isBackground = false) {
    const pollIndicator = document.getElementById('public-poll-indicator');
    if (pollIndicator && !isBackground) {
      pollIndicator.innerHTML = '<span class="pulse-dot"></span> กำลังดึงข้อมูลล่าสุด...';
    }

    try {
      // 1. ดึง sessions ล่าสุด
      const sessRes = await Api.requestGet('getSessions');
      const sessions = (sessRes && sessRes.success) ? sessRes.data : [];

      if (sessions.length > 0) {
        const latestSession = sessions[0];
        this.renderCurrentSessionBanner(latestSession);

        // ดึง attendance ของ session นี้
        const attRes = await Api.requestGet('getSessionAttendance', { sessionId: latestSession.session_id });
        const records = (attRes && attRes.success) ? attRes.data : [];

        // ดึง students
        const stRes = await Api.requestGet('getStudents');
        const students = (stRes && stRes.success) ? stRes.data : [];

        this.renderPublicSessionAttendance(latestSession, records, students);
      } else {
        this.renderNoSessionsState();
      }

      // 2. ดึง Leaderboard
      const leadRes = await Api.requestGet('getLeaderboard');
      if (leadRes && leadRes.success && leadRes.data) {
        this.renderLeaderboard(leadRes.data);
      }

      if (pollIndicator) {
        const now = new Date().toLocaleTimeString('th-TH');
        pollIndicator.innerHTML = `<span class="pulse-dot active"></span> อัปเดตเรียลไทม์ล่าสุดเมื่อ ${now}`;
      }
    } catch (err) {
      console.warn('โหลด Public Stats ไม่สำเร็จ:', err);
      if (pollIndicator) {
        pollIndicator.innerHTML = '<span class="pulse-dot error"></span> การเชื่อมต่อขัดข้อง ชั่วคราว';
      }
    }
  },

  renderCurrentSessionBanner(session) {
    const titleEl = document.getElementById('public-session-title');
    const dateEl = document.getElementById('public-session-date');
    const badgeEl = document.getElementById('public-session-badge');

    if (titleEl) titleEl.textContent = session.session_title;
    if (dateEl) dateEl.textContent = `วันที่จัดประชุม: ${session.session_date}`;
    if (badgeEl) {
      const isSubmitted = session.status === 'submitted';
      badgeEl.className = `status-badge ${isSubmitted ? 'status-present' : 'status-late'}`;
      badgeEl.textContent = isSubmitted ? '✓ สรุปผลแล้ว' : '📝 กำลังเช็คชื่อ (แบบร่าง)';
    }
  },

  renderNoSessionsState() {
    const titleEl = document.getElementById('public-session-title');
    if (titleEl) titleEl.textContent = 'ยังไม่มีองค์ประชุมการเช็คชื่อในระบบ';
  },

  renderPublicSessionAttendance(session, records, students) {
    const map = {};
    records.forEach(r => { map[r.student_id] = r.status; });

    let present = 0, late = 0, excused = 0, absent = 0, pending = 0;
    students.forEach(s => {
      const st = map[s.student_id];
      if (st === 'มา') present++;
      else if (st === 'สาย') late++;
      else if (st === 'ลา') excused++;
      else if (st === 'ขาด') absent++;
      else pending++;
    });

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('pub-stat-present', present);
    setVal('pub-stat-late', late);
    setVal('pub-stat-excused', excused);
    setVal('pub-stat-absent', absent);
    setVal('pub-stat-pending', pending);
    setVal('pub-stat-total', students.length);

    // ตารางรายชื่อ
    const tbody = document.getElementById('public-attendance-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    students.forEach((st, idx) => {
      const currentStatus = map[st.student_id] || '';
      const branch = this.branches.find(b => b.branch_id === st.branch_id) || { branch_name: st.branch_id, color_hex: '#6B7280' };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center font-mono text-muted">${idx + 1}</td>
        <td class="font-mono font-semibold">${st.student_id}</td>
        <td>
          <div class="name-box">
            <span class="student-name">${st.full_name}</span>
            <span class="branch-badge" style="background-color: ${branch.color_hex}20; color: ${branch.color_hex}; border-color: ${branch.color_hex}50">
              ${branch.branch_name}
            </span>
          </div>
        </td>
        <td class="text-center">
          <span class="status-badge status-${this.getStatusClass(currentStatus)}">
            ${currentStatus || 'ยังไม่เช็ค'}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  renderLeaderboard(data) {
    // Top Present
    const topPresentList = document.getElementById('leaderboard-top-present');
    if (topPresentList) {
      topPresentList.innerHTML = '';
      if (!data.topPresent || data.topPresent.length === 0) {
        topPresentList.innerHTML = '<li class="empty-text">ยังไม่มีข้อมูลสรุป</li>';
      } else {
        data.topPresent.forEach((st, i) => {
          const rankColors = ['#F59E0B', '#94A3B8', '#B45309', '#64748B', '#64748B'];
          const li = document.createElement('li');
          li.className = 'leaderboard-item';
          li.innerHTML = `
            <div class="rank-badge" style="background-color: ${rankColors[i] || '#64748B'}">${i + 1}</div>
            <div class="leaderboard-info">
              <div class="leaderboard-name">${st.full_name}</div>
              <div class="leaderboard-sub text-muted font-mono">${st.student_id} • สาขา ${st.branch_id}</div>
            </div>
            <div class="leaderboard-score text-success font-semibold">
              ${st.present + st.late} ครั้ง <span class="rate-badge">(${st.rate})</span>
            </div>
          `;
          topPresentList.appendChild(li);
        });
      }
    }

    // Top Absent
    const topAbsentList = document.getElementById('leaderboard-top-absent');
    if (topAbsentList) {
      topAbsentList.innerHTML = '';
      if (!data.topAbsent || data.topAbsent.length === 0) {
        topAbsentList.innerHTML = '<li class="empty-text">ยังไม่มีข้อมูลสรุป</li>';
      } else {
        data.topAbsent.forEach((st, i) => {
          const li = document.createElement('li');
          li.className = 'leaderboard-item';
          li.innerHTML = `
            <div class="rank-badge rank-absent">${i + 1}</div>
            <div class="leaderboard-info">
              <div class="leaderboard-name">${st.full_name}</div>
              <div class="leaderboard-sub text-muted font-mono">${st.student_id} • สาขา ${st.branch_id}</div>
            </div>
            <div class="leaderboard-score text-danger font-semibold">
              ${st.absent} ครั้ง
            </div>
          `;
          topAbsentList.appendChild(li);
        });
      }
    }
  },

  /**
   * แดชบอร์ดสำหรับแอดมิน (Admin View)
   */
  async loadAdminDashboard(filterBranch = 'ALL') {
    const res = await Api.requestGet('getDashboard', { branch: filterBranch });
    if (!res || !res.success) return;

    const data = res.data;
    const summary = data.summary;
    const students = data.students;

    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('admin-stat-present', summary.totalPresent);
    setVal('admin-stat-late', summary.totalLate);
    setVal('admin-stat-excused', summary.totalExcused);
    setVal('admin-stat-absent', summary.totalAbsent);
    setVal('admin-stat-total-students', summary.totalRecords);

    // เรนเดอร์ตารางสรุป
    const tbody = document.getElementById('admin-summary-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    students.forEach((st, idx) => {
      const branch = this.branches.find(b => b.branch_id === st.branch_id) || { branch_name: st.branch_id, color_hex: '#6B7280' };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="text-center font-mono">${idx + 1}</td>
        <td class="font-mono font-semibold">${st.student_id}</td>
        <td>
          <div class="name-box">
            <span class="student-name">${st.full_name}</span>
            <span class="branch-badge" style="background-color: ${branch.color_hex}20; color: ${branch.color_hex}; border-color: ${branch.color_hex}50">
              ${branch.branch_name}
            </span>
          </div>
        </td>
        <td class="text-center font-bold text-success">${st.present}</td>
        <td class="text-center font-bold text-warning">${st.late}</td>
        <td class="text-center font-bold text-primary">${st.excused}</td>
        <td class="text-center font-bold text-danger">${st.absent}</td>
        <td class="text-center font-mono">${st.total}</td>
        <td class="text-center">
          <span class="rate-pill font-mono font-semibold ${parseFloat(st.rate) >= 80 ? 'rate-high' : 'rate-low'}">
            ${st.rate}
          </span>
        </td>
      `;
      tbody.appendChild(tr);
    });

    // โหลดประวัติ sessions
    await this.loadAdminSessionsHistory();
  },

  async loadAdminSessionsHistory() {
    const res = await Api.requestGet('getSessions');
    const tbody = document.getElementById('admin-sessions-history-tbody');
    if (!tbody) return;

    tbody.innerHTML = '';
    const sessions = (res && res.success) ? res.data : [];

    if (sessions.length === 0) {
      tbody.innerHTML = '<tr><td colspan="6" class="empty-state">ยังไม่มีประวัติองค์ประชุม</td></tr>';
      return;
    }

    sessions.forEach(s => {
      const tr = document.createElement('tr');
      const isSubmitted = s.status === 'submitted';
      tr.innerHTML = `
        <td class="font-mono text-muted text-sm">${s.session_id}</td>
        <td class="font-semibold">${s.session_title}</td>
        <td class="font-mono">${s.session_date}</td>
        <td class="text-center">
          <span class="scope-badge">${s.branch_scope === 'ALL' ? 'ทุกสาขา' : s.branch_scope}</span>
        </td>
        <td class="text-center">
          <span class="status-badge ${isSubmitted ? 'status-present' : 'status-late'}">
            ${isSubmitted ? 'ส่งผลแล้ว' : 'แบบร่าง'}
          </span>
        </td>
        <td class="text-center">
          <button class="btn-sm btn-outline" onclick="App.openSessionInAttendance('${s.session_id}')">
            เปิดเช็ค/ดู
          </button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  },

  exportToCSV() {
    const table = document.getElementById('admin-summary-table');
    if (!table) return;

    let csvContent = '\uFEFF'; // UTF-8 BOM
    const rows = table.querySelectorAll('tr');

    rows.forEach(row => {
      const cols = row.querySelectorAll('th, td');
      const rowData = [];
      cols.forEach(col => {
        let text = col.innerText.replace(/(\r\n|\n|\r)/gm, ' ').trim();
        text = `"${text.replace(/"/g, '""')}"`;
        rowData.push(text);
      });
      csvContent += rowData.join(',') + '\r\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `สรุปการเช็คชื่อสโมสรนักศึกษา_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

window.Dashboard = Dashboard;
