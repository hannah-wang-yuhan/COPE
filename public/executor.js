(() => {
    if (window.__COPE_EXEC_RUNNING__) {
        return;
    }
    window.__COPE_EXEC_RUNNING__ = true;
    const selector = '.text-base.my-auto.mx-auto';
    const scrollSelector = '.flex.h-full.flex-col.overflow-y-auto';
    const observedElements = new Map();
    let mutationObserver = null;
    let isListening = false;
    let scrollEl = null;
    let scrollHandler = null;
    let scrollEvents = [];
    let ignoreNextScroll = false; 
    let buttonClickHandler = null;

    function sendCapturedData(data) {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'capturedData', payload: data });
        } else {
            console.warn('chrome.runtime.sendMessage 不可用，可能上下文失效，数据未发送', data);
        }
    }

    function debounceSend(el, elData) {
        if (elData.timeoutId) clearTimeout(elData.timeoutId);

        elData.timeoutId = setTimeout(() => {
            if (!elData.lastText) {
                elData.retryCount = (elData.retryCount || 0) + 1;
                if (elData.retryCount <= 3) {
                    elData.lastText = el.innerText.trim();
                    debounceSend(el, elData);
                    return;
                }
            }

            if (!elData.sent && elData.lastText) {
                sendCapturedData([{
                    timestamp: elData.firstSeen.toISOString(),
                    text: elData.lastText,
                }]);
                elData.sent = true;
            }
        }, 2000);
    }

    function generateMsgId(text, timestamp) {
        return 'msg_' + btoa(encodeURIComponent(text + timestamp)).slice(0, 8);
    }

    function observeElement(el) {
        if (observedElements.has(el)) return;

        const text = el.innerText.trim();
        const firstSeen = new Date();
        const msgId = generateMsgId(text, firstSeen.toISOString());

        const elData = {
            firstSeen,
            lastText: text,
            timeoutId: null,
            sent: false,
            clickCount: 0,
            hoverCount: 0,
            hoverDuration: 0,
            hoverStartTime: null,
            copyCount: 0,
            copyDetails: [],
            buttons: [],
            index: null,
            msgId,
        };
        observedElements.set(el, elData);

        const mo = new MutationObserver(() => {
            const newText = el.innerText.trim();
            if (newText !== elData.lastText && !elData.sent) {
                elData.lastText = newText;
                debounceSend(el, elData);
            }
        });
        mo.observe(el, { childList: true, subtree: true, characterData: true });
        elData.mo = mo;

        el.addEventListener('click', () => {
            elData.clickCount++;
            if (chrome?.runtime?.sendMessage) {
                chrome.runtime.sendMessage({
                    type: 'messageClick',
                    payload: {
                        msgId: elData.msgId,
                        index: elData.index,
                        timestamp: new Date().toISOString()
                    }
                });
            }
        });
        el.addEventListener('mouseenter', () => {
            elData.hoverCount++;
            elData.hoverStartTime = Date.now();
        });
        el.addEventListener('mouseleave', () => {
            if (elData.hoverStartTime) {
                const duration = Date.now() - elData.hoverStartTime;
                elData.hoverDuration += duration;
                elData.hoverStartTime = null;
                if (chrome?.runtime?.sendMessage) {
                    chrome.runtime.sendMessage({
                        type: 'messageHover',
                        payload: {
                            msgId: elData.msgId,
                            index: elData.index,
                            durationMs: duration,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            }
        });
        el.addEventListener('copy', () => {
            const copiedText = window.getSelection()?.toString().trim();
            if (copiedText) {
                elData.copyCount++;
                elData.copyDetails.push({
                    text: copiedText,
                    length: copiedText.length,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        debounceSend(el, elData);
    }

    function tryAttachScrollListener() {
        if (!isListening) return;
        const el = document.querySelector(scrollSelector);
        if (!el) return;

        if (scrollEl && scrollHandler) scrollEl.removeEventListener('scroll', scrollHandler);
        scrollEl = el;

        let session = null;
        let debounceTimer = null;

        scrollHandler = () => {
            if (ignoreNextScroll) {
                ignoreNextScroll = false;
                return;
            }

            const scrollTop = el.scrollTop || 0;
            const scrollHeight = el.scrollHeight || 0;
            const clientHeight = el.clientHeight || 0;
            const maxScrollable = Math.max(1, scrollHeight - clientHeight);

            let edge = "none";
            if (scrollTop <= 0) edge = "top";
            else if (scrollTop >= maxScrollable - 2) edge = "bottom";

            if (!session) {
                session = {
                    startTime: new Date().toISOString(),
                    startScrollTop: scrollTop,
                    edge: edge,
                    directions: new Set()
                };
            } else {
                const delta = scrollTop - session.startScrollTop;
                if (delta > 0) session.directions.add('down');
                else if (delta < 0) session.directions.add('up');
                if (edge !== "none") session.edge = edge;
            }

            if (debounceTimer) clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                if (session) {
                    const endTime = new Date().toISOString();
                    const endScrollTop = scrollTop;
                    const distance = endScrollTop - session.startScrollTop;

                    let finalDirection;
                    if (session.directions.size === 1) finalDirection = [...session.directions][0];
                    else if (session.directions.size > 1) finalDirection = 'mixed';
                    else finalDirection = 'none';

                    const payload = {
                        startTime: session.startTime,
                        endTime,
                        startScrollTop: session.startScrollTop,
                        endScrollTop,
                        distance,
                        edge: session.edge,
                        direction: finalDirection
                    };

                    console.log('[ScrollSession]', payload);
                    scrollEvents.push(payload);

                    if (chrome?.runtime?.sendMessage) {
                        chrome.runtime.sendMessage({ type: 'scrollSession', payload });
                    }

                    session = null;
                }
            }, 500);
        };

        el.addEventListener('scroll', scrollHandler, { passive: true });
        console.log('[Executor] 滚动监听已挂载到容器', scrollSelector);
    }

    function scanAndObserve() {
        if (!isListening) return;
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!observedElements.has(el)) {
                observeElement(el);
                ignoreNextScroll = true;
            }
        });

        elements.forEach((el, i) => {
            const data = observedElements.get(el);
            if (data) data.index = i + 1;
        });

        tryAttachScrollListener();
    }

    function startListening() {
        if (isListening) return;
        isListening = true;
        mutationObserver = new MutationObserver(scanAndObserve);
        mutationObserver.observe(document.body, { childList: true, subtree: true });
        scanAndObserve();
        console.log('[Executor] 监听启动完成');

        if (!buttonClickHandler) {
            buttonClickHandler = (event) => {
                const button = event.target.closest('button');
                if (!button) return;

                const msgEl = button.closest(selector);
                if (!msgEl) return;

                if (!observedElements.has(msgEl)) {
                    observeElement(msgEl);
                }

                const elData = observedElements.get(msgEl);
                if (!elData) return;

                const name = button.getAttribute('aria-label')
                    || button.getAttribute('data-testid')
                    || button.innerText?.trim()
                    || 'unknown';

                if (!elData.buttons) elData.buttons = [];
                elData.buttons.push({
                    name,
                    timestamp: new Date().toISOString()
                });

                elData.clickCount = (elData.clickCount || 0) + 1;
                if (chrome?.runtime?.sendMessage) {
                    chrome.runtime.sendMessage({
                        type: 'buttonClick',
                        payload: {
                            msgId: elData.msgId,
                            index: elData.index,
                            name,
                            timestamp: new Date().toISOString()
                        }
                    });
                }
            };
            document.addEventListener('click', buttonClickHandler, true);
        }
    }

    function stopListening() {
        if (!isListening) return {};

        if (mutationObserver) mutationObserver.disconnect();
        if (scrollEl && scrollHandler) scrollEl.removeEventListener('scroll', scrollHandler);
        scrollEl = null;
        scrollHandler = null;
        if (buttonClickHandler) {
            document.removeEventListener('click', buttonClickHandler, true);
        }
        buttonClickHandler = null;

        const result = {};

        observedElements.forEach((elData, el) => {
            if (elData.mo) elData.mo.disconnect();
            if (elData.timeoutId) clearTimeout(elData.timeoutId);
            if (elData.hoverStartTime) {
                elData.hoverDuration += Date.now() - elData.hoverStartTime;
                elData.hoverStartTime = null;
            }

            result[elData.msgId] = {
                index: elData.index,
                text: elData.lastText,
                time_stamp: elData.firstSeen.toISOString(),
                count_num: elData.clickCount || 0,
                hover_count: elData.hoverCount || 0,
                hover_duration_ms: elData.hoverDuration || 0,
                copy_count: elData.copyCount || 0,
                copy_details: elData.copyDetails || [],
                buttons: elData.buttons || []
            };
        });
        result.scroll = scrollEvents.slice();
        
        console.log('[行为数据收集完成]', result);

        const jsonStr = JSON.stringify(result, null, 2);
        const blob = new Blob([jsonStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `behavior_data_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        URL.revokeObjectURL(url);
        document.body.removeChild(a);

        observedElements.clear();
        isListening = false;

        
        scrollEvents = [];

        return result;
    }

    window.addEventListener('unload', () => {
        try { stopListening(); } finally { window.__COPE_EXEC_RUNNING__ = false; }
    });

    startListening();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'stopListening') {
            const result = stopListening();
            sendResponse(result);
            window.__COPE_EXEC_RUNNING__ = false;
            return true;
        }
        return false;
    });

})();
