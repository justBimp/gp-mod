// ==UserScript==
// @name         GarticPhone Mod - Extensions
// @namespace    https://github.com/justBimp/gp-mod
// @version      1.0.0
// @author       justBimp
// @match        https://garticphone.com/*
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_notification
// @require      https://justbimp.github.io/gp-mod/pub/js/extensions.core.js
// @run-at       document-end
// ==/UserScript==

'use strict';

class GPMODExtensions {
    constructor() {
        this.modules = {};
        this.settings = this.loadSettings();
        
        this.init();
    }
    
    loadSettings() {
        const defaultSettings = {
            painter: {
                enabled: true,
                shortcuts: {
                    colorPicker: 'Alt',
                    brushSize: 'Ctrl',
                    brushOpacity: 'Shift',
                    handTool: 'Space',
                    eraser: 'C',
                    clearCanvas: 'F',
                    mirror: 'CapsLock'
                }
            },
            avatars: {
                enabled: true,
                webhookUrl: '', // أضف رابط Discord webhook هنا
                autoUpload: false
            },
            reference: {
                enabled: true,
                defaultService: 'google',
                maxResults: 20
            }
        };
        
        return JSON.parse(GM_getValue('gpmod_settings', JSON.stringify(defaultSettings)));
    }
    
    saveSettings() {
        GM_setValue('gpmod_settings', JSON.stringify(this.settings));
    }
    
    init() {
        console.log('🔧 Initializing GPMOD Extensions');
        
        // انتظار تحميل النظام الأساسي
        if (!window.GPMOD) {
            setTimeout(() => this.init(), 100);
            return;
        }
        
        // تحميل الوحدات
        this.loadModules();
        
        // تسجيل الوحدة
        window.GPMOD?.registerModule?.('extensions', this);
        
        // الاستماع للأحداث
        this.setupEventListeners();
    }
    
    loadModules() {
        // وحدة الرسم المحسن
        if (this.settings.painter.enabled) {
            this.modules.painter = new EnhancedPainter(this);
        }
        
        // وحدة الأفتار
        if (this.settings.avatars.enabled) {
            this.modules.avatars = new AvatarSystem(this);
        }
        
        // وحدة البحث عن المراجع
        if (this.settings.reference.enabled) {
            this.modules.reference = new ReferenceSystem(this);
        }
    }
    
    setupEventListeners() {
        window.GPMOD?.events?.on('module_painter_load', () => {
            console.log('🎨 Painter module loading...');
        });
        
        window.GPMOD?.events?.on('module_avatars_load', () => {
            console.log('👤 Avatars module loading...');
        });
        
        window.GPMOD?.events?.on('module_reference_load', () => {
            console.log('🔍 Reference module loading...');
        });
    }
}

// نظام الرسم المحسن
class EnhancedPainter {
    constructor(parent) {
        this.parent = parent;
        this.canvas = null;
        this.isDrawing = false;
        this.currentTool = 'brush';
        this.brushSize = 5;
        this.brushOpacity = 1.0;
        
        this.init();
    }
    
    init() {
        console.log('🎨 Enhanced Painter Initializing');
        
        // البحث عن لوحة الرسم
        this.findCanvas();
        
        // إعداد اختصارات لوحة المفاتيح
        this.setupShortcuts();
        
        // ربط مع واجهة المستخدم
        this.setupUIListeners();
        
        window.GPMOD?.events?.emit('painter_ready');
    }
    
    findCanvas() {
        const canvasCheck = setInterval(() => {
            const drawingContainer = document.querySelector('.jsx-4003483438.drawingContainer');
            if (drawingContainer) {
                this.canvas = drawingContainer;
                console.log('✅ Canvas found:', this.canvas);
                this.setupCanvasEvents();
                clearInterval(canvasCheck);
            }
        }, 500);
    }
    
    setupCanvasEvents() {
        if (!this.canvas) return;
        
        // مراقبة أحداث الرسم
        this.canvas.addEventListener('mousedown', (e) => {
            this.isDrawing = true;
            this.handleDrawingStart(e);
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isDrawing) {
                this.handleDrawingMove(e);
            }
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.isDrawing = false;
            this.handleDrawingEnd();
        });
        
        this.canvas.addEventListener('mouseleave', () => {
            this.isDrawing = false;
        });
    }
    
    setupShortcuts() {
        document.addEventListener('keydown', (e) => {
            // منع السلوك الافتراضي للاختصارات
            const shortcuts = this.parent.settings.painter.shortcuts;
            
            // أداة التقاط اللون
            if (e.key.toLowerCase() === shortcuts.colorPicker.toLowerCase()) {
                e.preventDefault();
                this.activateColorPicker();
            }
            
            // أداة اليد
            if (e.key === shortcuts.handTool) {
                e.preventDefault();
                this.activateHandTool();
            }
            
            // الممحاة (عند الاستمرار)
            if (e.key.toLowerCase() === shortcuts.eraser.toLowerCase()) {
                this.activateEraser();
            }
            
            // المرآة الأفقية
            if (e.key === shortcuts.mirror) {
                e.preventDefault();
                this.toggleMirror();
            }
            
            // تنظيف اللوحة
            if (e.key.toLowerCase() === shortcuts.clearCanvas.toLowerCase()) {
                e.preventDefault();
                this.clearCanvas();
            }
            
            // التحكم بحجم الفرشاة مع Ctrl + الماوس
            if (e.ctrlKey && this.isDrawing) {
                this.controlBrushSize(e);
            }
            
            // التحكم بالشفافية مع Shift + الماوس
            if (e.shiftKey && this.isDrawing) {
                this.controlBrushOpacity(e);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key.toLowerCase() === this.parent.settings.painter.shortcuts.eraser.toLowerCase()) {
                this.deactivateEraser();
            }
        });
    }
    
    setupUIListeners() {
        window.GPMOD?.events?.on('brush_size_change', (size) => {
            this.brushSize = size;
            console.log(`🖌️ Brush size changed to: ${size}`);
        });
        
        window.GPMOD?.events?.on('brush_opacity_change', (opacity) => {
            this.brushOpacity = opacity / 100;
            console.log(`🎨 Brush opacity changed to: ${opacity}%`);
        });
    }
    
    activateColorPicker() {
        console.log('🎨 Color Picker activated');
        // تنفيذ أداة التقاط اللون هنا
        window.GPMOD?.events?.emit('color_picker_activated');
    }
    
    activateHandTool() {
        console.log('🖐️ Hand Tool activated');
        // تنفيذ أداة اليد هنا
    }
    
    activateEraser() {
        if (this.currentTool !== 'eraser') {
            this.currentTool = 'eraser';
            console.log('🧹 Eraser activated');
        }
    }
    
    deactivateEraser() {
        if (this.currentTool === 'eraser') {
            this.currentTool = 'brush';
            console.log('🖌️ Brush reactivated');
        }
    }
    
    toggleMirror() {
        console.log('🪞 Mirror toggled');
        // تنفيذ المرآة الأفقية
        window.GPMOD?.events?.emit('mirror_toggled');
    }
    
    clearCanvas() {
        console.log('🗑️ Clearing canvas');
        // تنفيذ تنظيف اللوحة
        const clearBtn = document.querySelector('[data-testid="clear-button"]');
        if (clearBtn) {
            clearBtn.click();
            window.GPMOD?.events?.emit('canvas_cleared');
        }
    }
    
    controlBrushSize(e) {
        // تغيير حجم الفرشاة بالسحب الأفقي
        const delta = e.movementX;
        const newSize = Math.max(1, Math.min(50, this.brushSize + delta * 0.1));
        this.brushSize = newSize;
        
        window.GPMOD?.events?.emit('brush_size_adjusted', newSize);
    }
    
    controlBrushOpacity(e) {
        // تغيير شفافية الفرشاة بالسحب العمودي
        const delta = e.movementY;
        const newOpacity = Math.max(0.1, Math.min(1, this.brushOpacity - delta * 0.01));
        this.brushOpacity = newOpacity;
        
        window.GPMOD?.events?.emit('brush_opacity_adjusted', newOpacity);
    }
    
    handleDrawingStart(e) {
        // بدء الرسم
        console.log('✏️ Drawing started');
    }
    
    handleDrawingMove(e) {
        // أثناء الرسم
        // هنا يمكن إضافة تحسينات للرسم
    }
    
    handleDrawingEnd() {
        // انتهاء الرسم
        console.log('✅ Drawing ended');
    }
}

// نظام الأفتار
class AvatarSystem {
    constructor(parent) {
        this.parent = parent;
        this.currentAvatar = null;
        this.avatarCache = new Map();
        
        this.init();
    }
    
    init() {
        console.log('👤 Avatar System Initializing');
        
        // إعداد واجهة الأفتار
        this.setupAvatarUI();
        
        // تحميل الأفتار المخزنة
        this.loadCachedAvatars();
    }
    
    setupAvatarUI() {
        // ربط أحداث واجهة الأفتار
        window.GPMOD?.events?.on('ui_tab_changed', (tab) => {
            if (tab === 'avatars') {
                this.updateAvatarPreview();
            }
        });
        
        // حدث اختيار صورة
        document.addEventListener('click', (e) => {
            if (e.target.id === 'select-avatar-btn') {
                document.getElementById('avatar-file-input').click();
            }
        });
        
        // حدث تغيير ملف الصورة
        document.addEventListener('change', (e) => {
            if (e.target.id === 'avatar-file-input') {
                this.handleImageSelect(e.target.files[0]);
            }
        });
    }
    
    handleImageSelect(file) {
        if (!file || !file.type.startsWith('image/')) {
            this.showMessage('Please select a valid image file', 'error');
            return;
        }
        
        console.log('🖼️ Image selected:', file.name);
        
        // عرض معاينة الصورة
        const reader = new FileReader();
        reader.onload = (e) => {
            this.currentAvatar = {
                name: file.name,
                data: e.target.result,
                timestamp: Date.now()
            };
            
            this.updateAvatarPreview();
            this.showMessage('Image loaded successfully', 'success');
        };
        
        reader.readAsDataURL(file);
    }
    
    updateAvatarPreview() {
        const preview = document.getElementById('avatar-preview');
        if (!preview || !this.currentAvatar) return;
        
        preview.innerHTML = `<img src="${this.currentAvatar.data}" style="max-width: 100%; max-height: 100%; border-radius: 5px;">`;
    }
    
    loadCachedAvatars() {
        // تحميل الأفتار من التخزين المحلي
        const cached = GM_getValue('gpmod_avatars', '{}');
        try {
            const avatars = JSON.parse(cached);
            this.avatarCache = new Map(Object.entries(avatars));
            console.log(`📁 Loaded ${this.avatarCache.size} cached avatars`);
        } catch (e) {
            console.warn('Failed to load cached avatars:', e);
        }
    }
    
    showMessage(message, type = 'info') {
        window.GPMOD?.events?.emit('notification', { message, type });
    }
}

// نظام البحث عن المراجع
class ReferenceSystem {
    constructor(parent) {
        this.parent = parent;
        this.searchHistory = [];
        this.currentResults = [];
        
        this.init();
    }
    
    init() {
        console.log('🔍 Reference System Initializing');
        
        // إعداد واجهة البحث
        this.setupReferenceUI();
    }
    
    setupReferenceUI() {
        // ربط حدث البحث
        document.addEventListener('click', (e) => {
            if (e.target.id === 'search-ref-btn') {
                this.performSearch();
            }
        });
        
        // البحث عند الضغط على Enter
        document.addEventListener('keydown', (e) => {
            if (e.target.id === 'ref-search-input' && e.key === 'Enter') {
                this.performSearch();
            }
        });
    }
    
    async performSearch() {
        const input = document.getElementById('ref-search-input');
        const serviceSelect = document.getElementById('ref-service-select');
        
        if (!input || !serviceSelect) return;
        
        const query = input.value.trim();
        const service = serviceSelect.value;
        
        if (!query) {
            this.showMessage('Please enter a search query', 'error');
            return;
        }
        
        console.log(`🔍 Searching for "${query}" on ${service}`);
        
        // إظهار حالة التحميل
        this.showLoading();
        
        try {
            // محاكاة البحث (يمكن استبدالها بطلبات API حقيقية)
            await this.simulateSearch(query, service);
            
            // حفظ في السجل
            this.searchHistory.push({
                query,
                service,
                timestamp: Date.now(),
                results: this.currentResults.length
            });
            
            this.showMessage(`Found ${this.currentResults.length} results`, 'success');
            
        } catch (error) {
            console.error('Search failed:', error);
            this.showMessage('Search failed. Please try again.', 'error');
        }
    }
    
    async simulateSearch(query, service) {
        // محاكاة بحث (استبدل ب API حقيقي)
        return new Promise((resolve) => {
            setTimeout(() => {
                // نتائج وهمية لأغراض العرض
                this.currentResults = [
                    { id: 1, title: 'Example Image 1', url: 'https://via.placeholder.com/300x200/4cc9f0/fff?text=Example+1', service },
                    { id: 2, title: 'Example Image 2', url: 'https://via.placeholder.com/300x200/4361ee/fff?text=Example+2', service },
                    { id: 3, title: 'Example Image 3', url: 'https://via.placeholder.com/300x200/7209b7/fff?text=Example+3', service },
                    { id: 4, title: 'Example Image 4', url: 'https://via.placeholder.com/300x200/f72585/fff?text=Example+4', service }
                ];
                
                this.displayResults();
                resolve();
            }, 1000);
        });
    }
    
    displayResults() {
        const resultsContainer = document.getElementById('ref-results');
        if (!resultsContainer) return;
        
        resultsContainer.innerHTML = `
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px;">
                ${this.currentResults.map(result => `
                    <div style="background: rgba(255,255,255,0.05); border-radius: 8px; overflow: hidden; cursor: pointer;">
                        <img src="${result.url}" style="width: 100%; height: 120px; object-fit: cover;">
                        <div style="padding: 8px; font-size: 0.8em; color: #a0a0c0;">
                            ${result.title}
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
        
        // إضافة أحداث النقر على النتائج
        resultsContainer.querySelectorAll('div > div').forEach((div, index) => {
            div.addEventListener('click', () => {
                this.openImage(this.currentResults[index]);
            });
        });
    }
    
    openImage(result) {
        console.log('🖼️ Opening image:', result.title);
        window.GPMOD?.events?.emit('reference_image_opened', result);
        
        // يمكن فتح الصورة في نافذة منبثقة أو في لوحة جانبية
        this.showMessage(`Opening: ${result.title}`, 'info');
    }
    
    showLoading() {
        const resultsContainer = document.getElementById('ref-results');
        if (resultsContainer) {
            resultsContainer.innerHTML = `
                <div style="text-align: center; padding: 40px; color: #a0a0c0;">
                    <div style="font-size: 2em; margin-bottom: 10px;">🔍</div>
                    <div>Searching...</div>
                </div>
            `;
        }
    }
    
    showMessage(message, type = 'info') {
        window.GPMOD?.events?.emit('notification', { message, type });
    }
}

// تهيئة النظام
let gpmodExtensions = null;

// بدء النظام عند تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            gpmodExtensions = new GPMODExtensions();
        }, 3000);
    });
} else {
    setTimeout(() => {
        gpmodExtensions = new GPMODExtensions();
    }, 3000);
}
