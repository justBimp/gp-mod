// ==UserScript==
// @name         GarticPhone Enhanced Extensions
// @namespace    https://github.com/justBimp/gp-mod
// @version      1.0.0
// @description  Enhanced extensions for GarticPhone
// @author       justBimp
// @match        https://garticphone.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garticphone.com
// @grant        GM_xmlhttpRequest
// @grant        GM_openInTab
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_deleteValue
// @grant        GM_addStyle
// @grant        GM_notification
// @noframes
// @run-at       document-end
// @connect      github.io
// @connect      github.com
// @connect      discord.com
// @connect      google-analytics.com
// @connect      raw.githubusercontent.com
// @require      https://cdn.jsdelivr.net/npm/js-cookie@3.0.5/dist/js.cookie.min.js
// @license      MIT
// @supportURL   https://github.com/justBimp/gp-mod/issues
// @updateURL    https://raw.githubusercontent.com/justBimp/gp-mod/main/dist/extensions.user.js
// @downloadURL  https://raw.githubusercontent.com/justBimp/gp-mod/main/dist/extensions.user.js
// ==/UserScript==

'use strict';

(function() {
    // ⚠️ ========== ابدأ التعديل هنا ========== ⚠️
    const CONFIG = {
        name: 'Extensions',
        version: '1.0.0',
        // ⚠️ غير هذه الروابط إلى نطاقك على GitHub
        baseUrl: 'https://justBimp.github.io/pub',
        updatesUrl: 'https://justBimp.github.io/userscripts/dist/versions.json',
        authUrl: 'https://justBimp.github.io/auth/users/{filename}',
        localizationPath: 'https://justBimp.github.io/localization',
        defaultLanguage: 'en',
        cacheTTL: 3600000,
        debug: true  // غيرها لـ false بعد الاختبار
    };
    // ⚠️ ========== انتهاء التعديل ========== ⚠️

    // State management
    const state = {
        resourcesLoaded: false,
        updateCheckInProgress: false,
        authData: null,
        localization: null,
        outdatedScripts: new Map(),
        updatesData: {},
        cache: new Map()
    };

    // Logger utility
    const Logger = {
        prefix: `[${CONFIG.name}]`,
        
        log: (...args) => CONFIG.debug && console.log(this.prefix, ...args),
        info: (...args) => console.info(this.prefix, ...args),
        warn: (...args) => console.warn(this.prefix, ...args),
        error: (...args) => console.error(this.prefix, ...args)
    };

    // Cache Manager (مبسط)
    const CacheManager = {
        set: (key, value) => {
            try {
                GM_setValue(key, JSON.stringify(value));
                state.cache.set(key, value);
            } catch (e) {
                Logger.error('Cache set failed:', e);
            }
        },

        get: (key) => {
            try {
                if (state.cache.has(key)) return state.cache.get(key);
                const stored = GM_getValue(key);
                if (stored) {
                    const value = JSON.parse(stored);
                    state.cache.set(key, value);
                    return value;
                }
            } catch (e) {
                Logger.error('Cache get failed:', e);
            }
            return null;
        }
    };

    // Enhanced Resource Loader
    const ResourceLoader = {
        resources: {
            style: ['dist/main.min.css'],
            script: ['dist/main.min.js']
        },

        loadAll: () => {
            if (state.resourcesLoaded) return;
            
            Logger.info('Loading resources...');
            
            // Load CSS
            this.resources.style.forEach(file => {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = `${CONFIG.baseUrl}/${file}`;
                document.head.appendChild(link);
            });
            
            // Load JS
            this.resources.script.forEach(file => {
                const script = document.createElement('script');
                script.src = `${CONFIG.baseUrl}/${file}`;
                script.defer = true;
                document.head.appendChild(script);
            });
            
            state.resourcesLoaded = true;
        }
    };

    // HTTP Client مبسط
    const HttpClient = {
        request: async (options) => {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    url: options.url,
                    method: options.method || 'GET',
                    headers: options.headers || {},
                    data: options.data,
                    responseType: options.responseType === 'json' ? 'text' : options.responseType,
                    onload: (response) => {
                        if (response.status >= 200 && response.status < 300) {
                            try {
                                let data = response.responseText;
                                if (options.responseType === 'json') data = JSON.parse(data);
                                resolve(data);
                            } catch (error) {
                                reject(error);
                            }
                        } else {
                            reject(new Error(`HTTP ${response.status}`));
                        }
                    },
                    onerror: reject,
                    ontimeout: reject
                });
            });
        }
    };

    // Update Manager مبسط
    const UpdateManager = {
        checkForUpdates: async () => {
            try {
                const data = await HttpClient.request({
                    url: CONFIG.updatesUrl,
                    responseType: 'json'
                });
                state.updatesData = data;
                Logger.info('Updates checked successfully');
            } catch (error) {
                Logger.warn('Failed to check updates:', error);
            }
        }
    };

    // Avatar Controller مبسط
    class AvatarController {
        // ⚠️ غير هذا إذا تبي Discord Webhook
        static WEBHOOK_URL = 'https://discord.com/api/webhooks/1451558857557016869/RIcZOYEND1gJutUSiyFwsAzQT6oxhhXuMx0n4MC6MNVxmFn8FrElqXVyHv49iy4uUI7M'; // اتركه فارغ إذا ما تبي
        
        constructor() {
            if (this.constructor.WEBHOOK_URL) {
                document.addEventListener('_av_review', ({ detail }) => {
                    this.send('review', detail);
                });
            }
        }
        
        async send(type, data) {
            if (!this.constructor.WEBHOOK_URL) return;
            
            Logger.info(`Avatar ${type} request`);
            // هنا كود الإرسال لـ Discord
        }
    }

    // Init everything
    const init = () => {
        Logger.info(`Initializing ${CONFIG.name} v${CONFIG.version}`);
        
        // Load resources
        ResourceLoader.loadAll();
        
        // Check for updates
        UpdateManager.checkForUpdates();
        
        // Initialize controllers
        new AvatarController();
        
        Logger.info('Extensions loaded successfully!');
        
        // Show notification if debug mode
        if (CONFIG.debug) {
            setTimeout(() => {
                alert('🎮 GarticPhone Mod loaded!\nDebug mode: ON');
            }, 1000);
        }
    };

    // Start when page loads
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Debug access
    window.gpMod = { CONFIG, Logger, state };

})();
