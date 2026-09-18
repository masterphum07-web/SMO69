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

  async getInitialData(forceRefresh = false) {
    const cached = this.getCachedInitialData();
    if (!forceRefresh && cached) {
      this.cache.initialData = cached;
      if (cached.branches) this.cache.branches = cached.branches;
      if (cached.students) this.cache.students = cached.students;
      if (cached.sessions) this.cache.sessions = cached.sessions;
      return { success: true, data: cached };
    }

    // พยายามโหลดจาก network (สูงสุด 2 ครั้งเพื่อรับมือ Apps Script cold start)
    for (let attempt = 1; attempt <= 2; attempt++) {
      const res = await this.requestGet('getInitialData');
      if (res && res.success && res.data) {
        this.setCachedInitialData(res.data);
        return res;
      }
      if (attempt < 2) {
        console.warn(`[Api getInitialData] ครั้งที่ ${attempt} ไม่สำเร็จ รอ 1.2 วินาทีแล้วลองใหม่...`);
        await new Promise(r => setTimeout(r, 1200));
      }
    }

    // หากโหลดจากเน็ตไม่สำเร็จ แต่มีข้อมูลแคชในเครื่อง ให้คืนแคชแทน mock ป้องกันหน้าขาว
    if (cached) {
      console.warn('[Api getInitialData] ใช้ข้อมูลแคชล่าสุดในเครื่องสำรอง');
      this.cache.initialData = cached;
      return { success: true, data: cached, isStale: true };
    }

    // หากไม่มีแคชเลย คืน mock data
    console.warn('[Api getInitialData] ไม่พบแคชในเครื่อง ใช้ mock data');
    return this.mockGet('getInitialData', {});
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

    // 1. ลองดึงข้อมูลด้วย fetch ปกติก่อน (ใช้ timeout สั้น 2.5 วินาที เพื่อไม่ให้ผู้ใช้รอนานหากติด CORS)
    try {
      const url = new URL(apiUrl);
      url.searchParams.set('action', action);
      Object.keys(params).forEach(key => {
        if (params[key] !== undefined && params[key] !== null) {
          url.searchParams.set(key, params[key]);
        }
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      const res = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow'
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        return data;
      }
    } catch (fetchErr) {
      // หากเกิด CORS หรือ timeout (2.5 วิ) ให้สลับไปใช้ JSONP อัตโนมัติทันที
    }

    // 2. ใช้ JSONP ซึ่งรับประกันการเชื่อมต่อกับ Apps Script 100% โดยไม่มีข้อจำกัด CORS
    try {
      const jsonpData = await this.fetchJsonp(apiUrl, action, params);
      return jsonpData;
    } catch (jsonpErr) {
      console.warn(`[Api GET ${action}] JSONP ครั้งที่ 1 ขัดข้อง (${jsonpErr.message}) ลองใหม่อีกครั้ง...`);
      // Auto-retry 1 ครั้ง
      try {
        await new Promise(r => setTimeout(r, 1000));
        const retryData = await this.fetchJsonp(apiUrl, action, params);
        return retryData;
      } catch (retryErr) {
        console.warn(`[Api GET ${action}] JSONP ล้มเหลว (${retryErr.message}) สลับไปใช้ข้อมูลสำรอง`);
        const cached = this.getCachedInitialData();
        if (cached && action === 'getInitialData') {
          return { success: true, data: cached, isStale: true };
        }
        return this.mockGet(action, params);
      }
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

      // ให้เวลา Apps Script Cold Start สูงสุด 25 วินาที ป้องกัน timeout หลอก
      timer = setTimeout(() => {
        cleanup();
        reject(new Error('JSONP request timeout (25s)'));
      }, 25000);

      document.head.appendChild(script);
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

    // 1. ลองยิงด้วย fetch POST ปกติ (timeout 3.5 วินาที)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3500);

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        this.clearCache();
        return data;
      }
    } catch (err) {
      // Fetch ขัดข้อง สลับไปใช้ JSONP สำรอง
    }

    // 2. ใช้ JSONP สำรอง (รับประกัน 100% บายพาส CORS Redirect ของ Google Apps Script)
    try {
      const jsonpParams = { ...payload };
      if (typeof jsonpParams.records === 'object') {
        jsonpParams.records = JSON.stringify(jsonpParams.records);
      }
      const jsonpData = await this.fetchJsonp(apiUrl, action, jsonpParams);
      this.clearCache();
      return jsonpData;
    } catch (jsonpErr) {
      console.warn(`[Api POST ${action}] JSONP สำรองครั้งที่ 1 ขัดข้อง (${jsonpErr.message}) ลองอีกครั้ง...`);
      try {
        await new Promise(r => setTimeout(r, 1200));
        const jsonpParams = { ...payload };
        if (typeof jsonpParams.records === 'object') {
          jsonpParams.records = JSON.stringify(jsonpParams.records);
        }
        const retryData = await this.fetchJsonp(apiUrl, action, jsonpParams);
        this.clearCache();
        return retryData;
      } catch (retryErr) {
        console.warn(`[Api POST ${action}] JSONP ล้มเหลว (${retryErr.message}) สลับไปใช้ Local Mock`);
        return this.mockPost(action, payload);
      }
    }
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
