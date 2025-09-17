(() => {
    if (window.__COPE_EXEC_RUNNING__) return;
    window.__COPE_EXEC_RUNNING__ = true;
  
    // 注入UI
    function injectFloatingPanel() {
      if (document.getElementById("cope-floating-panel")) return; 
  
      const panel = document.createElement("div");
      panel.id = "cope-floating-panel";
      panel.innerHTML = `
        <button id=\"cope-close-btn\" title=\"关闭\" style=\"position:absolute;right:-4px;top:-4px;width:15px;height:15px;border:none;background:transparent;color:#333;font-size:12px;cursor:pointer;line-height:12px\">×</button>
        <div id=\"cope-round-btn\" style=\"width:100px;height:100px;border-radius:50%;border:1px solid #a7a6cb;background:linear-gradient(#a7a6cb 0 28%, #e6e9f0 28% 100%);display:flex;flex-direction:column;align-items:center;justify-content:center;box-shadow:0 6px 16px rgba(0,0,0,0.2);cursor:pointer;user-select:none\">
          <div id=\"cope-title\" style=\"font-size:20px;font-weight:700;color:#111;text-shadow:0 2px 2px rgba(0,0,0,.2);margin-top:12px\">Start</div>
          <div id=\"cope-sub\" style=\"margin-top:6px;font-size:10px;color:#222\">点击开始监听</div>
        </div>
      `;
  
      // 右下角固定
      Object.assign(panel.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        width: "120px",
        height: "110px",
        zIndex: 999999,
        background: "transparent",
        fontFamily: "Arial, sans-serif"
      });
      
      document.body.appendChild(panel);
      // 尝试恢复历史位置
      loadPosition();
  
      const closeBtn = document.getElementById("cope-close-btn");
      const roundBtn = document.getElementById("cope-round-btn");
      const titleEl = document.getElementById("cope-title");
      const subEl = document.getElementById("cope-sub");
      roundBtn.style.transition = 'transform 180ms ease, background 180ms ease';
      roundBtn.style.cursor = 'grab';

    
      const POS_KEY = '__cope_panel_pos__';
      function savePosition(left, top) {
        try { localStorage.setItem(POS_KEY, JSON.stringify({ left, top })); } catch (_) {}
      }
      function loadPosition() {
        try {
          const raw = localStorage.getItem(POS_KEY);
          if (!raw) return;
          const { left, top } = JSON.parse(raw);
          if (Number.isFinite(left) && Number.isFinite(top)) {
            panel.style.left = left + 'px';
            panel.style.top = top + 'px';
            panel.style.right = '';
            panel.style.bottom = '';
          }
        } catch (_) {}
      }

      function setBaseBackground(lightColor = '#e6e9f0') {
        roundBtn.style.background = `linear-gradient(#a7a6cb 0 28%, ${lightColor} 28% 100%)`;
      }

      function setStartUI() {
        titleEl.textContent = 'Start';
        subEl.textContent = '点击开始监听';
        setBaseBackground('#e6e9f0');
      }

      function setFinishUI() {
        titleEl.textContent = 'Finish';
        subEl.textContent = '进行中，点击结束';
        setBaseBackground('#e6e9f0');
      }

      roundBtn.addEventListener('mouseenter', () => {
        setBaseBackground('#dad4ec');
        roundBtn.style.transform = 'translateY(-1px) scale(1.04)';
      });
      roundBtn.addEventListener('mouseleave', () => {
        setBaseBackground('#e6e9f0');
        roundBtn.style.transform = 'translateY(0) scale(1)';
      });

      // 鼠标/触控拖拽
      let dragging = false;
      let dragMoved = false;
      let lastDragEndAt = 0;
      let startX = 0, startY = 0, startLeft = 0, startTop = 0;
      function beginDrag(clientX, clientY) {
        dragging = true;
        dragMoved = false;
        roundBtn.style.cursor = 'grabbing';
        document.body.style.userSelect = 'none';
        const rect = panel.getBoundingClientRect();
        panel.style.left = rect.left + 'px';
        panel.style.top = rect.top + 'px';
        panel.style.right = '';
        panel.style.bottom = '';
        startX = clientX; startY = clientY;
        startLeft = rect.left; startTop = rect.top;
      }
      function moveDrag(clientX, clientY) {
        if (!dragging) return;
        const dx = clientX - startX;
        const dy = clientY - startY;
        if (!dragMoved && Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
        const maxLeft = window.innerWidth - panel.offsetWidth;
        const maxTop = window.innerHeight - panel.offsetHeight;
        let nextLeft = Math.min(Math.max(0, startLeft + dx), Math.max(0, maxLeft));
        let nextTop = Math.min(Math.max(0, startTop + dy), Math.max(0, maxTop));
        panel.style.left = nextLeft + 'px';
        panel.style.top = nextTop + 'px';
      }
      function endDrag() {
        if (!dragging) return;
        dragging = false;
        roundBtn.style.cursor = 'grab';
        document.body.style.userSelect = '';
        const rect = panel.getBoundingClientRect();
        savePosition(rect.left, rect.top);
        if (dragMoved) {
          lastDragEndAt = Date.now();
        }
      }
      
      roundBtn.addEventListener('mousedown', (e) => { beginDrag(e.clientX, e.clientY); });
      window.addEventListener('mousemove', (e) => { moveDrag(e.clientX, e.clientY); });
      window.addEventListener('mouseup', endDrag);
      roundBtn.addEventListener('touchstart', (e) => { const t = e.touches[0]; beginDrag(t.clientX, t.clientY); }, { passive: true });
      window.addEventListener('touchmove', (e) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); }, { passive: false });
      window.addEventListener('touchend', endDrag);

      closeBtn?.addEventListener("click", () => { panel.remove(); });
      roundBtn?.addEventListener("click", (ev) => {
        try {
          if (Date.now() - lastDragEndAt < 250) { ev.preventDefault(); ev.stopPropagation(); return; }
          if (!isListening) {
            startListening();
            setFinishUI();
          } else {
            stopListening();
            setStartUI();
          }
        } catch (e) {}
      });

      setStartUI();
    }
  
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

 
  function getFilteredInnerText(root) {
    try {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let text = '';
      let node;
      while ((node = walker.nextNode())) {
        const parent = node.parentElement;
        if (!parent) continue;
        if (parent.closest('textarea,button')) continue;
        text += node.nodeValue || '';
      }
      return text.replace(/\s+/g, ' ').trim();
    } catch (_) {
      return (root.innerText || '').trim();
    }
  }
  
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
        copyDetails: [],
        buttons: [],
        index: null,
        msgId,
        role,
        pushedToIndex: false
      };
  
      observedElements.set(el, elData);
  
     
    const mo = new MutationObserver(() => {
      const newText = getFilteredInnerText(el);
      if (newText !== elData.lastText) {
        // 对于 user 消息：一旦已入队（首条文本已记录），后续不再覆盖文本
        if (elData.role === 'user' && elData.pushedToIndex) {
          return;
        }
        elData.lastText = newText;
  
          
          if (elData.index != null) {
            if (!indexMap[elData.index]) indexMap[elData.index] = [];
  
            const queue = indexMap[elData.index];
            if (!elData.pushedToIndex) {
              
              queue.push({
                [elData.msgId]: {
                  text: elData.lastText,
                  time_stamp: elData.firstSeen.toISOString(),
                  role: elData.role,
                  count_num: elData.clickCount,
                  hover_count: elData.hoverCount,
                  hover_duration_ms: elData.hoverDuration,
                  copy_details: elData.copyDetails,
                  buttons: elData.buttons
                }
              });
              elData.pushedToIndex = true;
            } else {
              // 更新已有 msgId（非 user || user 未锁定时）
              if (!(elData.role === 'user')) {
                for (let item of queue) {
                  if (item[elData.msgId]) {
                  item[elData.msgId] = {
                    text: elData.lastText,
                    time_stamp: elData.firstSeen.toISOString(),
                    role: elData.role,
                    count_num: elData.clickCount,
                    hover_count: elData.hoverCount,
                    hover_duration_ms: elData.hoverDuration,
                    copy_details: elData.copyDetails,
                    buttons: elData.buttons
                  };
                  }
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
      // 优先选择匹配选择器下的可滚动 DIV（避免绑定到 nav）
      const matches = Array.from(document.querySelectorAll(scrollSelector));
      const divs = matches.filter(n => n && n.tagName === 'DIV');
      let el = divs.find(n => (n.scrollHeight || 0) > (n.clientHeight || 0))
            || divs[0]
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
      const currentText = getFilteredInnerText(el);
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
  
   
    try { injectFloatingPanel(); } catch (e) {}
  
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
  