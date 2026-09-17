/**
 * Main Application Controller (SPA Router & Event Listeners)
 */

const App = {
  currentTab: 'public',

  async init() {
    this.bindEvents();
    this.updateAuthUI();
    this.updateConnectionStatusBadge();

    // ดึงข้อมูลภาพรวมระบบครั้งแรกเพียงครั้งเดียวเพื่อความเร็วสูงสุด
    await Api.getInitialData();

    // เริ่มต้นโมดูลต่าง ๆ
    await Dashboard.init();
    await Attendance.init();

    // แสดงแท็บแรก
    this.switchTab('public');
  },

  bindEvents() {
    // Navigation tabs
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        const target = e.currentTarget.getAttribute('data-tab');
        this.switchTab(target);
      });
    });

    // Login Form Submit
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = document.getElementById('login-admin-id').value;
        const pin = document.getElementById('login-pin').value;
        const errEl = document.getElementById('login-error-msg');
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'กำลังตรวจสอบ...';
        if (errEl) errEl.style.display = 'none';

        const res = await Auth.login(id, pin);
        submitBtn.disabled = false;
        submitBtn.textContent = 'เข้าสู่ระบบ';

        if (res.success) {
          this.closeModal('login-modal');
          this.updateAuthUI();
          alert(`ยินดีต้อนรับคุณ ${res.user.name} (${res.user.role === 'admin' ? 'แอดมิน' : 'ผู้เช็คชื่อ'})`);
          this.switchTab('attendance');
        } else {
          if (errEl) {
            errEl.textContent = res.error;
            errEl.style.display = 'block';
          }
        }
      });
    }

    // New Session Form Submit
    const newSessionForm = document.getElementById('new-session-form');
    if (newSessionForm) {
      newSessionForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('new-session-title').value.trim();
        const date = document.getElementById('new-session-date').value;
        const scope = document.getElementById('new-session-scope').value;

        if (!title || !date) {
          alert('กรุณากรอกชื่อหัวข้อและวันที่');
          return;
        }

        const submitBtn = newSessionForm.querySelector('button[type="submit"]');
        const origText = submitBtn ? submitBtn.textContent : '';
        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.textContent = '⏳ กำลังบันทึกองค์ประชุม...';
        }

        try {
          const success = await Attendance.createNewSession(title, date, scope);
          if (success) {
            this.closeModal('new-session-modal');
            newSessionForm.reset();
            // นำทางไปยังแท็บเช็คชื่อทันที
            this.switchTab('attendance');
          }
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = origText;
          }
        }
      });
    }

    // Settings Form Submit
    const settingsForm = document.getElementById('settings-form');
    if (settingsForm) {
      settingsForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const url = document.getElementById('setting-api-url').value;
        const useMock = document.getElementById('setting-mock-mode').checked;

        Config.setApiUrl(url);
        Config.setMockMode(useMock);

        this.updateConnectionStatusBadge();
        this.closeModal('settings-modal');
        alert('บันทึกการตั้งค่าเรียบร้อยแล้ว');
        window.location.reload();
      });
    }

    // Session Selector Change
    const sessSelect = document.getElementById('session-select');
    if (sessSelect) {
      sessSelect.addEventListener('change', (e) => {
        Attendance.loadSessionAttendance(e.target.value);
      });
    }

    // Attendance Search Input
    const searchInput = document.getElementById('attendance-search');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        Attendance.setSearchQuery(e.target.value);
      });
    }

    // Admin Branch Filter
    const adminBranchSelect = document.getElementById('admin-branch-filter');
    if (adminBranchSelect) {
      adminBranchSelect.addEventListener('change', (e) => {
        Dashboard.loadAdminDashboard(e.target.value);
      });
    }
  },

  switchTab(tabName) {
    if ((tabName === 'attendance' || tabName === 'admin') && !Auth.isLoggedIn()) {
      this.openLoginModal();
      return;
    }

    if (tabName === 'admin' && !Auth.isAdmin()) {
      alert('เฉพาะบัญชีระดับแอดมิน (Admin) เท่านั้นที่สามารถเข้าถึงส่วนนี้ได้');
      return;
    }

    this.currentTab = tabName;

    // Update Nav UI
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.classList.toggle('active', tab.getAttribute('data-tab') === tabName);
    });

    // Update Tab View
    document.querySelectorAll('.tab-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabName}`);
    });

    // Trigger loading data for specific tabs
    if (tabName === 'public') {
      Dashboard.loadPublicStats();
      Dashboard.startRealtimePolling();
    } else {
      Dashboard.stopRealtimePolling();
    }

    if (tabName === 'attendance') {
      Attendance.loadInitialData();
    }

    if (tabName === 'admin') {
      Dashboard.loadAdminDashboard();
    }
  },

  updateAuthUI() {
    const user = Auth.getUser();
    const guestBox = document.getElementById('auth-guest-box');
    const userBox = document.getElementById('auth-user-box');
    const userName = document.getElementById('auth-user-name');
    const userRole = document.getElementById('auth-user-role');
    const navAdminTab = document.getElementById('nav-tab-admin');
    const navAttendanceTab = document.getElementById('nav-tab-attendance');

    if (user) {
      if (guestBox) guestBox.style.display = 'none';
      if (userBox) userBox.style.display = 'flex';
      if (userName) userName.textContent = user.name || user.adminId;
      if (userRole) {
        userRole.textContent = user.role === 'admin' ? 'แอดมิน' : 'ผู้เช็คชื่อ';
        userRole.className = `role-badge ${user.role === 'admin' ? 'role-admin' : 'role-checker'}`;
      }
      if (navAttendanceTab) navAttendanceTab.classList.remove('locked');
      if (navAdminTab) {
        navAdminTab.style.display = user.role === 'admin' ? 'inline-flex' : 'none';
      }
    } else {
      if (guestBox) guestBox.style.display = 'flex';
      if (userBox) userBox.style.display = 'none';
      if (navAttendanceTab) navAttendanceTab.classList.add('locked');
      if (navAdminTab) navAdminTab.style.display = 'none';
    }
  },

  updateConnectionStatusBadge() {
    const badge = document.getElementById('api-status-badge');
    if (!badge) return;

    if (Config.isMockMode()) {
      badge.innerHTML = '<span class="status-indicator warning"></span> <span>โหมดจำลอง (Mock DB)</span>';
      badge.title = 'กำลังใช้งานฐานข้อมูลจำลองในเครื่อง คลิกเพื่อตั้งค่า Apps Script URL';
    } else {
      badge.innerHTML = '<span class="status-indicator success"></span> <span>เชื่อมต่อ Google Sheets</span>';
      badge.title = 'เชื่อมต่อ Google Apps Script Web App เรียบร้อย';
    }
  },

  openSessionInAttendance(sessionId) {
    Attendance.currentSessionId = sessionId;
    this.switchTab('attendance');
  },

  openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.add('open');
  },

  closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.classList.remove('open');
  },

  openLoginModal() {
    this.openModal('login-modal');
  },

  openSettingsModal() {
    const urlInput = document.getElementById('setting-api-url');
    const mockCheckbox = document.getElementById('setting-mock-mode');
    if (urlInput) urlInput.value = Config.getApiUrl();
    if (mockCheckbox) mockCheckbox.checked = Config.isMockMode();
    this.openModal('settings-modal');
  },

  openNewSessionModal() {
    const dateInput = document.getElementById('new-session-date');
    if (dateInput) {
      dateInput.value = new Date().toISOString().substring(0, 10);
    }
    this.openModal('new-session-modal');
  },

  async testApiUrl() {
    const url = document.getElementById('setting-api-url').value;
    const testResultEl = document.getElementById('test-api-result');
    if (!url) {
      alert('กรุณากรอก URL Web App ก่อนทดสอบ');
      return;
    }
    if (testResultEl) {
      testResultEl.textContent = 'กำลังทดสอบเชื่อมต่อ...';
      testResultEl.className = 'test-result text-muted';
    }

    const res = await Api.testConnection(url);
    if (res.success) {
      if (testResultEl) {
        testResultEl.textContent = '✓ เชื่อมต่อสำเร็จ! Apps Script ตอบกลับเรียบร้อย';
        testResultEl.className = 'test-result text-success';
      }
    } else {
      if (testResultEl) {
        testResultEl.textContent = '✕ การเชื่อมต่อล้มเหลว: ' + res.error;
        testResultEl.className = 'test-result text-danger';
      }
    }
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
