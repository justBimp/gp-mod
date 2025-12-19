// ==UserScript==
// @name         GarticPhone Enhanced Core
// @namespace    https://github.com/justBimp/gp-mod
// @version      4.2.0
// @description  Core functionality for GarticPhone enhancements
// @author       justBimp
// @match        https://garticphone.com/*
// @match        https://*.garticphone.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=garticphone.com
// @grant        none
// @run-at       document-start
// @noframes
// @license      MIT
// @supportURL   https://github.com/justBimp/gp-mod/issues
// @updateURL    https://raw.githubusercontent.com/justBimp/gp-mod/main/dist/core.user.js
// @downloadURL  https://raw.githubusercontent.com/justBimp/gp-mod/main/dist/core.user.js
// ==/UserScript==

'use strict';

(function() {
    // Configuration
    const CONFIG = {
        name: 'GarticPhone Enhanced Core',
        version: '4.2.0',
        github: 'https://github.com/justBimp/gp-mod',
        debug: false
    };

    // State management
    const state = {
        ws: null,
        authData: null,
        l10n: { lang: '', entries: {} },
        isInitialized: false
    };

    // Logger utility
    const logger = {
        log: (...args) => CONFIG.debug && console.log(`[${CONFIG.name}]`, ...args),
        info: (...args) => console.info(`[${CONFIG.name}]`, ...args),
        warn: (...args) => console.warn(`[${CONFIG.name}]`, ...args),
        error: (...args) => console.error(`[${CONFIG.name}]`, ...args)
    };

    // Event system
    const EventSystem = {
        events: new Map(),

        on(event, callback) {
            if (!this.events.has(event)) {
                this.events.set(event, []);
            }
            this.events.get(event).push(callback);
            document.addEventListener(`_${event}`, callback);
        },

        emit(event, detail = {}) {
            const customEvent = new CustomEvent(`_${event}`, {
                detail: { ...detail, timestamp: Date.now() }
            });
            document.dispatchEvent(customEvent);
        },

        off(event, callback) {
            const listeners = this.events.get(event);
            if (listeners) {
                const index = listeners.indexOf(callback);
                if (index > -1) {
                    listeners.splice(index, 1);
                    document.removeEventListener(`_${event}`, callback);
                }
            }
        }
    };

    // Enhanced WebSocket wrapper
    class EnhancedWebSocket extends WebSocket {
        constructor(url, protocols) {
            super(url, protocols);
            
            this._originalSend = super.send;
            this._listeners = new Map();
            
            // Get auth data safely
            try {
                state.authData = sessionStorage.getItem('gp_auth-data');
            } catch (e) {
                logger.error('Failed to get auth data:', e);
            }
            
            state.ws = this;
            
            // Dispatch connection event
            EventSystem.emit('ws_connected', {
                ws: this,
                url,
                authData: state.authData,
                l10n: state.l10n
            });
            
            this._setupListeners();
        }

        _setupListeners() {
            // Intercept messages
            super.addEventListener('message', (event) => {
                try {
                    EventSystem.emit('ws_message_received', {
                        originalEvent: event,
                        data: event.data,
                        ws: this
                    });
                } catch (e) {
                    logger.error('Error in message handler:', e);
                }
            });

            // Track connection state
            super.addEventListener('open', (event) => {
                EventSystem.emit('ws_opened', { event, ws: this });
            });

            super.addEventListener('close', (event) => {
                EventSystem.emit('ws_closed', { event, ws: this });
            });

            super.addEventListener('error', (event) => {
                EventSystem.emit('ws_error', { event, ws: this });
            });
        }

        send(data) {
            try {
                EventSystem.emit('ws_send_before', {
                    encodedPacket: data,
                    ws: this
                });
                
                // Allow event listeners to modify data
                const modifiedEvent = new CustomEvent('_ws_send_modify', {
                    detail: { data, ws: this },
                    cancelable: true
                });
                
                if (document.dispatchEvent(modifiedEvent)) {
                    this._originalSend.call(this, modifiedEvent.detail.data || data);
                    EventSystem.emit('ws_send_after', {
                        encodedPacket: data,
                        ws: this
                    });
                }
            } catch (e) {
                logger.error('Error sending WebSocket data:', e);
                throw e;
            }
        }

        // Override onmessage setter to ensure our listener stays
        set onmessage(handler) {
            if (handler) {
                const wrappedHandler = (event) => {
                    EventSystem.emit('ws_message_intercept', {
                        handler,
                        event,
                        ws: this
                    });
                    handler.call(this, event);
                };
                this._listeners.set('message', wrappedHandler);
                super.addEventListener('message', wrappedHandler);
            }
        }
    }

    // Enhanced XMLHttpRequest wrapper
    class EnhancedXMLHttpRequest extends XMLHttpRequest {
        constructor() {
            super();
            this.addEventListener('load', () => {
                if (this.responseText) {
                    EventSystem.emit('xhr_response', {
                        responseText: this.responseText,
                        status: this.status,
                        url: this.responseURL
                    });
                }
            });

            this.addEventListener('error', (error) => {
                EventSystem.emit('xhr_error', {
                    error,
                    url: this.responseURL
                });
            });
        }

        open(method, url, async = true, user, password) {
            EventSystem.emit('xhr_open', {
                method,
                url,
                async,
                xhr: this
            });
            return super.open(method, url, async, user, password);
        }

        send(body) {
            EventSystem.emit('xhr_send', {
                body,
                url: this._url,
                xhr: this
            });
            return super.send(body);
        }
    }

    // History state tracker
    const enhanceHistory = () => {
        const wrapHistoryMethod = (methodName) => {
            const original = History.prototype[methodName];
            History.prototype[methodName] = new Proxy(original, {
                apply: (target, thisArg, argumentsList) => {
                    try {
                        const [state, title, url] = argumentsList;
                        if (url) {
                            EventSystem.emit('url_changed', {
                                method: methodName,
                                url: typeof url === 'string' ? url : url?.url,
                                previousUrl: window.location.href,
                                state
                            });
                        }
                    } catch (e) {
                        logger.error(`Error in ${methodName} wrapper:`, e);
                    }
                    return target.apply(thisArg, argumentsList);
                }
            });
        };

        ['pushState', 'replaceState'].forEach(wrapHistoryMethod);
    };

    // Localization handler
    const setupLocalization = () => {
        document.addEventListener('_gp_l10n', ({ detail }) => {
            if (detail) {
                state.l10n = {
                    lang: detail.lang || '',
                    entries: { ...state.l10n.entries, ...detail.entries }
                };
                EventSystem.emit('l10n_updated', state.l10n);
            }
        });
    };

    // Update checker
    const setupUpdateChecker = () => {
        document.addEventListener('_check-for-updates', () => {
            EventSystem.emit('update_check', {
                ...CONFIG,
                currentVersion: CONFIG.version
            });
        });
    };

    // Performance monitoring
    const setupPerformanceMonitor = () => {
        if (window.PerformanceObserver) {
            const perfObserver = new PerformanceObserver((list) => {
                list.getEntries().forEach(entry => {
                    EventSystem.emit('performance_entry', entry);
                });
            });
            
            try {
                perfObserver.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
            } catch (e) {
                logger.warn('Performance monitoring not available:', e);
            }
        }
    };

    // Initialize everything
    const init = () => {
        if (state.isInitialized) return;
        
        logger.info(`Initializing ${CONFIG.name} v${CONFIG.version}`);
        
        // Replace constructors
        window.WebSocket = EnhancedWebSocket;
        window.XMLHttpRequest = EnhancedXMLHttpRequest;
        
        // Enhance history API
        enhanceHistory();
        
        // Setup event handlers
        setupLocalization();
        setupUpdateChecker();
        setupPerformanceMonitor();
        
        // Provide global access to event system (optional)
        if (CONFIG.debug) {
            window.gpMod = { EventSystem, state, logger };
        }
        
        // Emit initialization complete
        EventSystem.emit('initialized', CONFIG);
        state.isInitialized = true;
        
        logger.info('Core initialization complete');
    };

    // Start initialization
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
        EventSystem.emit('visibility_change', {
            isVisible: !document.hidden,
            timestamp: Date.now()
        });
    });

    // Error tracking
    window.addEventListener('error', (event) => {
        EventSystem.emit('global_error', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });

})();
