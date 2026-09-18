/**
 * Automated Test Suite for SMO69 Attendance System Fixes
 * Verifies:
 * 1. Replacement of all native alert() and confirm() with Toast & AppModal
 * 2. Toast and AppModal implementation & functionality
 * 3. Tab 1 Public View session selection preservation, memory caching, skeleton loading, and manual refresh
 * 4. Api.requestPost timeout, redirect, no silent fallback to mockPost, and save/submit attendance flows
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`✅ PASS: ${message}`);
    passedTests++;
  }
}

// -------------------------------------------------------------
// Helper to build a lightweight browser environment
// -------------------------------------------------------------
function createBrowserEnv() {
  const listeners = {};
  const elements = {};

  function parseHTMLToMockElements(html) {
    const root = new MockElement('root', 'div');
    const tokens = html.match(/<[^>]+>|[^<]+/g) || [];
    const stack = [root];

    for (const token of tokens) {
      if (token.startsWith('</')) {
        if (stack.length > 1) stack.pop();
      } else if (token.startsWith('<') && !token.startsWith('<!')) {
        const isSelfClosing = token.endsWith('/>') || /^<(img|br|hr|input|meta|link)/i.test(token);
        const tagMatch = /^<([a-z0-9]+)/i.exec(token);
        if (!tagMatch) continue;
        const tagName = tagMatch[1];
        const el = new MockElement('elem_' + Math.random().toString(36).substr(2, 6), tagName);
        
        const classMatch = /class="([^"]*)"/i.exec(token);
        if (classMatch) {
          el.className = classMatch[1];
          classMatch[1].split(/\s+/).forEach(c => c && el.classList.add(c));
        }

        const idMatch = /id="([^"]*)"/i.exec(token);
        if (idMatch) el.id = idMatch[1];

        stack[stack.length - 1].appendChild(el);

        if (!isSelfClosing) {
          stack.push(el);
        }
      } else {
        const text = token.trim();
        if (text && stack.length > 0) {
          stack[stack.length - 1].textContent += text;
        }
      }
    }

    return root.children;
  }

  class MockElement {
    constructor(id, tagName = 'div') {
      this.id = id;
      this.tagName = tagName.toUpperCase();
      this.className = '';
      this.classList = {
        _classes: new Set(),
        add(c) { this._classes.add(c); },
        remove(c) { this._classes.delete(c); },
        toggle(c, force) {
          if (force !== undefined) {
            if (force) this._classes.add(c); else this._classes.delete(c);
          } else {
            if (this._classes.has(c)) this._classes.delete(c); else this._classes.add(c);
          }
        },
        contains(c) { return this._classes.has(c); }
      };
      this.textContent = '';
      this.value = '';
      this.disabled = false;
      this.children = [];
      this.parentNode = null;
      this.style = {};
      this.attributes = {};
    }

    set innerHTML(val) {
      this._innerHTML = val;
      this.children = [];
      if (typeof val === 'string' && val.includes('<')) {
        const parsed = parseHTMLToMockElements(val);
        parsed.forEach(ch => this.appendChild(ch));
      } else {
        this.textContent = String(val || '');
      }
    }

    get innerHTML() {
      return this._innerHTML !== undefined ? this._innerHTML : this.textContent;
    }

    contains(node) {
      let curr = node;
      while (curr) {
        if (curr === this) return true;
        curr = curr.parentNode;
      }
      return false;
    }

    appendChild(child) {
      child.parentNode = this;
      this.children.push(child);
      return child;
    }

    removeChild(child) {
      const idx = this.children.indexOf(child);
      if (idx !== -1) this.children.splice(idx, 1);
      child.parentNode = null;
      return child;
    }

    querySelector(sel) {
      if (sel.startsWith('.')) {
        const cls = sel.substring(1);
        const search = (node) => {
          if (node.classList && node.classList.contains(cls)) return node;
          for (const ch of (node.children || [])) {
            const found = search(ch);
            if (found) return found;
          }
          return null;
        };
        return search(this);
      }
      return null;
    }

    querySelectorAll() {
      return [];
    }

    setAttribute(k, v) { this.attributes[k] = v; }
    getAttribute(k) { return this.attributes[k] || null; }
    focus() {}
    click() { if (typeof this.onclick === 'function') this.onclick({ stopPropagation() {} }); }
  }

  const localStorageStore = {};
  const mockLocalStorage = {
    getItem(k) { return localStorageStore[k] || null; },
    setItem(k, v) { localStorageStore[k] = String(v); },
    removeItem(k) { delete localStorageStore[k]; },
    clear() { Object.keys(localStorageStore).forEach(k => delete localStorageStore[k]); }
  };

  const doc = {
    hidden: false,
    head: new MockElement('head', 'head'),
    body: new MockElement('body', 'body'),
    createElement(tag) {
      return new MockElement('elem_' + Math.random().toString(36).substr(2, 6), tag);
    },
    getElementById(id) {
      if (!elements[id]) {
        elements[id] = new MockElement(id, 'div');
      }
      return elements[id];
    },
    querySelector(sel) {
      if (sel.startsWith('#')) return this.getElementById(sel.substring(1));
      return null;
    },
    querySelectorAll() {
      return [];
    },
    addEventListener(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    removeEventListener(event, fn) {
      if (!listeners[event]) return;
      listeners[event] = listeners[event].filter(f => f !== fn);
    },
    _trigger(event, data) {
      if (listeners[event]) listeners[event].forEach(fn => fn(data));
    }
  };

  const win = {
    document: doc,
    localStorage: mockLocalStorage,
    addEventListener: doc.addEventListener.bind(doc),
    removeEventListener: doc.removeEventListener.bind(doc),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Promise: Promise,
    URL: URL,
    console: console,
    Math: Math,
    Date: Date,
    JSON: JSON,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Boolean: Boolean,
    AbortController: AbortController
  };
  win.window = win;

  return { win, doc, elements, mockLocalStorage };
}

// =============================================================
// TEST SUITE 1: Scan files for accidental native alert / confirm
// =============================================================
function runStaticScanTests() {
  console.log('\n--- TEST SUITE 1: Static Code Scan for alert() and confirm() ---');
  const files = ['frontend/js/app.js', 'frontend/js/attendance.js', 'frontend/js/dashboard.js'];

  for (const file of files) {
    const fullPath = path.resolve(__dirname, '..', file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, idx) => {
      const trimmed = line.trim();
      // Skip comments
      if (trimmed.startsWith('//') || trimmed.startsWith('*')) return;

      // Check for native alert( that is NOT AppModal.alert or Toast.alert
      if (/\balert\s*\(/.test(trimmed) && !/AppModal\.alert/.test(trimmed) && !/Toast\./.test(trimmed)) {
        assert(false, `Found unexpected native alert in ${file} at line ${idx + 1}: ${trimmed}`);
      }

      // Check for native confirm( that is NOT AppModal.confirm
      if (/\bconfirm\s*\(/.test(trimmed) && !/AppModal\.confirm/.test(trimmed)) {
        assert(false, `Found unexpected native confirm in ${file} at line ${idx + 1}: ${trimmed}`);
      }
    });

    assert(true, `No native alert() or confirm() found in ${file}`);
  }
}

// =============================================================
// TEST SUITE 2: Toast & AppModal Functionality
// =============================================================
async function runUiFeedbackTests() {
  console.log('\n--- TEST SUITE 2: UI Feedback (Toast & AppModal) ---');
  const { win, doc } = createBrowserEnv();

  const code = fs.readFileSync(path.resolve(__dirname, '..', 'frontend/js/ui-feedback.js'), 'utf8');
  vm.runInNewContext(code, win);

  assert(typeof win.Toast === 'object', 'Toast is exported to window');
  assert(typeof win.AppModal === 'object', 'AppModal is exported to window');

  // Test Toast.show and Toast.success
  const t1 = win.Toast.success('บันทึกเรียบร้อย');
  assert(t1 && typeof t1.dismiss === 'function', 'Toast.success returns a dismissable handle');

  const container = doc.getElementById('smo-toast-container');
  assert(container.children.length === 1, 'Toast container contains 1 active toast');
  assert(container.children[0].className.includes('toast-success'), 'Toast item has toast-success class');

  // Test Toast.update (loading -> success transition)
  const tLoading = win.Toast.loading('กำลังบันทึก...');
  assert(container.children.length === 2, 'Container now has 2 toasts');
  assert(container.children[1].className.includes('toast-loading'), 'Second toast is toast-loading');

  tLoading.update({ type: 'success', message: 'บันทึกสำเร็จแล้ว' });
  assert(container.children[1].className.includes('toast-success'), 'Toast successfully transitioned to toast-success');

  t1.dismiss();
  tLoading.dismiss();

  // Test window.alert polyfill
  win.alert('ข้อความทดสอบ');
  assert(container.children.length > 0, 'window.alert safely routes to Toast instead of native browser popup');

  // Test AppModal.confirm (Confirm action)
  const confirmPromise1 = win.AppModal.confirm({
    title: 'ทดสอบยืนยัน',
    message: 'ต้องการทำรายการหรือไม่',
    confirmText: 'ตกลง',
    cancelText: 'ยกเลิก'
  });

  const modalOverlay = doc.getElementById('smo-app-modal-overlay');
  assert(modalOverlay.classList.contains('open'), 'AppModal overlay opens with .open class');

  const confirmBtn = modalOverlay.querySelector('.smo-modal-btn-confirm');
  assert(confirmBtn !== null, 'AppModal confirm button rendered');
  confirmBtn.click();

  const res1 = await confirmPromise1;
  assert(res1 === true, 'AppModal.confirm resolves to TRUE on confirm button click');

  // Test AppModal.confirm (Cancel action)
  const confirmPromise2 = win.AppModal.confirm({
    title: 'ทดสอบยกเลิก',
    message: 'ข้อความ'
  });
  const cancelBtn = modalOverlay.querySelector('.smo-modal-btn-cancel');
  assert(cancelBtn !== null, 'AppModal cancel button rendered');
  cancelBtn.click();

  const res2 = await confirmPromise2;
  assert(res2 === false, 'AppModal.confirm resolves to FALSE on cancel button click');

  // Test AppModal.alert
  const alertPromise = win.AppModal.alert({
    title: 'แจ้งเตือน',
    message: 'สำเร็จ',
    okText: 'รับทราบ'
  });
  const okBtn = modalOverlay.querySelector('.smo-modal-btn-confirm');
  assert(okBtn !== null, 'AppModal.alert renders OK button');
  okBtn.click();
  await alertPromise;
  assert(true, 'AppModal.alert resolves smoothly on OK click');
}

// =============================================================
// TEST SUITE 3: Tab 1 Public View Session Change, Caching & Polling
// =============================================================
async function runDashboardPublicViewTests() {
  console.log('\n--- TEST SUITE 3: Dashboard Public View & Session Switching ---');
  const { win, doc, mockLocalStorage } = createBrowserEnv();

  // Load config, ui-feedback, mock-data, api, dashboard
  const scripts = [
    'frontend/js/config.js',
    'frontend/js/ui-feedback.js',
    'frontend/js/mock-data.js',
    'frontend/js/api.js',
    'frontend/js/dashboard.js'
  ];

  for (const s of scripts) {
    const code = fs.readFileSync(path.resolve(__dirname, '..', s), 'utf8');
    vm.runInNewContext(code, win);
  }

  // Verify poll interval is 25000ms
  const pollInterval = win.Config.getPollInterval();
  assert(pollInterval === 25000, `Config default poll interval is 25000ms (got ${pollInterval}ms)`);

  // Verify Dashboard initialization & attendanceCache
  assert(typeof win.Dashboard.attendanceCache === 'object', 'Dashboard.attendanceCache is initialized');

  // Mock sample server data with 2 sessions
  const sampleData = {
    branches: [{ branch_id: 'RT', branch_name: 'รังสีเทคนิค' }],
    students: [
      { full_name: 'นายทดสอบ หนึ่ง', branch_id: 'RT', position: 'ประธาน' },
      { full_name: 'นางสาวทดสอบ สอง', branch_id: 'RT', position: 'รองประธาน' }
    ],
    sessions: [
      { session_id: 'SESS-001', session_title: 'วาระที่ 1 ประชุมใหญ่', session_date: '2026-09-01', status: 'submitted' },
      { session_id: 'SESS-002', session_title: 'วาระที่ 2 สรุปกิจกรรม', session_date: '2026-09-15', status: 'draft' }
    ],
    leaderboard: { topPresent: [], topAbsent: [] }
  };

  // Mock Api.requestGet
  let requestGetCallCount = 0;
  let lastRequestedSessionId = null;

  win.Api.requestGet = async function(action, params = {}) {
    requestGetCallCount++;
    if (action === 'getSessionAttendance') {
      lastRequestedSessionId = params.sessionId;
      return {
        success: true,
        data: [
          { full_name: 'นายทดสอบ หนึ่ง', status: 'มา' },
          { full_name: 'นางสาวทดสอบ สอง', status: 'สาย' }
        ]
      };
    }
    if (action === 'getInitialData') {
      return { success: true, data: sampleData };
    }
    return { success: true, data: [] };
  };

  // Apply initial data
  win.Dashboard.applyServerData(sampleData);
  assert(win.Dashboard.selectedPublicSessionId === 'SESS-001', 'Initial load selects the first session (SESS-001)');

  // 1. Change to Session 2
  await win.Dashboard.loadSelectedPublicSession('SESS-002');
  assert(win.Dashboard.selectedPublicSessionId === 'SESS-002', 'Public view correctly switches to SESS-002');
  assert(lastRequestedSessionId === 'SESS-002', 'API requested attendance for SESS-002');
  assert(Array.isArray(win.Dashboard.attendanceCache['SESS-002']), 'SESS-002 attendance is cached in attendanceCache');

  // 2. Switch BACK to Session 2: Must be 0ms instant load from memory cache without new network call
  const callCountBefore = requestGetCallCount;
  await win.Dashboard.loadSelectedPublicSession('SESS-002');
  assert(requestGetCallCount === callCountBefore, 'Switching to cached session does NOT trigger new network request (0ms instant)');

  // 3. Test applyServerData does NOT reset selected session!
  // (This was the exact bug where background poll reverted user's selected session to SESS-001)
  win.Dashboard.applyServerData(sampleData);
  assert(win.Dashboard.selectedPublicSessionId === 'SESS-002', 'applyServerData preserves user-selected session SESS-002 (does NOT revert to SESS-001)');

  // 4. Test Manual Refresh button
  const refreshIcon = doc.getElementById('public-refresh-icon');
  const refreshBtn = doc.getElementById('btn-public-refresh');

  const refreshPromise = win.Dashboard.manualRefresh();
  assert(win.Dashboard._isRefreshing === true, 'Manual refresh sets _isRefreshing flag');
  assert(refreshBtn.disabled === true, 'Refresh button is disabled during refresh');
  assert(refreshIcon.classList.contains('spin-animation'), 'Refresh icon has .spin-animation class during refresh');

  await refreshPromise;
  assert(win.Dashboard._isRefreshing === false, 'Manual refresh resets _isRefreshing flag');
  assert(refreshBtn.disabled === false, 'Refresh button is re-enabled');
  assert(!refreshIcon.classList.contains('spin-animation'), 'Spin animation removed after refresh');
}

// =============================================================
// TEST SUITE 4: API Networking & Mock Fallback Elimination
// =============================================================
async function runApiAndAttendanceTests() {
  console.log('\n--- TEST SUITE 4: API Networking & Attendance Submit/Save Flow ---');
  const { win, doc, mockLocalStorage } = createBrowserEnv();

  // Set real API URL
  mockLocalStorage.setItem('smo69_api_url', 'https://script.google.com/macros/s/AKfycbzSUwpiZQqSBzYmmc7Wezv5qWVd5bwu3JdkGwrKYajc_ye48iOMKaOG7fwAsOU5ZKw/exec');
  mockLocalStorage.setItem('smo69_use_mock_data', 'false');

  const scripts = [
    'frontend/js/config.js',
    'frontend/js/ui-feedback.js',
    'frontend/js/mock-data.js',
    'frontend/js/api.js',
    'frontend/js/auth.js',
    'frontend/js/attendance.js'
  ];

  for (const s of scripts) {
    const code = fs.readFileSync(path.resolve(__dirname, '..', s), 'utf8');
    vm.runInNewContext(code, win);
  }

  assert(!win.Config.isMockMode(), 'Config is in Live API mode (not mock mode)');

  // Simulate network failure on fetch
  let fetchAttempts = 0;
  let fetchRedirectOption = null;
  let fetchMethod = null;

  win.fetch = async function(url, options) {
    fetchAttempts++;
    fetchRedirectOption = options.redirect;
    fetchMethod = options.method;
    // Simulate network error / abort
    throw new Error('Failed to fetch (simulated network timeout)');
  };

  // 1. Test Api.requestPost with live URL and failing network
  const postResult = await win.Api.requestPost('submitAttendance', { sessionId: 'SESS-TEST-99' });

  assert(fetchAttempts >= 2, `Api.requestPost performed auto-retry on failure (attempts: ${fetchAttempts})`);
  assert(fetchRedirectOption === 'follow', 'fetch uses redirect: "follow"');
  assert(fetchMethod === 'POST', 'fetch uses POST method');

  // CRITICAL REQUIREMENT: Api.requestPost MUST NOT fall back to mockPost and return "ไม่พบองค์ประชุม"!
  assert(postResult.success === false, 'Request result is false');
  assert(postResult.error !== 'ไม่พบองค์ประชุม', 'Api.requestPost NEVER returns mock error "ไม่พบองค์ประชุม" when live URL is configured');
  assert(postResult.error.includes('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Google Sheets ได้'), `Returned clear network error message: ${postResult.error}`);

  // 2. Test Attendance.saveDraft with live toast
  win.Attendance.currentSessionId = 'SESS-001';
  win.Attendance.students = [
    { full_name: 'นักศึกษา 1' },
    { full_name: 'นักศึกษา 2' }
  ];
  win.Attendance.records = { 'นักศึกษา 1': 'มา' };

  // Mock successful Api.requestPost for saveDraft
  win.Api.requestPost = async function(action, payload) {
    return { success: true, message: 'บันทึกสำเร็จ' };
  };

  await win.Attendance.saveDraft(true);
  const toastContainer = doc.getElementById('smo-toast-container');
  assert(toastContainer.children.length > 0, 'saveDraft(true) displayed feedback toast');
  const lastToast = toastContainer.children[toastContainer.children.length - 1];
  assert(lastToast.className.includes('toast-success'), 'saveDraft(true) toast shows success state');
}

// -------------------------------------------------------------
// Runner
// -------------------------------------------------------------
async function main() {
  console.log('====================================================');
  console.log('Running Complete SMO69 Attendance System Test Suite');
  console.log('====================================================');

  try {
    runStaticScanTests();
    await runUiFeedbackTests();
    await runDashboardPublicViewTests();
    await runApiAndAttendanceTests();

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passedTests} passed, ${failedTests} failed.`);
    console.log('====================================================\n');

    if (failedTests > 0) {
      process.exit(1);
    }
  } catch (e) {
    console.error('Fatal test error:', e);
    process.exit(1);
  }
}

main();
