(() => {
    if (window.__COPE_EXEC_RUNNING__) return;
    window.__COPE_EXEC_RUNNING__ = true;
  
    const selector = '.text-base.my-auto.mx-auto';
    const scrollSelector = '.flex.h-full.flex-col.overflow-y-auto';
    const observedElements = new Map();
    const indexMap = {}; 
  
    let mutationObserver = null;
    let isListening = false;
    let scrollEl = null;
    let scrollHandler = null;
    let scrollEvents = [];
    let overallButtons = [];
    let ignoreNextScroll = false;
    let buttonClickHandler = null;
  
    function sendCapturedData(data) {
      if (chrome?.runtime?.sendMessage) {
        chrome.runtime.sendMessage({ type: 'capturedData', payload: data });
      } else {
        console.warn('chrome.runtime.sendMessage 不可用，数据未发送', data);
      }
    }
  
    function generateMsgId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }
  
    function observeElement(el) {
      if (observedElements.has(el)) return;
  
      const firstSeen = new Date();
      const msgId = generateMsgId();
  
      let role;
      const article = el.closest('article[data-turn]');
      if (article) {
        const turn = article.getAttribute('data-turn');
        role = turn === 'user' ? 'user' : 'system';
      }
  
      const elData = {
        firstSeen,
        lastText: '',
        timeoutId: null,
        clickCount: 0,
        hoverCount: 0,
        hoverDuration: 0,
        hoverStartTime: null,
        copyCount: 0,
        copyDetails: [],
        buttons: [],
        index: null,
        msgId,
        role,
        pushedToIndex: false
      };
  
      observedElements.set(el, elData);
  
     
      const mo = new MutationObserver(() => {
        const newText = el.innerText.trim();
        if (newText !== elData.lastText) {
          elData.lastText = newText;
  
          
          if (elData.index != null) {
            if (!indexMap[elData.index]) indexMap[elData.index] = [];
  
            const queue = indexMap[elData.index];
            if (!elData.pushedToIndex) {
              // 初次 push
              queue.push({
                [elData.msgId]: {
                  text: elData.lastText,
                  time_stamp: elData.firstSeen.toISOString(),
                  role: elData.role,
                  count_num: elData.clickCount,
                  hover_count: elData.hoverCount,
                  hover_duration_ms: elData.hoverDuration,
                  copy_count: elData.copyCount,
                  copy_details: elData.copyDetails,
                  buttons: elData.buttons
                }
              });
              elData.pushedToIndex = true;
            } else {
              // 更新已有 msgId
              for (let item of queue) {
                if (item[elData.msgId]) {
                  item[elData.msgId] = {
                    text: elData.lastText,
                    time_stamp: elData.firstSeen.toISOString(),
                    role: elData.role,
                    count_num: elData.clickCount,
                    hover_count: elData.hoverCount,
                    hover_duration_ms: elData.hoverDuration,
                    copy_count: elData.copyCount,
                    copy_details: elData.copyDetails,
                    buttons: elData.buttons
                  };
                }
              }
            }
          }
        }
      });
      mo.observe(el, { childList: true, subtree: true, characterData: true });
      elData.mo = mo;
  
      // 点击事件
      el.addEventListener('click', () => {
        elData.clickCount++;
        chrome?.runtime?.sendMessage?.({
          type: 'messageClick',
          payload: { msgId: elData.msgId, index: elData.index, timestamp: new Date().toISOString() }
        });
      });
  
      // 悬停事件
      el.addEventListener('mouseenter', () => { elData.hoverCount++; elData.hoverStartTime = Date.now(); });
      el.addEventListener('mouseleave', () => {
        if (elData.hoverStartTime) {
          const duration = Date.now() - elData.hoverStartTime;
          elData.hoverDuration += duration;
          elData.hoverStartTime = null;
          chrome?.runtime?.sendMessage?.({
            type: 'messageHover',
            payload: { msgId: elData.msgId, index: elData.index, durationMs: duration, timestamp: new Date().toISOString() }
          });
        }
      });
  
      // 复制事件
      el.addEventListener('copy', () => {
        const copiedText = window.getSelection()?.toString().trim();
        if (copiedText) {
          elData.copyCount++;
          elData.copyDetails.push({ text: copiedText, length: copiedText.length, timestamp: new Date().toISOString() });
        }
      });
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
        if (ignoreNextScroll) { ignoreNextScroll = false; return; }
        const scrollTop = el.scrollTop || 0;
        const scrollHeight = el.scrollHeight || 0;
        const clientHeight = el.clientHeight || 0;
        const maxScrollable = Math.max(1, scrollHeight - clientHeight);
  
        let edge = 'none';
        if (scrollTop <= 0) edge = 'top';
        else if (scrollTop >= maxScrollable - 2) edge = 'bottom';
  
        if (!session) session = { startTime: new Date().toISOString(), startScrollTop: scrollTop, edge, directions: new Set() };
        else {
          const delta = scrollTop - session.startScrollTop;
          if (delta > 0) session.directions.add('down');
          else if (delta < 0) session.directions.add('up');
          if (edge !== 'none') session.edge = edge;
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
            const payload = { startTime: session.startTime, endTime, startScrollTop: session.startScrollTop, endScrollTop, distance, edge: session.edge, direction: finalDirection };
            scrollEvents.push(payload);
            chrome?.runtime?.sendMessage?.({ type: 'scrollSession', payload });
            session = null;
          }
        }, 500);
      };
  
      el.addEventListener('scroll', scrollHandler, { passive: true });
    }
  
    function scanAndObserve() {
      if (!isListening) return;
      const elements = document.querySelectorAll(selector);
  
      elements.forEach(el => { if (!observedElements.has(el)) observeElement(el); });
  
      elements.forEach((el, i) => {
        const data = observedElements.get(el);
        if (!data) return;
        const prevIndex = data.index;
        data.index = i + 1;

        // !!!初次设置 index 时，若已存在完整文本（非流式），立即 push 一条记录，防止空队列
        if (!data.pushedToIndex && data.index != null) {
          const currentText = el.innerText.trim();
          if (currentText) {
            data.lastText = currentText;
            if (!indexMap[data.index]) indexMap[data.index] = [];
            indexMap[data.index].push({
              [data.msgId]: {
                text: data.lastText,
                time_stamp: data.firstSeen.toISOString(),
                role: data.role,
                count_num: data.clickCount,
                hover_count: data.hoverCount,
                hover_duration_ms: data.hoverDuration,
                copy_count: data.copyCount,
                copy_details: data.copyDetails,
                buttons: data.buttons
              }
            });
            data.pushedToIndex = true;
          }
        }
      });
  
      tryAttachScrollListener();
    }
    
    function observeThreadBottomButtons() {
        const threadBottom = document.getElementById('thread-bottom');
        if (!threadBottom) return;
      
       
        if (window.__threadBottomObserver__) window.__threadBottomObserver__.disconnect();
      
        const observer = new MutationObserver(mutations => {
          mutations.forEach(m => {
            m.addedNodes.forEach(node => {
              if (!(node instanceof HTMLElement)) return;
      
             
              const buttons = node.tagName === 'BUTTON' ? [node] : Array.from(node.querySelectorAll('button'));
              buttons.forEach(button => {
                button.addEventListener('click', e => {
                  const name = button.getAttribute('aria-label') || button.getAttribute('data-testid') || button.innerText?.trim() || 'unknown';
                  overallButtons.push({ name, timestamp: new Date().toISOString() });
                }, { once: false });
              });
            });
          });
        });
      
        observer.observe(threadBottom, { childList: true, subtree: true });
        window.__threadBottomObserver__ = observer;
      
        
        const existingButtons = threadBottom.querySelectorAll('button');
        existingButtons.forEach(button => {
          button.addEventListener('click', e => {
            const name = button.getAttribute('aria-label') || button.getAttribute('data-testid') || button.innerText?.trim() || 'unknown';
            overallButtons.push({ name, timestamp: new Date().toISOString() });
          }, { once: false });
        });
      }

      
    function startListening() {
      if (isListening) return;
      isListening = true;
  
      mutationObserver = new MutationObserver(scanAndObserve);
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      scanAndObserve();

      observeThreadBottomButtons();

      if (!buttonClickHandler) {
        buttonClickHandler = event => {
          const button = event.target.closest('button');
          if (!button) return;
          const msgEl = button.closest(selector);
          if (!msgEl) return;
          if (!observedElements.has(msgEl)) observeElement(msgEl);
  
          const elData = observedElements.get(msgEl);
          if (!elData) return;
          const name = button.getAttribute('aria-label') || button.getAttribute('data-testid') || button.innerText?.trim() || 'unknown';
          elData.buttons.push({ name, timestamp: new Date().toISOString() });
          elData.clickCount++;

         
          const threadBottom = document.getElementById('thread-bottom');
          if (threadBottom && threadBottom.contains(button)) {
            overallButtons.push({ name, timestamp: new Date().toISOString() });
          }
        };
        document.addEventListener('click', buttonClickHandler, true);
      }
    }
  
    function stopListening() {
      if (!isListening) return {};
  
      if (mutationObserver) mutationObserver.disconnect();
      if (scrollEl && scrollHandler) scrollEl.removeEventListener('scroll', scrollHandler);
      if (buttonClickHandler) document.removeEventListener('click', buttonClickHandler, true);
  
      observedElements.forEach(elData => {
        if (elData.mo) elData.mo.disconnect();
        if (elData.hoverStartTime) elData.hoverDuration += Date.now() - elData.hoverStartTime;
      });
  
      const result = { ...indexMap, scroll: scrollEvents.slice(), overallButton: overallButtons.slice() };
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
      overallButtons = [];
  
      return result;
    }
  
    window.addEventListener('unload', () => { try { stopListening(); } finally { window.__COPE_EXEC_RUNNING__ = false; } });
  
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
  