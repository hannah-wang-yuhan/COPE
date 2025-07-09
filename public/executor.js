(() => {
    const selector = '.text-base.my-auto.mx-auto.py-5';
    const observedElements = new Map();
    let mutationObserver = null;
    let isListening = false;

    ////注入指令////
    function sendCapturedData(data) {
        if (chrome && chrome.runtime && chrome.runtime.sendMessage) {
            chrome.runtime.sendMessage({ type: 'capturedData', payload: data });
        } else {
            console.warn('chrome.runtime.sendMessage 不可用，可能上下文失效，数据未发送', data);
        }
    }

    ////防抖////
    function debounceSend(el, elData) {
        if (elData.timeoutId) clearTimeout(elData.timeoutId);

        elData.timeoutId = setTimeout(() => {
            // 先检查文本是否为空，如果是，延迟重试（最多重试3次）
            if (!elData.lastText) {
                elData.retryCount = (elData.retryCount || 0) + 1;
                if (elData.retryCount <= 3) {
                    // 重新取文本更新，再次调用 debounceSend 继续等待
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

    ////字典键生成////
    function generateMsgId(text, timestamp) {
        return 'msg_' + btoa(encodeURIComponent(text + timestamp)).slice(0, 8);
    }

    ////元素观察函数////
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
            elData.clickCount += 1;
        });

        el.addEventListener('mouseenter', () => {
            elData.hoverCount += 1;
            elData.hoverStartTime = Date.now();
        });

        el.addEventListener('mouseleave', () => {
            if (elData.hoverStartTime) {
                const duration = Date.now() - elData.hoverStartTime;
                elData.hoverDuration += duration;
                elData.hoverStartTime = null;
            }
        });

        el.addEventListener('copy', (e) => {
            const copiedText = window.getSelection()?.toString().trim();
            if (copiedText) {
                elData.copyCount += 1;
                elData.copyDetails.push({
                    text: copiedText,
                    length: copiedText.length,
                    timestamp: new Date().toISOString(),
                });
            }
        });

        debounceSend(el, elData);
    }



    function scanAndObserve() {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (!observedElements.has(el)) {
                observeElement(el);
            }
        });
    }

    ////对消息的行为指标////

    ////起止状态控制，结果输出////
    function startListening() {
        if (isListening) return;
        mutationObserver = new MutationObserver(scanAndObserve);
        mutationObserver.observe(document.body, { childList: true, subtree: true });
        scanAndObserve();
        isListening = true;
        console.log('[Executor] 监听启动完成');
    }

    function stopListening() {
        if (!isListening) return {};
    
        if (mutationObserver) mutationObserver.disconnect();
    
        const result = {};
    
        observedElements.forEach((elData, el) => {
            if (elData.mo) elData.mo.disconnect();
            if (elData.timeoutId) clearTimeout(elData.timeoutId);
            if (elData.hoverStartTime) {
                elData.hoverDuration += Date.now() - elData.hoverStartTime;
                elData.hoverStartTime = null;
            }
    
            result[elData.msgId] = {
                text: elData.lastText,
                time_stamp: elData.firstSeen.toISOString(),
                count_num: elData.clickCount || 0,
                hover_count: elData.hoverCount || 0,
                hover_duration_ms: elData.hoverDuration || 0,
                copy_count: elData.copyCount || 0,
                copy_details: elData.copyDetails || []
            };
        });
    
        console.log('[行为数据收集完成]', result);
    
        // 生成 JSON 字符串
        const jsonStr = JSON.stringify(result, null, 2);
        // 创建一个 Blob 对象
        const blob = new Blob([jsonStr], { type: 'application/json' });
        // 创建一个临时 URL
        const url = URL.createObjectURL(blob);
        // 创建一个隐藏的下载链接
        const a = document.createElement('a');
        a.href = url;
        a.download = `behavior_data_${new Date().toISOString()}.json`;
        document.body.appendChild(a);
        a.click();
        // 释放 URL 对象
        URL.revokeObjectURL(url);
        // 移除链接
        document.body.removeChild(a);
    
        observedElements.clear();
        isListening = false;
    
        return result; // 返回数据字典
    }
    


    window.addEventListener('unload', () => {
        stopListening();
    });

    startListening();

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (message.type === 'stopListening') {
            const result = stopListening(); // 获取数据
            sendResponse(result);           // 正确返回数据
            return true;                    // 告诉浏览器这是一条异步消息
        }

        return false;
    });



})();