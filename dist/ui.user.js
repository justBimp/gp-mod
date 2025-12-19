// ==UserScript==
// @name         GarticPhone Mod - UI System
// @namespace    https://github.com/justBimp/gp-mod
// @version      1.0.0
// @author       justBimp
// @match        https://garticphone.com/*
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @resource     uiCSS https://justbimp.github.io/gp-mod/pub/css/ui.min.css
// @resource     icons https://justbimp.github.io/gp-mod/pub/css/icons.css
// @require      https://justbimp.github.io/gp-mod/pub/js/ui.core.js
// @run-at       document-end
// ==/UserScript==

'use strict';

class GPMODUI {
    constructor() {
        this.ui = null;
        this.currentTab = 'painter';
        this.isVisible = false;
        this.modules = {};
        
        this.init();
    }
    
    init() {
        // انتظار تحميل النظام الأساسي
        if (!window.GPMOD) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        console.log('🎨 Initializing GPMOD UI System');
        
        // تحميل الأنماط
        this.loadStyles();
        
        // إنشاء الواجهة
        this.createUI();
        
        // تسجيل الوحدة
        window.GPMOD?.registerModule?.('ui', this);
        
        // الاستماع للأحداث
        this.setupEventListeners();
        
        // إضافة زر التشغيل
        this.addLauncherButton();
    }
    
    loadStyles() {
        // تحميل CSS الأساسي
        const uiCSS = GM_getResourceText('uiCSS');
        GM_addStyle(uiCSS);
        
        // أنماط إضافية
        GM_addStyle(`
            .gpmod-container {
                position: fixed;
                top: 60px;
                right: 20px;
                width: 380px;
                background: rgba(20, 20, 30, 0.98);
                border: 2px solid #4cc9f0;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
                z-index: 100000;
                backdrop-filter: blur(15px);
                transition: all 0.3s ease;
                max-height: 80vh;
                display: none;
            }
            
            .gpmod-header {
                padding: 15px;
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                border-bottom: 1px solid #4cc9f0;
                border-radius: 13px 13px 0 0;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .gpmod-title {
                color: #4cc9f0;
                font-size: 1.4em;
                font-weight: bold;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .gpmod-tabs {
                display: flex;
                background: rgba(0, 0, 0, 0.3);
                padding: 5px;
                margin: 0 15px;
                border-radius: 10px;
            }
            
            .gpmod-tab {
                flex: 1;
                padding: 10px;
                background: transparent;
                border: none;
                color: #a0a0c0;
                border-radius: 8px;
                cursor: pointer;
                transition: all 0.3s;
                font-weight: 500;
            }
            
            .gpmod-tab.active {
                background: linear-gradient(45deg, #4cc9f0, #4361ee);
                color: white;
                box-shadow: 0 4px 15px rgba(76, 201, 240, 0.4);
            }
            
            .gpmod-content {
                padding: 20px;
                max-height: calc(80vh - 150px);
                overflow-y: auto;
            }
            
            .gpmod-section {
                margin-bottom: 25px;
                animation: fadeIn 0.3s ease;
            }
            
            .gpmod-control-group {
                margin: 15px 0;
            }
            
            .gpmod-control-label {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
                color: #b0b0d0;
            }
            
            .gpmod-control-value {
                color: #4cc9f0;
                font-weight: bold;
            }
            
            .gpmod-slider {
                width: 100%;
                height: 6px;
                border-radius: 3px;
                background: rgba(255, 255, 255, 0.1);
                outline: none;
                -webkit-appearance: none;
            }
            
            .gpmod-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                width: 20px;
                height: 20px;
                border-radius: 50%;
                background: #4cc9f0;
                cursor: pointer;
                box-shadow: 0 0 10px rgba(76, 201, 240, 0.8);
            }
            
            .gpmod-button {
                background: linear-gradient(45deg, #4cc9f0, #4361ee);
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 10px;
                cursor: pointer;
                font-weight: bold;
                transition: all 0.3s;
                width: 100%;
                margin: 5px 0;
            }
            
            .gpmod-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(67, 97, 238, 0.6);
            }
            
            .gpmod-shortcuts-grid {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin-top: 15px;
            }
            
            .gpmod-shortcut-item {
                background: rgba(255, 255, 255, 0.05);
                padding: 10px;
                border-radius: 8px;
                border-left: 3px solid #4cc9f0;
            }
            
            .gpmod-key {
                background: rgba(0, 0, 0, 0.3);
                padding: 3px 8px;
                border-radius: 5px;
                font-family: monospace;
                color: #4cc9f0;
                margin: 0 3px;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            /* زر التشغيل */
            #gpmod-launcher {
                position: fixed;
                top: 10px;
                right: 10px;
                z-index: 99999;
                background: linear-gradient(45deg, #4cc9f0, #4361ee);
                color: white;
                border: none;
                border-radius: 25px;
                padding: 10px 20px;
                font-weight: bold;
                cursor: pointer;
                box-shadow: 0 5px 15px rgba(76, 201, 240, 0.5);
                transition: all 0.3s;
            }
            
            #gpmod-launcher:hover {
                transform: scale(1.05);
                box-shadow: 0 8px 25px rgba(76, 201, 240, 0.7);
            }
        `);
    }
    
    createUI() {
        // إنشاء الحاوية الرئيسية
        this.ui = document.createElement('div');
        this.ui.className = 'gpmod-container';
        this.ui.id = 'gpmod-ui-container';
        
        // محتوى الواجهة
        this.ui.innerHTML = `
            <div class="gpmod-header">
                <div class="gpmod-title">
                    🎨 <span>GarticPhone MOD</span>
                    <small style="font-size: 0.7em; color: #a0a0c0;">v1.0.0</small>
                </div>
                <div>
                    <button class="gpmod-button" style="padding: 5px 15px;" onclick="document.getElementById('gpmod-ui-container').style.display='none'">
                        ✕
                    </button>
                </div>
            </div>
            
            <div class="gpmod-tabs">
                <button class="gpmod-tab active" data-tab="painter">🎨 Painter</button>
                <button class="gpmod-tab" data-tab="avatars">👤 Avatars</button>
                <button class="gpmod-tab" data-tab="reference">🔍 Reference</button>
                <button class="gpmod-tab" data-tab="settings">⚙️ Settings</button>
            </div>
            
            <div class="gpmod-content">
                <!-- محتوى Painter -->
                <div id="gpmod-painter-content" class="gpmod-section">
                    <h3 style="color: #4cc9f0; margin-bottom: 20px;">🎨 Enhanced Painter</h3>
                    
                    <div class="gpmod-control-group">
                        <div class="gpmod-control-label">
                            <span>Brush Size</span>
                            <span class="gpmod-control-value" id="brush-size-value">5</span>
                        </div>
                        <input type="range" class="gpmod-slider" id="brush-size-slider" min="1" max="50" value="5">
                    </div>
                    
                    <div class="gpmod-control-group">
                        <div class="gpmod-control-label">
                            <span>Brush Opacity</span>
                            <span class="gpmod-control-value" id="opacity-value">100%</span>
                        </div>
                        <input type="range" class="gpmod-slider" id="opacity-slider" min="1" max="100" value="100">
                    </div>
                    
                    <div class="gpmod-control-group">
                        <button class="gpmod-button" id="clear-canvas-btn">Clear Canvas (F)</button>
                        <button class="gpmod-button" id="toggle-mirror-btn">Toggle Mirror (CapsLock)</button>
                    </div>
                    
                    <h4 style="color: #72efdd; margin-top: 25px;">Keyboard Shortcuts</h4>
                    <div class="gpmod-shortcuts-grid">
                        <div class="gpmod-shortcut-item">
                            <strong>Alt</strong> - Color Picker
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>Ctrl + Mouse</strong> - Brush Size
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>Shift + Mouse</strong> - Opacity
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>V + Mouse</strong> - Value Control
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>Space</strong> - Hand Tool
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>C</strong> - Eraser (Hold)
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>Z</strong> - Zoom
                        </div>
                        <div class="gpmod-shortcut-item">
                            <strong>F</strong> - Clear Canvas
                        </div>
                    </div>
                </div>
                
                <!-- محتوى Avatars -->
                <div id="gpmod-avatars-content" class="gpmod-section" style="display: none;">
                    <h3 style="color: #4cc9f0; margin-bottom: 20px;">👤 Avatar System</h3>
                    
                    <div style="text-align: center; margin: 20px 0;">
                        <div id="avatar-preview" style="width: 150px; height: 150px; background: rgba(255,255,255,0.1); border-radius: 10px; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                            <span style="color: #a0a0c0;">Preview will appear here</span>
                        </div>
                        <input type="file" id="avatar-file-input" accept="image/*" style="display: none;">
                        <button class="gpmod-button" id="select-avatar-btn">Select Image</button>
                    </div>
                    
                    <div class="gpmod-control-group">
                        <button class="gpmod-button" id="send-avatar-btn" style="background: linear-gradient(45deg, #00b894, #00cec9);">
                            📤 Send for Review
                        </button>
                        <button class="gpmod-button" id="remove-avatar-btn" style="background: linear-gradient(45deg, #e17055, #fab1a0);">
                            🗑️ Remove Avatar
                        </button>
                    </div>
                    
                    <div style="background: rgba(255,255,255,0.05); padding: 15px; border-radius: 10px; margin-top: 20px;">
                        <p style="color: #a0a0c0; font-size: 0.9em;">
                            <strong>⚠️ Important:</strong> Avatars require moderation. After sending, please wait for approval.
                        </p>
                    </div>
                </div>
                
                <!-- محتوى Reference -->
                <div id="gpmod-reference-content" class="gpmod-section" style="display: none;">
                    <h3 style="color: #4cc9f0; margin-bottom: 20px;">🔍 Reference Finder</h3>
                    
                    <div class="gpmod-control-group">
                        <input type="text" id="ref-search-input" placeholder="Search for images..." style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #4cc9f0; border-radius: 8px; color: white; margin-bottom: 10px;">
                        
                        <select id="ref-service-select" style="width: 100%; padding: 12px; background: rgba(255,255,255,0.1); border: 1px solid #4cc9f0; border-radius: 8px; color: white; margin-bottom: 15px;">
                            <option value="google">Google Images</option>
                            <option value="pinterest">Pinterest</option>
                            <option value="unsplash">Unsplash</option>
                        </select>
                        
                        <button class="gpmod-button" id="search-ref-btn">Search</button>
                    </div>
                    
                    <div id="ref-results" style="margin-top: 20px; min-height: 200px;">
                        <!-- نتائج البحث تظهر هنا -->
                    </div>
                </div>
                
                <!-- محتوى Settings -->
                <div id="gpmod-settings-content" class="gpmod-section" style="display: none;">
                    <h3 style="color: #4cc9f0; margin-bottom: 20px;">⚙️ MOD Settings</h3>
                    
                    <div class="gpmod-control-group">
                        <label style="display: flex; align-items: center; margin: 10px 0; color: #b0b0d0;">
                            <input type="checkbox" id="enable-painter" checked style="margin-right: 10px;">
                            Enable Enhanced Painter
                        </label>
                        
                        <label style="display: flex; align-items: center; margin: 10px 0; color: #b0b0d0;">
                            <input type="checkbox" id="enable-avatars" checked style="margin-right: 10px;">
                            Enable Avatar System
                        </label>
                        
                        <label style="display: flex; align-items: center; margin: 10px 0; color: #b0b0d0;">
                            <input type="checkbox" id="enable-reference" checked style="margin-right: 10px;">
                            Enable Reference Finder
                        </label>
                    </div>
                    
                    <div class="gpmod-control-group">
                        <button class="gpmod-button" id="save-settings-btn">Save Settings</button>
                        <button class="gpmod-button" id="reset-settings-btn" style="background: linear-gradient(45deg, #e17055, #fab1a0);">
                            Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(this.ui);
    }
    
    setupEventListeners() {
        // أحداث التبويبات
        this.ui.querySelectorAll('.gpmod-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                const tabName = e.target.dataset.tab;
                this.switchTab(tabName);
            });
        });
        
        // أحداث التحكم في الرسم
        const brushSlider = this.ui.querySelector('#brush-size-slider');
        const opacitySlider = this.ui.querySelector('#opacity-slider');
        
        brushSlider.addEventListener('input', (e) => {
            this.ui.querySelector('#brush-size-value').textContent = e.target.value;
            window.GPMOD?.events?.emit('brush_size_change', parseInt(e.target.value));
        });
        
        opacitySlider.addEventListener('input', (e) => {
            this.ui.querySelector('#opacity-value').textContent = e.target.value + '%';
            window.GPMOD?.events?.emit('brush_opacity_change', parseInt(e.target.value));
        });
        
        // اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+M لفتح/إغلاق الواجهة
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                this.toggleUI();
            }
            
            // F لتنظيف اللوحة
            if (e.key === 'F' || e.key === 'f') {
                if (this.ui.querySelector('#clear-canvas-btn')) {
                    this.ui.querySelector('#clear-canvas-btn').click();
                }
            }
        });
    }
    
    addLauncherButton() {
        // زر التشغيل العائم
        const launcher = document.createElement('button');
        launcher.id = 'gpmod-launcher';
        launcher.textContent = '🎮 MOD';
        launcher.title = 'Open GarticPhone MOD';
        
        launcher.addEventListener('click', () => {
            this.toggleUI();
        });
        
        document.body.appendChild(launcher);
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // تحديث التبويبات النشطة
        this.ui.querySelectorAll('.gpmod-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // إظهار المحتوى المناسب
        const tabs = ['painter', 'avatars', 'reference', 'settings'];
        tabs.forEach(tab => {
            const element = this.ui.querySelector(`#gpmod-${tab}-content`);
            if (element) {
                element.style.display = tab === tabName ? 'block' : 'none';
            }
        });
        
        // إرسال حدث تغيير التبويب
        window.GPMOD?.events?.emit('ui_tab_changed', tabName);
    }
    
    toggleUI() {
        this.isVisible = !this.isVisible;
        this.ui.style.display = this.isVisible ? 'block' : 'none';
        
        if (this.isVisible) {
            this.ui.style.animation = 'fadeIn 0.3s ease';
        }
        
        window.GPMOD?.events?.emit('ui_toggled', this.isVisible);
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#00b894' : type === 'error' ? '#e17055' : '#4cc9f0'};
            color: white;
            padding: 15px 25px;
            border-radius: 10px;
            z-index: 100001;
            animation: fadeIn 0.3s ease;
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
        `;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
}

// تهيئة الواجهة
let gpmodUI = null;

// انتظار تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            gpmodUI = new GPMODUI();
        }, 2000);
    });
} else {
    setTimeout(() => {
        gpmodUI = new GPMODUI();
    }, 2000);
}
