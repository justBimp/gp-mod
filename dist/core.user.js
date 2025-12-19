// ==UserScript==
// @name         GarticPhone Mod - Core
// @namespace    https://github.com/justBimp/gp-mod
// @version      1.0.0
// @author       justBimp
// @match        https://garticphone.com/*
// @match        https://*.garticphone.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garticphone.com
// @grant        none
// @run-at       document-start
// @noframes
// @license      MIT
// ==/UserScript==

'use strict';

class GPMODCore {
    constructor() {
        this.version = '1.0.0';
        this.modules = new Map();
        this.hooks = new Map();
        this.config = this.loadConfig();
        
        this.init();
    }
    
    loadConfig() {
        return {
            debug: true,
            modules: {
                painter: true,
                avatars: true,
                reference: true,
                ui: true
            },
            hotkeys: {
                toggleUI: 'Ctrl+Shift+M',
                togglePainter: 'Ctrl+Shift+P'
            }
        };
    }
    
    init() {
        console.log(`%c🎮 GPMOD v${this.version} - Initializing`, 'color: #4cc9f0; font-weight: bold;');
        
        // إنشاء نظام الأحداث
        this.setupEventSystem();
        
        // ربط مع واجهة GarticPhone الأصلية
        this.integrateWithGame();
        
        // تحميل الوحدات النشطة
        this.loadActiveModules();
        
        console.log(`%c✅ GPMOD Core Ready`, 'color: #4cc9f0; font-weight: bold;');
    }
    
    setupEventSystem() {
        window.GPMOD = {
            events: {
                on: (event, callback) => {
                    if (!this.hooks.has(event)) this.hooks.set(event, []);
                    this.hooks.get(event).push(callback);
                },
                emit: (event, data) => {
                    if (this.hooks.has(event)) {
                        this.hooks.get(event).forEach(callback => callback(data));
                    }
                }
            },
            modules: this.modules,
            config: this.config
        };
    }
    
    integrateWithGame() {
        // استبدال WebSocket للتحكم في الاتصالات
        this.patchWebSocket();
        
        // استبدال XMLHttpRequest
        this.patchXHR();
        
        // مراقبة تغييرات الصفحة
        this.setupPageObserver();
    }
    
    patchWebSocket() {
        const OriginalWebSocket = window.WebSocket;
        
        window.WebSocket = class GPMODWebSocket extends OriginalWebSocket {
            constructor(url, protocols) {
                super(url, protocols);
                this._gpmod = true;
                
                this.addEventListener('message', (event) => {
                    GPMOD.events.emit('websocket_message', {
                        data: event.data,
                        socket: this
                    });
                });
                
                this.addEventListener('open', () => {
                    GPMOD.events.emit('websocket_open', this);
                });
            }
            
            send(data) {
                GPMOD.events.emit('websocket_send', {
                    data: data,
                    socket: this
                });
                super.send(data);
            }
        };
    }
    
    patchXHR() {
        const OriginalXHR = window.XMLHttpRequest;
        
        window.XMLHttpRequest = class GPMODXHR extends OriginalXHR {
            open(method, url, async = true, user, password) {
                GPMOD.events.emit('xhr_open', { method, url });
                super.open(method, url, async, user, password);
            }
            
            send(body) {
                GPMOD.events.emit('xhr_send', { body });
                super.send(body);
            }
        };
    }
    
    setupPageObserver() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.addedNodes.length) {
                    GPMOD.events.emit('dom_changed', mutation);
                }
            });
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }
    
    loadActiveModules() {
        Object.entries(this.config.modules).forEach(([module, enabled]) => {
            if (enabled) {
                console.log(`📦 Loading module: ${module}`);
                GPMOD.events.emit(`module_${module}_load`);
            }
        });
    }
    
    registerModule(name, module) {
        this.modules.set(name, module);
        console.log(`✅ Module registered: ${name}`);
    }
}

// بدء النظام عند تحميل الصفحة
window.addEventListener('load', () => {
    window.GPMOD_CORE = new GPMODCore();
});

// التشغيل الفوري إذا كانت الصفحة محملة مسبقاً
if (document.readyState === 'complete') {
    window.GPMOD_CORE = new GPMODCore();
}
