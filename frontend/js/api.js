/**
 * API Client for SMO69 Attendance System
 * สื่อสารกับ Google Apps Script Web App (doGet / doPost)
 * และมีระบบ Fallback ไปยัง MockDB อัตโนมัติเมื่อยังไม่ได้ตั้ง URL หรือออฟไลน์
 */

const Api = {
  async requestGet(action, params = {}) {
    if (Config.isMockMode()) {
      return this.mockGet(action, params);
    }

    const apiUrl = Config.getApiUrl();
    if (!apiUrl) {
      return this.mockGet(action, params);
    }

    const url = new URL(apiUrl);
    url.searchParams.set('action', action);
    Object.keys(params).forEach(key => {
      if (params[key] !== undefined && params[key] !== null) {
        url.searchParams.set(key, params[key]);
      }
    });

    try {
      const res = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Accept': 'application/json' }
      });
      if (!res.ok) throw new Error('HTTP Status ' + res.status);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`[Api GET ${action}] เกิดข้อผิดพลาดในการเชื่อมต่อ Apps Script (${err.message}) สลับไปใช้ Mock data ชั่วคราว`);
      return this.mockGet(action, params);
    }
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

    try {
      // ใช้ text/plain เพื่อป้องกัน CORS preflight OPTIONS request
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(bodyData)
      });
      if (!res.ok) throw new Error('HTTP Status ' + res.status);
      const data = await res.json();
      return data;
    } catch (err) {
      console.warn(`[Api POST ${action}] ข้อผิดพลาด (${err.message}) บันทึกชั่วคราวใน Local Mock`);
      return this.mockPost(action, payload);
    }
  },

  mockGet(action, params) {
    return new Promise(resolve => {
      setTimeout(() => {
        switch (action) {
          case 'ping':
            resolve({ success: true, message: 'Mock API Online' });
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
      }, 100);
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
          default:
            resolve({ success: false, error: 'Unknown post action ' + action });
        }
      }, 150);
    });
  },

  // Ping ทดสอบ URL Apps Script
  async testConnection(url) {
    if (!url) return { success: false, error: 'กรุณากรอก URL' };
    try {
      const testUrl = new URL(url);
      testUrl.searchParams.set('action', 'ping');
      const res = await fetch(testUrl.toString());
      if (!res.ok) throw new Error('HTTP Status ' + res.status);
      const data = await res.json();
      return { success: true, data: data };
    } catch (e) {
      return { success: false, error: e.message };
    }
  }
};
