/**
 * UI Feedback System: Toast & AppModal
 * ระบบแจ้งเตือน (Toast) และกล่องยืนยัน (Confirmation / Alert Modal)
 * ดีไซน์หรูหรา สวยงาม ตามธีมทางการ Royal Navy & Imperial Gold
 * ทดแทน window.alert() และ window.confirm() ของเบราว์เซอร์ 100%
 * ป้องกันปัญหาปุ่ม "ระงับกล่องโต้ตอบ" (Suppress Dialogs) บน iPad / Safari / Chrome
 */

(function(window) {
  'use strict';

  /* =========================================================================
   * 1. TOAST NOTIFICATION SYSTEM
   * ========================================================================= */
  const Toast = {
    container: null,

    _getContainer() {
      const isAttached = this.container && (typeof document.body.contains === 'function' ? document.body.contains(this.container) : true);
      if (!this.container || !isAttached) {
        let el = document.getElementById('smo-toast-container');
        if (!el) {
          el = document.createElement('div');
          el.id = 'smo-toast-container';
          el.className = 'smo-toast-container';
          document.body.appendChild(el);
        }
        this.container = el;
      }
      return this.container;
    },

    /**
     * แสดง Toast Notification
     * @param {string} message - ข้อความ
     * @param {'success'|'error'|'warning'|'info'|'loading'} type - ประเภท
     * @param {number} duration - ระยะเวลาแสดงผล (ms), ใส่ 0 หากต้องการให้ค้างไว้
     * @returns {{ id: string, dismiss: Function, update: Function }}
     */
    show(message, type = 'info', duration = 3500) {
      const container = this._getContainer();
      const toastId = 'toast_' + Math.random().toString(36).substr(2, 9);

      const toast = document.createElement('div');
      toast.id = toastId;
      toast.className = `smo-toast-item toast-${type}`;

      const iconMap = {
        success: '✓',
        error: '✕',
        warning: '⚠️',
        info: 'ℹ️',
        loading: '<span class="smo-toast-spinner"></span>'
      };

      const titleMap = {
        success: 'สำเร็จ',
        error: 'เกิดข้อผิดพลาด',
        warning: 'แจ้งเตือน',
        info: 'ข้อมูล',
        loading: 'กำลังดำเนินการ'
      };

      toast.innerHTML = `
        <div class="smo-toast-icon-badge">${iconMap[type] || 'ℹ️'}</div>
        <div class="smo-toast-content">
          <div class="smo-toast-title">${titleMap[type] || ''}</div>
          <div class="smo-toast-message">${message}</div>
        </div>
        ${type !== 'loading' ? '<button type="button" class="smo-toast-close" title="ปิด">&times;</button>' : ''}
      `;

      let timer = null;

      const dismiss = () => {
        if (timer) clearTimeout(timer);
        toast.classList.add('smo-toast-fadeout');
        setTimeout(() => {
          if (toast.parentNode) toast.parentNode.removeChild(toast);
        }, 250);
      };

      const update = ({ message: newMsg, type: newType, duration: newDur = 3500 }) => {
        if (timer) clearTimeout(timer);
        if (newType) {
          toast.className = `smo-toast-item toast-${newType}`;
          const iconEl = toast.querySelector('.smo-toast-icon-badge');
          if (iconEl) iconEl.innerHTML = iconMap[newType] || 'ℹ️';
          const titleEl = toast.querySelector('.smo-toast-title');
          if (titleEl) titleEl.textContent = titleMap[newType] || '';
        }
        if (newMsg) {
          const msgEl = toast.querySelector('.smo-toast-message');
          if (msgEl) msgEl.innerHTML = newMsg;
        }

        // Add close button if not present and no longer loading
        if (newType !== 'loading' && !toast.querySelector('.smo-toast-close')) {
          const closeBtn = document.createElement('button');
          closeBtn.type = 'button';
          closeBtn.className = 'smo-toast-close';
          closeBtn.title = 'ปิด';
          closeBtn.innerHTML = '&times;';
          closeBtn.onclick = (e) => { e.stopPropagation(); dismiss(); };
          toast.appendChild(closeBtn);
        }

        if (newDur > 0) {
          timer = setTimeout(dismiss, newDur);
        }
      };

      const closeBtn = toast.querySelector('.smo-toast-close');
      if (closeBtn) {
        closeBtn.onclick = (e) => {
          e.stopPropagation();
          dismiss();
        };
      }

      container.appendChild(toast);

      if (duration > 0) {
        timer = setTimeout(dismiss, duration);
      }

      return { id: toastId, dismiss, update };
    },

    success(message, duration = 3500) {
      return this.show(message, 'success', duration);
    },

    error(message, duration = 5000) {
      return this.show(message, 'error', duration);
    },

    warning(message, duration = 4000) {
      return this.show(message, 'warning', duration);
    },

    info(message, duration = 3500) {
      return this.show(message, 'info', duration);
    },

    loading(message) {
      return this.show(message, 'loading', 0);
    }
  };


  /* =========================================================================
   * 2. APP MODAL SYSTEM (Custom in-app Alert & Confirm)
   * ========================================================================= */
  const AppModal = {
    overlay: null,

    _getOverlay() {
      const isAttached = this.overlay && (typeof document.body.contains === 'function' ? document.body.contains(this.overlay) : true);
      if (!this.overlay || !isAttached) {
        let el = document.getElementById('smo-app-modal-overlay');
        if (!el) {
          el = document.createElement('div');
          el.id = 'smo-app-modal-overlay';
          el.className = 'smo-modal-overlay';
          document.body.appendChild(el);
        }
        this.overlay = el;
      }
      return this.overlay;
    },

    _formatMessage(text) {
      if (!text) return '';
      // แปลงขึ้นบรรทัดใหม่เป็น <br> และเน้นจุดสำคัญ
      const lines = String(text).split('\n');
      return lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '<div class="smo-modal-spacer"></div>';
        if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
          return `<div class="smo-modal-bullet">${line}</div>`;
        }
        return `<div>${line}</div>`;
      }).join('');
    },

    /**
     * แสดงกล่องข้อความยืนยัน (Confirm Dialog) คืนค่าเป็น Promise<boolean>
     * @param {Object} options
     * @param {string} options.title - หัวข้อกล่องข้อความ
     * @param {string} options.message - เนื้อหาข้อความ
     * @param {string} [options.confirmText='ตกลง'] - ข้อความปุ่มยืนยัน
     * @param {string} [options.cancelText='ยกเลิก'] - ข้อความปุ่มยกเลิก
     * @param {'warning'|'danger'|'primary'|'info'|'success'} [options.type='warning'] - ประเภทกล่อง
     * @returns {Promise<boolean>}
     */
    confirm(options = {}) {
      return new Promise((resolve) => {
        const {
          title = 'ยืนยันการดำเนินการ',
          message = '',
          confirmText = 'ตกลง',
          cancelText = 'ยกเลิก',
          type = 'warning'
        } = options;

        const overlay = this._getOverlay();

        const iconConfig = {
          warning: { icon: '⚠️', bg: '#FEF3C7', color: '#B45309' },
          danger:  { icon: '🗑️', bg: '#FEE2E2', color: '#DC2626' },
          primary: { icon: '📋', bg: '#EEF2FF', color: '#0F2F57' },
          info:    { icon: 'ℹ️', bg: '#EEF2FF', color: '#1E3A8A' },
          success: { icon: '✓',  bg: '#DCFCE7', color: '#15803D' }
        }[type] || { icon: '⚠️', bg: '#FEF3C7', color: '#B45309' };

        const btnClassMap = {
          warning: 'smo-modal-btn-warning',
          danger:  'smo-modal-btn-danger',
          primary: 'smo-modal-btn-primary',
          info:    'smo-modal-btn-primary',
          success: 'smo-modal-btn-success'
        };

        const formattedBody = this._formatMessage(message);

        overlay.innerHTML = `
          <div class="smo-modal-box" role="dialog" aria-modal="true">
            <div class="smo-modal-header">
              <div class="smo-modal-icon-badge" style="background-color: ${iconConfig.bg}; color: ${iconConfig.color};">
                ${iconConfig.icon}
              </div>
              <div class="smo-modal-title-group">
                <h3 class="smo-modal-title">${title}</h3>
                <div class="smo-modal-subtitle">ระบบเช็คชื่อ สโมสรนักศึกษา วทก. ปี 69</div>
              </div>
              <button type="button" class="smo-modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="smo-modal-body">
              ${formattedBody}
            </div>
            <div class="smo-modal-actions">
              <button type="button" class="smo-modal-btn-cancel">${cancelText}</button>
              <button type="button" class="smo-modal-btn-confirm ${btnClassMap[type] || 'smo-modal-btn-primary'}">${confirmText}</button>
            </div>
          </div>
        `;

        overlay.classList.add('open');

        const box = overlay.querySelector('.smo-modal-box');
        const confirmBtn = overlay.querySelector('.smo-modal-btn-confirm');
        const cancelBtn = overlay.querySelector('.smo-modal-btn-cancel');
        const closeBtn = overlay.querySelector('.smo-modal-close');

        const cleanup = (result) => {
          document.removeEventListener('keydown', handleKeyDown);
          overlay.classList.remove('open');
          setTimeout(() => {
            overlay.innerHTML = '';
          }, 200);
          resolve(result);
        };

        const handleKeyDown = (e) => {
          if (e.key === 'Escape') {
            e.preventDefault();
            cleanup(false);
          } else if (e.key === 'Enter' && document.activeElement !== cancelBtn) {
            e.preventDefault();
            cleanup(true);
          }
        };

        document.addEventListener('keydown', handleKeyDown);

        if (confirmBtn) confirmBtn.onclick = () => cleanup(true);
        if (cancelBtn) cancelBtn.onclick = () => cleanup(false);
        if (closeBtn) closeBtn.onclick = () => cleanup(false);

        overlay.onclick = (e) => {
          if (e.target === overlay) cleanup(false);
        };

        if (confirmBtn) confirmBtn.focus();
      });
    },

    /**
     * แสดงกล่องข้อความแจ้งเตือน (Alert Dialog) คืนค่าเป็น Promise<void>
     * @param {Object} options
     * @param {string} options.title - หัวข้อกล่องข้อความ
     * @param {string} options.message - เนื้อหาข้อความ
     * @param {string} [options.okText='ตกลง'] - ข้อความปุ่มตกลง
     * @param {'info'|'success'|'warning'|'error'} [options.type='info'] - ประเภท
     * @returns {Promise<void>}
     */
    alert(options = {}) {
      return new Promise((resolve) => {
        let title = 'แจ้งเตือน';
        let message = '';
        let okText = 'ตกลง';
        let type = 'info';

        if (typeof options === 'string') {
          message = options;
        } else if (options && typeof options === 'object') {
          title = options.title || 'แจ้งเตือน';
          message = options.message || '';
          okText = options.okText || 'ตกลง';
          type = options.type || 'info';
        }

        const overlay = this._getOverlay();

        const iconConfig = {
          success: { icon: '✓',  bg: '#DCFCE7', color: '#15803D' },
          error:   { icon: '✕',  bg: '#FEE2E2', color: '#DC2626' },
          warning: { icon: '⚠️', bg: '#FEF3C7', color: '#B45309' },
          info:    { icon: 'ℹ️', bg: '#EEF2FF', color: '#0F2F57' }
        }[type] || { icon: 'ℹ️', bg: '#EEF2FF', color: '#0F2F57' };

        const btnClassMap = {
          success: 'smo-modal-btn-success',
          error:   'smo-modal-btn-danger',
          warning: 'smo-modal-btn-warning',
          info:    'smo-modal-btn-primary'
        };

        const formattedBody = this._formatMessage(message);

        overlay.innerHTML = `
          <div class="smo-modal-box" role="dialog" aria-modal="true">
            <div class="smo-modal-header">
              <div class="smo-modal-icon-badge" style="background-color: ${iconConfig.bg}; color: ${iconConfig.color};">
                ${iconConfig.icon}
              </div>
              <div class="smo-modal-title-group">
                <h3 class="smo-modal-title">${title}</h3>
                <div class="smo-modal-subtitle">ระบบเช็คชื่อ สโมสรนักศึกษา วทก. ปี 69</div>
              </div>
              <button type="button" class="smo-modal-close" aria-label="Close">&times;</button>
            </div>
            <div class="smo-modal-body">
              ${formattedBody}
            </div>
            <div class="smo-modal-actions" style="justify-content: flex-end;">
              <button type="button" class="smo-modal-btn-confirm ${btnClassMap[type] || 'smo-modal-btn-primary'}" style="min-width: 110px;">${okText}</button>
            </div>
          </div>
        `;

        overlay.classList.add('open');

        const okBtn = overlay.querySelector('.smo-modal-btn-confirm');
        const closeBtn = overlay.querySelector('.smo-modal-close');

        const cleanup = () => {
          document.removeEventListener('keydown', handleKeyDown);
          overlay.classList.remove('open');
          setTimeout(() => {
            overlay.innerHTML = '';
          }, 200);
          resolve();
        };

        const handleKeyDown = (e) => {
          if (e.key === 'Escape' || e.key === 'Enter') {
            e.preventDefault();
            cleanup();
          }
        };

        document.addEventListener('keydown', handleKeyDown);

        if (okBtn) okBtn.onclick = cleanup;
        if (closeBtn) closeBtn.onclick = cleanup;

        overlay.onclick = (e) => {
          if (e.target === overlay) cleanup();
        };

        if (okBtn) okBtn.focus();
      });
    }
  };

  // Export to window
  window.Toast = Toast;
  window.AppModal = AppModal;

  // Polyfill / Safety Net:
  // หากมีโค้ดส่วนไหนหลงเรียก window.alert หรือ window.confirm แบบเดิม ให้แปลงเป็น Toast สวยๆ อัตโนมัติ
  // ป้องกันเบราว์เซอร์เด้ง Native Alert/Confirm สีเทา และตัดปัญหาผู้ใช้กด "ระงับกล่องโต้ตอบ" 100%
  window.alert = function(msg) {
    Toast.show(String(msg), 'info', 4500);
  };

  window.confirm = function(msg) {
    console.warn('[Safety Net] native confirm() intercepted to prevent browser dialog suppression. Use AppModal.confirm instead.');
    Toast.warning(String(msg), 4000);
    return true;
  };

})(window);

