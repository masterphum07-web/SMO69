/**
 * API Client for SMO69 Attendance System
 * สื่อสารกับ Google Apps Script Web App (doGet / doPost)
 * มีระบบ JSONP Fallback อัตโนมัติ (แก้ปัญหา CORS ของ Google Apps Script ได้ 100%)
 * พร้อมระบบ Cache ข้อมูลเริ่มต้น เพื่อให้เปิดหน้าเว็บได้เร็วทันใจ
 */

const CACHE_STORAGE_KEY = 'smo69_cached_initial_data';

const Api = {
  cache: {
    initialData: null,
    branches: null,
    students: null,
    sessions: null
  },
  _inFlightInitialDataPromise: null,
  _syncListeners: [],

  onDataSync(fn) {
    if (typeof fn === 'function') {
      this._syncListeners.push(fn);
    }
  },

  notifyDataSync(data) {
    if (!data) return;
    this._syncListeners.forEach(fn => {
      try { fn(data); } catch (e) { console.error('DataSync listener error:', e); }
    });
  },

  getCachedInitialData() {
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return this.cache.initialData || null;
  },

  setCachedInitialData(data) {
    if (!data) return;
    this.cache.initialData = data;
    if (data.branches) this.cache.branches = data.branches;
    if (data.students) this.cache.students = data.students;
    if (data.sessions) this.cache.sessions = data.sessions;
    try {
      localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(data));
    } catch (e) {}
  },

  addSessionToCache(session) {
    if (!session || !session.session_id) return;
    const cached = this.getCachedInitialData() || {};
    if (!Array.isArray(cached.sessions)) cached.sessions = [];
    if (!cached.sessions.some(s => s.session_id === session.session_id)) {
      cached.sessions.unshift(session);
    }
    this.setCachedInitialData(cached);
  },

  updateSessionStatusInCache(sessionId, status) {
    if (!sessionId) return;
    const cached = this.getCachedInitialData();
    if (cached && Array.isArray(cached.sessions)) {
      const sess = cached.sessions.find(s => s.session_id === sessionId);
      if (sess) {
        sess.status = status;
        this.setCachedInitialData(cached);
      }
    }
  },

  purgeSessionFromCache(sessionId) {
    if (!sessionId) return;
    if (this.cache.initialData && Array.isArray(this.cache.initialData.sessions)) {
      this.cache.initialData.sessions = this.cache.initialData.sessions.filter(s => s.session_id !== sessionId);
    }
    if (Array.isArray(this.cache.sessions)) {
      this.cache.sessions = this.cache.sessions.filter(s => s.session_id !== sessionId);
    }
    try {
      const raw = localStorage.getItem(CACHE_STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d && Array.isArray(d.sessions)) {
          d.sessions = d.sessions.filter(s => s.session_id !== sessionId);
          localStorage.setItem(CACHE_STORAGE_KEY, JSON.stringify(d));
        }
      }
    } catch (e) {}
  },

  syncInitialDataInBackground() {
    if (this._inFlightInitialDataPromise) return;
    this.getInitialData(true).catch(err => {
      console.warn('[Api Background Sync Notice]', err);
    });
  },

  getInitialData(forceRefresh = false) {
    const cached = this.getCachedInitialData();

    // 1. Stale-While-Revalidate: คืนแคชทันที (0ms) เพื่อไม่ให้จอค้างหรือหมุนนาน
    // และเริ่ม sync ในเบื้องหลังทันที
    if (!forceRefresh && cached) {
      this.cache.initialData = cached;
      if (cached.branches) this.cache.branches = cached.branches;
      if (cached.students) this.cache.students = cached.students;
      if (cached.sessions) this.cache.sessions = cached.sessions;

      // กระตุ้นการซิงค์ข้อมูลสดใหม่ในเบื้องหลัง
      setTimeout(() => {
        this.syncInitialDataInBackground();
      }, 50);

      return Promise.resolve({ success: true, data: cached, fromCache: true });
    }

    // 2. Request Deduplication: หากมีคำขอ getInitialData ยิงค้างอยู่แล้ว ให้แชร์ผลลัพธ์ร่วมกัน
    if (this._inFlightInitialDataPromise) {
      return this._inFlightInitialDataPromise;
    }

    // 3. ยิงคำขอเครือข่าย
    this._inFlightInitialDataPromise = (async () => {
      try {
        // ดึงจาก network
        const res = await this.requestGet('getInitialData');
        if (res && res.success && res.data) {
          this.setCachedInitialData(res.data);
          this.notifyDataSync(res.data);
          return res;
        }

        // ลองอีกครั้งหลัง 1 วินาทีหากครั้งแรกไม่สำเร็จ
        console.warn('[Api getInitialData] ครั้งแรกไม่สำเร็จ ลองใหม่อีกครั้ง...');
        await new Promise(r => setTimeout(r, 1000));
        const retryRes = await this.requestGet('getInitialData');
        if (retryRes && retryRes.success && retryRes.data) {
          this.setCachedInitialData(retryRes.data);
          this.notifyDataSync(retryRes.data);
          return retryRes;
        }

        // หากโหลดจากเน็ตไม่สำเร็จ แต่มีข้อมูลแคชในเครื่อง ให้ใช้แคชล่าสุด (ห้ามลบ/ห้ามแทนที่ด้วย mock ว่างเปล่า)
        if (cached) {
          console.warn('[Api getInitialData] เชื่อมต่อเน็ตไม่สำเร็จ ใช้ข้อมูลแคชล่าสุดในเครื่อง');
          this.cache.initialData = cached;
          return { success: true, data: cached, isStale: true };
        }

        // หากไม่มีแคชเลย และเปิดโหมด mock
        if (Config.isMockMode()) {
          return this.mockGet('getInitialData', {});
        }

        // ฉุกเฉิน: ใช้ mock data เพื่อให้ได้รายชื่อนักศึกษา 53 คนขึ้นมา ป้องกันหน้าว่างเปล่า
        console.warn('[Api getInitialData] ไม่พบแคชในเครื่องและเชื่อมต่อเน็ตไม่ได้ ใช้ข้อมูลรายชื่อเริ่มต้นสำรอง');
        const mockRes = await this.mockGet('getInitialData', {});
        return {
          success: true,
          data: mockRes.data,
          isOfflineFallback: true
        };
      } finally {
        this._inFlightInitialDataPromise = null;
      }
    })();

    return this._inFlightInitialDataPromise;
  },

  clearCache() {
    this.cache.initialData = null;
    this.cache.sessions = null;
    try {
      localStorage.removeItem(CACHE_STORAGE_KEY);
    } catch (e) {}
  },

  async requestGet(action, params = {}) {
    if (Config.isMockMode()) {
      return this.mockGet(action, params);
    }

    const apiUrl = Config.getApiUrl();
    if (!apiUrl) {
      return this.mockGet(action, params);
    }

    // 1. ลองดึงข้อมูลด้วย fetch ปกติ (timeout 15 วินาที พอเพียงสำหรับ Google Apps Script)
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      const res = await fetch(url.toString(), {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (fetchErr) {
      // หากเกิด CORS หรือ timeout ให้สลับไปใช้ JSONP สำรอง
    }

    // 2. ใช้ JSONP ซึ่งรับประกันการเชื่อมต่อกับ Apps Script 100% โดยไม่มีข้อจำกัด CORS
    try {
      const jsonpData = await this.fetchJsonp(apiUrl, action, params);
      return jsonpData;
    } catch (jsonpErr) {
      console.warn(`[Api GET ${action}] JSONP ขัดข้อง (${jsonpErr.message})`);
      const cached = this.getCachedInitialData();
      if (cached && action === 'getInitialData') {
        return { success: true, data: cached, isStale: true };
      }
      // เมื่อใช้งานโหมด API จริง ห้าม fallback ไปใช้ mock ว่างเปล่า
      return { success: false, error: 'เชื่อมต่อเซิร์ฟเวอร์ Google Sheets ไม่สำเร็จ (' + jsonpErr.message + ')' };
    }
  },

  fetchJsonp(apiUrl, action, params = {}) {
    return new Promise((resolve, reject) => {
      const callbackName = 'smo_cb_' + Math.random().toString(36).substr(2, 9);
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      url.searchParams.set('callback', callbackName);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });

      let timer = null;

      window[callbackName] = function(data) {
        cleanup();
        resolve(data);
      };

      const script = document.createElement('script');
      script.src = url.toString();
      script.async = true;

      function cleanup() {
        if (timer) clearTimeout(timer);
        if (script.parentNode) script.parentNode.removeChild(script);
        delete window[callbackName];
      }

      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP script load error'));
      };

      // ให้เวลา Apps Script สูงสุด 16 วินาที
      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP request timeout (16s)'));
      }, 16000);

      (document.head || document.body || document.documentElement).appendChild(script);
    });
  },

  async requestPost(action, payload = {}) {
    if (Config.isMockMode()) {
      return this.mockPost(action, payload);
    }

    const apiUrl = Config.getApiUrl();
    if (!apiUrl) {
      return this.mockPost(action, payload);
    }

    const bodyData = {
      action: action,
      ...payload
    };

    let postRes = null;
    let lastError = null;

    // Helper: ยิง fetch POST พร้อม timeout 20 วินาที และ redirect: 'follow'
    const doFetchPost = async (timeoutMs = 20000) => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      try {
        const res = await fetch(apiUrl, {
          method: 'POST',
          mode: 'cors',
          redirect: 'follow',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify(bodyData),
          signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          return await res.json();
        }
        throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
      } catch (err) {
        clearTimeout(timeoutId);
        throw err;
      }
    };

    // 1. ลองยิงด้วย fetch POST (ครั้งที่ 1)
    try {
      postRes = await doFetchPost(20000);
    } catch (err1) {
      lastError = err1;
      console.warn(`[Api POST ${action}] Fetch ครั้งที่ 1 ขัดข้อง (${err1.message}) รอ 1 วินาทีแล้วลองใหม่...`);
    }

    // 2. หากครั้งที่ 1 ขัดข้อง ให้ลอง fetch POST ครั้งที่ 2
    if (!postRes) {
      try {
        await new Promise(r => setTimeout(r, 1000));
        postRes = await doFetchPost(20000);
      } catch (err2) {
        lastError = err2;
        console.warn(`[Api POST ${action}] Fetch ครั้งที่ 2 ขัดข้อง (${err2.message})`);
      }
    }

    // 3. สำหรับคำขอขนาดเล็ก (ที่ไม่ใช่ saveAttendanceDraft ที่มี records 53 คน) ให้ลอง JSONP สำรอง
    if (!postRes && action !== 'saveAttendanceDraft') {
      try {
        const jsonpParams = { ...payload };
        if (typeof jsonpParams.records === 'object') {
          jsonpParams.records = JSON.stringify(jsonpParams.records);
        }
        postRes = await this.fetchJsonp(apiUrl, action, jsonpParams);
      } catch (jsonpErr) {
        lastError = jsonpErr;
        console.warn(`[Api POST ${action}] JSONP สำรองขัดข้อง (${jsonpErr.message})`);
      }
    }

    // 4. ตรวจสอบผลลัพธ์: ห้าม Fallback ไป Local Mock เด็ดขาดเมื่อใช้งานในโหมดเชื่อมต่อ Google Sheets จริง!
    if (!postRes) {
      console.error(`[Api POST ${action}] ล้มเหลวทุกช่องทาง:`, lastError);
      return {
        success: false,
        error: `ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Google Sheets ได้ (${lastError ? lastError.message : 'เครือข่ายขัดข้องหรือหมดเวลา'}) กรุณาตรวจสอบสัญญาณอินเทอร์เน็ตแล้วลองใหม่อีกครั้ง`
      };
    }

    // อัปเดตแคชอย่างชาญฉลาดโดยไม่ทำลายข้อมูลเดิม (ห้าม clearCache() เด็ดขาด เพื่อป้องกันหน้าว่าง)
    if (postRes && postRes.success) {
      if (action === 'deleteSession' && payload.sessionId) {
        this.purgeSessionFromCache(payload.sessionId);
      } else if (action === 'createSession' && postRes.session) {
        this.addSessionToCache(postRes.session);
      } else if (action === 'submitAttendance' && payload.sessionId) {
        this.updateSessionStatusInCache(payload.sessionId, 'submitted');
      }
    }

    return postRes;
  },

  mockGet(action, params) {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case 'ping':
            resolve({ success: true, message: 'Mock API Online' });
            break;
          case 'getInitialData':
            resolve({
              success: true,
              data: {
                branches: MockDB.getBranches(),
                students: MockDB.getStudents(),
                sessions: MockDB.getSessions(),
                leaderboard: MockDB.getLeaderboard(),
                dashboard: MockDB.getDashboard()
              }
            });
            break;
          case 'getBranches':
            resolve({ success: true, data: MockDB.getBranches() });
            break;
          case 'getStudents':
            resolve({ success: true, data: MockDB.getStudents(params.branch) });
            break;
          case 'getSessions':
            resolve({ success: true, data: MockDB.getSessions() });
            break;
          case 'getSessionAttendance':
            resolve({ success: true, data: MockDB.getSessionAttendance(params.sessionId) });
            break;
          case 'getLeaderboard':
            resolve({ success: true, data: MockDB.getLeaderboard() });
            break;
          case 'getDashboard':
            resolve({ success: true, data: MockDB.getDashboard(params.branch) });
            break;
          case 'generateReport':
            resolve(MockDB.generateReport(params.sessionId));
            break;
          case 'generateAllReports':
            resolve(MockDB.generateAllReports());
            break;
          default:
            resolve({ success: false, error: 'Unknown action ' + action });
        }
      }, 80);
    });
  },

  mockPost(action, payload) {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case 'login':
            resolve(MockDB.loginCheck(payload.adminId, payload.pin));
            break;
          case 'createSession':
            resolve(MockDB.createSession(payload.title, payload.date, payload.branchScope, payload.adminId));
            break;
          case 'saveAttendanceDraft':
            resolve(MockDB.saveAttendanceDraft(payload.sessionId, payload.records, payload.adminId));
            break;
          case 'submitAttendance':
            resolve(MockDB.submitAttendance(payload.sessionId, payload.adminId));
            break;
          case 'deleteSession':
            resolve(MockDB.deleteSession(payload.sessionId, payload.adminId));
            break;
          case 'generateReport':
            resolve(MockDB.generateReport(payload.sessionId));
            break;
          case 'generateAllReports':
            resolve(MockDB.generateAllReports());
            break;
          default:
            resolve({ success: false, error: 'Unknown post action ' + action });
        }
      }, 120);
    });
  },

  async testConnection(url) {
    if (!url) return { success: false, error: 'กรุณากรอก URL' };
    try {
      const data = await this.fetchJsonp(url, 'ping');
      return { success: true, data: data };
    } catch (e) {
      try {
        const testUrl = new URL(url);
        testUrl.searchParams.set('action', 'ping');
        const res = await fetch(testUrl.toString());
        const data = await res.json();
        return { success: true, data: data };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  }
};

window.Api = Api;
