// ==UserScript==
// @name         GarticPhone Mod - UI
// @namespace    https://github.com/justBimp/gp-mod
// @version      1.0.0
// @author       justBimp
// @match        https://garticphone.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garticphone.com
// @grant        GM_addStyle
// @grant        GM_getResourceText
// @grant        GM_getResourceURL
// @require      https://justbimp.github.io/gp-mod/pub/js/ui.min.js
// @resource     uiCSS https://justbimp.github.io/gp-mod/pub/css/ui.min.css
// @run-at       document-end
// ==/UserScript==

'use strict';

// تحميل CSS
const uiCSS = GM_getResourceText('uiCSS');
GM_addStyle(uiCSS);

// تهيئة نظام الرسم المحسن
class EnhancedPainter {
    constructor() {
        this.canvas = null;
        this.isActive = false;
        this.setupPainter();
    }
    
    setupPainter() {
        // البحث عن عنصر الرسم في GarticPhone
        const checkCanvas = setInterval(() => {
            const canvasContainer = document.querySelector('.jsx-4003483438.drawingContainer');
            if (canvasContainer && !this.canvas) {
                this.canvas = canvasContainer;
                this.initPainterFeatures();
                clearInterval(checkCanvas);
                console.log('[Enhanced Painter] Canvas found and initialized');
            }
        }, 1000);
    }
    
    initPainterFeatures() {
        // إضافة اختصارات لوحة المفاتيح
        document.addEventListener('keydown', (e) => {
            if (!this.isActive) return;
            
            // التحكم بحجم الفرشاة
            if (e.ctrlKey && this.canvas) {
                this.enableBrushSizeControl();
            }
            
            // أداة التقاط اللون (Pipette)
            if (e.key === 'Alt') {
                e.preventDefault();
                this.activateColorPicker();
            }
            
            // أداة اليد لتحريك اللوحة
            if (e.key === ' ') {
                e.preventDefault();
                this.activateHandTool();
            }
            
            // الممحاة (عند الاستمرار بالضغط)
            if (e.key === 'c' || e.key === 'C') {
                this.activateEraser();
            }
            
            // تنظيف اللوحة
            if (e.key === 'f' || e.key === 'F') {
                if (confirm('Clear entire canvas?')) {
                    this.clearCanvas();
                }
            }
            
            // المرآة الأفقية
            if (e.key === 'CapsLock') {
                this.toggleMirror();
            }
            
            // التبديل بين الألوان
            if (e.key === 'x' || e.key === 'X') {
                this.swapColors();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.key === 'c' || e.key === 'C') {
                this.deactivateEraser();
            }
        });
    }
    
    enableBrushSizeControl() {
        // التحكم بحجم الفرشاة بالسحب
        this.canvas.addEventListener('mousemove', (e) => {
            if (e.ctrlKey) {
                const brushSize = Math.max(1, Math.min(50, e.movementX + 5));
                document.getElementById('brush-size').textContent = brushSize;
                // هنا تكامل مع نظام الفرشاة الأصلي
            }
        });
    }
    
    activateColorPicker() {
        console.log('[Painter] Color picker activated');
        // تنفيذ أداة التقاط اللون
    }
    
    activateHandTool() {
        console.log('[Painter] Hand tool activated');
        // تنفيذ أداة اليد
    }
    
    activateEraser() {
        console.log('[Painter] Eraser activated');
        // تنفيذ الممحاة
    }
    
    deactivateEraser() {
        console.log('[Painter] Eraser deactivated');
        // إيقاف الممحاة
    }
    
    clearCanvas() {
        // تنظيف اللوحة
        const clearBtn = document.querySelector('[data-testid="clear-button"]');
        if (clearBtn) clearBtn.click();
    }
    
    toggleMirror() {
        console.log('[Painter] Mirror toggled');
        // تفعيل المرآة الأفقية
    }
    
    swapColors() {
        console.log('[Painter] Colors swapped');
        // تبديل الألوان الأساسية والثانوية
    }
}

// نظام الأفتار
class AvatarSystem {
    constructor() {
        this.avatarData = null;
        this.init();
    }
    
    init() {
        console.log('[Avatar System] Initialized');
        // هنا كود رفع ومعاينة الأفتار
    }
    
    uploadAvatar(imageFile) {
        console.log('[Avatar] Uploading:', imageFile.name);
        // رفع الصورة للمراجعة
    }
}

// نظام المراجع
class ReferenceSystem {
    constructor() {
        this.currentImage = null;
        this.init();
    }
    
    init() {
        console.log('[Reference System] Initialized');
        // هنا كود البحث عن الصور
    }
    
    searchImages(query, service = 'google') {
        console.log(`[Reference] Searching "${query}" on ${service}`);
        // البحث في خدمات الصور
    }
}

// التهيئة الرئيسية
function initGPMODUI() {
    console.log('[GPMOD UI] Starting initialization...');
    
    // تهيئة الأنظمة
    const painter = new EnhancedPainter();
    const avatars = new AvatarSystem();
    const reference = new ReferenceSystem();
    
    // إضافة زر الواجهة في صفحة GarticPhone
    addToolbarButton();
    
    console.log('[GPMOD UI] All systems ready');
}

// إضافة زر في واجهة GarticPhone
function addToolbarButton() {
    const toolbar = document.querySelector('.game-toolbar');
    if (toolbar && !document.getElementById('gpmod-launcher')) {
        const button = document.createElement('button');
        button.id = 'gpmod-launcher';
        button.innerHTML = '🎨 MOD';
        button.style.cssText = `
            background: linear-gradient(45deg, #4cc9f0, #4361ee);
            color: white;
            border: none;
            border-radius: 20px;
            padding: 8px 16px;
            margin-left: 10px;
            cursor: pointer;
            font-weight: bold;
        `;
        
        button.addEventListener('click', () => {
            document.getElementById('gpmod-ui').style.display = 'block';
        });
        
        toolbar.appendChild(button);
    }
}

// بدء التنفيذ بعد تحميل الصفحة
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGPMODUI);
} else {
    initGPMODUI();
}
