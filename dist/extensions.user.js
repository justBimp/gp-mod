// ==UserScript==
// @name         GarticPhone Enhanced Extensions
// @namespace    https://github.com/justBimp/gp-mod
// @version      4.7.0
// @description  Enhanced extensions for GarticPhone with improved features and security
// @author       justBimp
// @match        https://garticphone.com/*
// @match        https://*.garticphone.com/*
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
    // Configuration
    const CONFIG = {
        name: 'Extensions',
        version: '4.7.0',
        baseUrl: 'https://justbimp.github.io/pub',
        updatesUrl: 'https://justbimp.github.io/userscripts/dist/versions.json',
        authUrl: 'https://justbimp.github.io/auth/users/{filename}',
        localizationPath: 'https://justbimp.github.io/localization',
        defaultLanguage: 'en',
        cacheTTL: 3600000,
        debug: false
    };

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
        error: (...args) => console.error(this.prefix, ...args),
        
        debugGroup: (label, ...args) => {
            if (CONFIG.debug) {
                console.groupCollapsed(`${this.prefix} ${label}`);
                args.forEach(arg => console.log(arg));
                console.groupEnd();
            }
        }
    };

    // Cache Manager
    const CacheManager = {
        set: (key, value, ttl = CONFIG.cacheTTL) => {
            try {
                const item = {
                    value,
                    expiry: Date.now() + ttl
                };
                state.cache.set(key, item);
                GM_setValue(`cache_${key}`, JSON.stringify(item));
            } catch (e) {
                Logger.error('Cache set failed:', e);
            }
        },

        get: (key) => {
            try {
                // Check memory cache first
                if (state.cache.has(key)) {
                    const item = state.cache.get(key);
                    if (item.expiry > Date.now()) {
                        return item.value;
                    }
                    state.cache.delete(key);
                }

                // Check GM storage
                const stored = GM_getValue(`cache_${key}`);
                if (stored) {
                    const item = JSON.parse(stored);
                    if (item.expiry > Date.now()) {
                        state.cache.set(key, item);
                        return item.value;
                    }
                    GM_deleteValue(`cache_${key}`);
                }
            } catch (e) {
                Logger.error('Cache get failed:', e);
            }
            return null;
        },

        clear: (key) => {
            state.cache.delete(key);
            GM_deleteValue(`cache_${key}`);
        },

        clearAll: () => {
            state.cache.clear();
        }
    };

    // Resource Loader
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
                const url = `${CONFIG.baseUrl}/${file}`;
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = url;
                link.crossOrigin = 'anonymous';
                link.onload = () => Logger.info(`Loaded style: ${file}`);
                link.onerror = () => Logger.error(`Failed to load style: ${file}`);
                document.head.appendChild(link);
            });
            
            // Load JS
            this.resources.script.forEach(file => {
                const url = `${CONFIG.baseUrl}/${file}`;
                const script = document.createElement('script');
                script.src = url;
                script.defer = true;
                script.crossOrigin = 'anonymous';
                script.onload = () => Logger.info(`Loaded script: ${file}`);
                script.onerror = () => Logger.error(`Failed to load script: ${file}`);
                document.head.appendChild(script);
            });
            
            state.resourcesLoaded = true;
        }
    };

    // HTTP Client
    const HttpClient = {
        request: (options = {}) => {
            const {
                url,
                method = 'GET',
                headers = {},
                data,
                responseType = 'json',
                timeout = 10000
            } = options;

            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    url,
                    method,
                    headers: {
                        'User-Agent': navigator.userAgent,
                        ...headers
                    },
                    timeout,
                    responseType: responseType === 'json' ? 'text' : responseType,
                    data,
                    onload: (response) => {
                        try {
                            let result = response.responseText;
                            
                            if (responseType === 'json') {
                                result = JSON.parse(result);
                            }
                            
                            if (response.status >= 200 && response.status < 300) {
                                resolve(result);
                            } else {
                                reject(new Error(`HTTP ${response.status}: ${response.statusText}`));
                            }
                        } catch (error) {
                            reject(error);
                        }
                    },
                    onerror: reject,
                    ontimeout: () => reject(new Error('Request timeout'))
                });
            });
        }
    };

    // Update Manager
    const UpdateManager = {
        checkForUpdates: async () => {
            if (state.updateCheckInProgress) return;
            state.updateCheckInProgress = true;

            try {
                state.updatesData = await HttpClient.request({
                    url: CONFIG.updatesUrl
                });

                document.dispatchEvent(new CustomEvent('_check-for-updates', {
                    detail: { ...CONFIG }
                }));

                this.findOutdatedScripts();
            } catch (error) {
                Logger.error('Update check failed:', error);
            } finally {
                state.updateCheckInProgress = false;
            }
        },

        findOutdatedScripts: () => {
            state.outdatedScripts.clear();
            
            document.dispatchEvent(new CustomEvent('_us_check-for-updates', {
                detail: { name: CONFIG.name, version: CONFIG.version, url: '' }
            }));
        },

        isOutdated: (currentVersion, latestVersion) => {
            const currentParts = currentVersion.split('.').map(Number);
            const latestParts = latestVersion.split('.').map(Number);
            
            for (let i = 0; i < Math.max(currentParts.length, latestParts.length); i++) {
                const current = currentParts[i] || 0;
                const latest = latestParts[i] || 0;
                
                if (latest > current) return true;
                if (latest < current) return false;
            }
            
            return false;
        },

        updateScript: (scriptName) => {
            const script = state.outdatedScripts.get(scriptName);
            if (script && script.url) {
                GM_openInTab(`${script.url}?t=${Date.now()}`, {
                    active: true,
                    insert: true
                });
            }
        }
    };

    // Authentication Manager
    const AuthManager = {
        loadAuthData: async () => {
            try {
                const authFilename = localStorage.getItem('gp_auth-filename');
                if (!authFilename) {
                    Logger.info('No auth filename found');
                    return;
                }

                const authUrl = CONFIG.authUrl.replace('{filename}', authFilename);
                
                const authData = await HttpClient.request({
                    url: authUrl,
                    responseType: 'text'
                });

                if (authData) {
                    sessionStorage.setItem('gp_auth-data', authData);
                    state.authData = authData;
                    Logger.info('Auth data loaded successfully');
                }
            } catch (error) {
                Logger.error('Failed to load auth data:', error);
            }
        }
    };

    // Localization Manager
    const LocalizationManager = {
        storageKey: 'gp_localization_v2',

        async load() {
            try {
                // Load hashes
                const hashes = await HttpClient.request({
                    url: `${CONFIG.localizationPath}/hashes.json`
                });

                // Determine language
                const userLang = navigator.language.split('-')[0].toLowerCase();
                const targetLang = hashes[userLang] ? userLang : CONFIG.defaultLanguage;

                // Load localization data
                const data = await HttpClient.request({
                    url: `${CONFIG.localizationPath}/locales/${targetLang}.json`
                });

                const localization = {
                    lang: targetLang,
                    hash: hashes[targetLang],
                    entries: data,
                    timestamp: Date.now()
                };

                // Cache and apply
                CacheManager.set(this.storageKey, localization);
                this.applyLocalization(localization);

            } catch (error) {
                Logger.error('Localization loading failed:', error);
                this.applyFallback();
            }
        },

        applyLocalization(data) {
            state.localization = data;
            
            document.dispatchEvent(new CustomEvent('_gp_l10n', {
                detail: {
                    lang: data.lang,
                    entries: data.entries,
                    timestamp: data.timestamp
                }
            }));

            Logger.info(`Localization applied: ${data.lang}`);
        },

        applyFallback() {
            state.localization = {
                lang: CONFIG.defaultLanguage,
                entries: {},
                timestamp: Date.now()
            };
            
            document.dispatchEvent(new CustomEvent('_gp_l10n', {
                detail: state.localization
            }));
            
            Logger.warn('Using fallback localization');
        }
    };

    // Avatar Controller
    class AvatarController {
        // ⚠️ TODO: Add your Discord webhook URL here
        static WEBHOOK_URL = 'https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN';
        
        static TWITCH_PROFILE_URL = 'https://www.twitch.tv/{userLogin}';
        static REQUEST_TYPES = {
            REVIEW: 'review',
            REMOVAL: 'removal'
        };

        constructor() {
            this.setupEventListeners();
        }

        setupEventListeners() {
            document.addEventListener('_av_review', ({ detail }) => {
                this.send(this.constructor.REQUEST_TYPES.REVIEW, detail);
            });

            document.addEventListener('_av_removal', ({ detail }) => {
                this.send(this.constructor.REQUEST_TYPES.REMOVAL, detail);
            });
        }

        async send(type, data) {
            const {
                sender,
                senderId,
                keyHash = null,
                service,
                imageFile,
                filename,
                noticeColor
            } = data;

            try {
                const embed = this.createEmbed(type, data);
                const payload = this.createPayload(type, embed, imageFile);

                await HttpClient.request({
                    url: this.constructor.WEBHOOK_URL,
                    method: 'POST',
                    data: payload,
                    responseType: 'text'
                });

                document.dispatchEvent(new CustomEvent('_av_complete', {
                    detail: { type, success: true }
                }));

                Logger.info(`Avatar ${type} request sent successfully`);
            } catch (error) {
                Logger.error(`Avatar ${type} request failed:`, error);
                
                document.dispatchEvent(new CustomEvent('_av_error', {
                    detail: { type, error: error.message }
                }));
            }
        }

        createEmbed(type, data) {
            const { sender, senderId, keyHash, service, filename, noticeColor } = data;
            const isTwitch = service === 'twitch';
            const serviceFormatted = this.capitalize(service);
            const senderFormatted = this.escapeMarkdown(sender);
            const senderLink = isTwitch 
                ? `[**${senderFormatted}**](${this.constructor.TWITCH_PROFILE_URL.replace('{userLogin}', sender)})`
                : `**${senderFormatted}**`;

            return {
                title: type === this.constructor.REQUEST_TYPES.REMOVAL ? 'Avatar Removal Request' : 'Avatar Review Request',
                color: parseInt(noticeColor.replace('#', '0x')),
                description: [
                    `From: ${senderLink} (**${senderId}**)`,
                    keyHash ? `Key: **${keyHash}**` : null,
                    `Filename: **${filename}**`,
                    '\u200b'
                ].filter(Boolean).join('\n'),
                timestamp: new Date().toISOString(),
                footer: { text: serviceFormatted }
            };
        }

        createPayload(type, embed, imageFile) {
            const payload = {
                content: '\u200b',
                embeds: [embed]
            };

            if (type === this.constructor.REQUEST_TYPES.REVIEW && imageFile) {
                const formData = new FormData();
                formData.append('payload_json', JSON.stringify(payload));
                formData.append('files[0]', imageFile, imageFile.name);
                return formData;
            }

            return JSON.stringify(payload);
        }

        escapeMarkdown(text) {
            return text.replace(/([_*`~\\])/g, '\\$1');
        }

        capitalize(text) {
            return text ? text.charAt(0).toUpperCase() + text.slice(1) : '';
        }
    }

    // Initialize everything
    const init = () => {
        Logger.info(`Initializing ${CONFIG.name} v${CONFIG.version}`);

        // Set up event listeners for update system
        document.addEventListener('_us_check-for-updates', ({ detail }) => {
            const { name, version, url } = detail;
            const latest = state.updatesData[name];
            if (latest && UpdateManager.isOutdated(version, latest)) {
                state.outdatedScripts.set(name, { name, version, latestVersion: latest, url });
            }
        });

        document.addEventListener('_get-outdated-scripts', () => {
            document.dispatchEvent(new CustomEvent('_outdated-scripts', {
                detail: { outdatedScripts: Array.from(state.outdatedScripts.values()) }
            }));
        });

        document.addEventListener('_update-script', ({ detail }) => {
            UpdateManager.updateScript(detail.name);
        });

        // Initialize managers
        ResourceLoader.loadAll();
        LocalizationManager.load();
        AuthManager.loadAuthData();
        
        // Initialize controllers
        new AvatarController();
        
        // Check for updates after a delay
        setTimeout(() => UpdateManager.checkForUpdates(), 3000);

        Logger.info('Extensions initialization complete');
    };

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
