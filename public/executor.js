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
          if (Date.now() - lastDragEndAt < 250) { 
            ev.preventDefault(); 
            ev.stopPropagation(); 
            return; 
          }
      
          if (!isListening) {
            startListening();
            setFinishUI();
            currentPress = { startTime: new Date().toISOString() };
          } else {
      
            
            setStartUI();
            if (currentPress) {
              currentPress.finishTime = new Date().toISOString();
              pressEvents.push(currentPress);
              currentPress = null;
            }
            stopListening();
          }
        } catch (e) {
          console.error(e);
        }
      });
      
      

      setStartUI();
    }
  
    //const selector = '.text-base.my-auto.mx-auto';
    
    // 每组消息容器
    const groupSelector = '.isolate.mx-auto.px-md';
    // 子级选择器
    const userSelector = 'div[class*="mb-xs group"]';
    const systemSelector = 'div[class*="py-md md"]';
    const systemButtonSelecter = 'div[class*="-mx-md px-md scrollbar"]';
    const systemRelatedSelector = 'div[class*="py-sm group"]';
    
    //const scrollSelector = '.flex.h-full.flex-col.overflow-y-auto';
    const scrollSelector = '.scrollable-container';
    const observedElements = new Map();
    const indexMap = {}; 
  
    let mutationObserver = null;
    let isListening = false;
    let scrollEl = null;
    let scrollHandler = null;
    let scrollEvents = [];
    let overallButtons = [];
    let pressEvents = [];
    let currentPress = null;
    let ignoreNextScroll = false;
    let buttonClickHandler = null;
    // 提升滚动状态到模块级，避免多闭包并发
    let __copeScrollSession = null;
    let __copeScrollDebounceTimer = null;
    let __copeLastPush = [];

 
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
        try { chrome.runtime.sendMessage({ type: 'capturedData', payload: data }); } catch (_) { /* ignore */ }
      } else {
        console.warn('chrome.runtime.sendMessage 不可用，数据未发送', data);
      }
    }

    // 安全发送，避免扩展上下文失效时报错
    function safeSend(message) {
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id && typeof chrome.runtime.sendMessage === 'function') {
          chrome.runtime.sendMessage(message);
        }
      } catch (_) { /* ignore */ }
    }
  
    function generateMsgId() {
      return 'msg_' + Date.now() + '_' + Math.random().toString(36).slice(2, 10);
    }
  
    function observeElement(el, role) {
      if (observedElements.has(el)) return;
  
      const firstSeen = new Date();
      const msgId = generateMsgId();
  
      const elData = {
        firstSeen,
        lastText: '',
        timeoutId: null,
        countDetail: [],    
        hoverDetail: [],    
        copyDetails: [],
        buttons: [],
        index: null,
        msgId,
        role,
        pushedToIndex: false,
        navigateDetails: [],
        pendingNavigate: null,
        // 当前系统消息使用的按钮名称，用于控制文本是否允许覆盖
        activeSystemButtonName: 'Answer',
        // 当前系统按钮模式下的流式文本记录索引（指向 buttons 数组项）
        activeButtonStreamIdx: null
      };
  
      observedElements.set(el, elData);
  
     
      const mo = new MutationObserver(() => {
        const newText = getFilteredInnerText(el);
        if (newText !== elData.lastText) {
          
          if (elData.role === 'user' && elData.pushedToIndex) {
            return;
          }
          // system：仅当当前系统按钮为 Answer 时允许覆盖文本
          if (elData.role === 'system' && elData.pushedToIndex && (elData.activeSystemButtonName || '').toLowerCase() !== 'answer') {
            // 不覆盖 lastText，将文本作为本次按钮变更的 text 字段流式写入 buttons 中
            const now = new Date().toISOString();
            if (elData.activeButtonStreamIdx == null) {
              elData.buttons.push({ name: elData.activeSystemButtonName || 'unknown', timestamp: now, text: newText });
              elData.activeButtonStreamIdx = elData.buttons.length - 1;
            } else {
              
              const idx = elData.activeButtonStreamIdx;
              const prev = elData.buttons[idx] || {};
              elData.buttons[idx] = { ...prev, name: elData.activeSystemButtonName || prev.name || 'unknown', timestamp: now, text: newText };
            }
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
                  count_detail: elData.countDetail,
                  hover_detail: elData.hoverDetail,                  
                  copy_details: elData.copyDetails,
                  buttons: elData.buttons,
                  navigate_details: elData.navigateDetails
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
                    count_detail: elData.countDetail,
                    hover_detail: elData.hoverDetail,
                    copy_details: elData.copyDetails,
                    buttons: elData.buttons,
                    navigate_details: elData.navigateDetails
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
        const now = new Date().toISOString();
        elData.countDetail.push(now);
        chrome?.runtime?.sendMessage?.({
          type: 'messageClick',
          payload: { msgId: elData.msgId, index: elData.index, timestamp: now }
        });
      });
      
  
      // 悬停事件
      el.addEventListener('mouseenter', () => {
        elData.hoverStartTime = Date.now();
      });
      
      el.addEventListener('mouseleave', () => {
        if (elData.hoverStartTime) {
          const duration = Date.now() - elData.hoverStartTime;
          if (duration >= 1000) { // 只记录超过1000ms
            const start = new Date(elData.hoverStartTime).toISOString();
            elData.hoverDetail.push({ start, duration });
      
            chrome?.runtime?.sendMessage?.({
              type: 'messageHover',
              payload: { msgId: elData.msgId, index: elData.index, durationMs: duration, timestamp: start }
            });
          }
          elData.hoverStartTime = null;
        }
      });
      
  
     

      // 导航行为监听
      function handleLinkClick(event) {
        const link = event.target.closest('a[href]');
        if (!link) return;
        
        const href = link.href;
        const target = link.target;
        
        if (target === '_blank' || (event.ctrlKey || event.metaKey)) {
          event.preventDefault();
          
          
          const isInlineCitation = !!link.closest('div.citation.inline, .citation.inline, [class*="citation inline"], .gap-two.flex.px-5.pb-2.pt-1');
          const isTabCitation = !!link.closest('div.citation.inline, .citation.inline, [class*="gap-sm grid"]');

          const navigateStart = {
            destination: href,
            start_timestamp: new Date().toISOString(),
            return_timestamp: null,
            ...(isInlineCitation ? { source: 'inline_link' } : (isTabCitation ? { source: 'tab_link' } : { source: 'source_button' }))
          };
          
          elData.pendingNavigate = navigateStart;
          elData.navigateDetails.push(navigateStart);
          
         
          window.open(href, '_blank');
          
         
          const handleFocus = () => {
            if (elData.pendingNavigate && elData.pendingNavigate.destination === href) {
              elData.pendingNavigate.return_timestamp = new Date().toISOString();
              elData.pendingNavigate = null;
              
             
              window.removeEventListener('focus', handleFocus);
            }
          };
          
          window.addEventListener('focus', handleFocus);
          
         
          setTimeout(() => {
            window.removeEventListener('focus', handleFocus);
            if (elData.pendingNavigate && elData.pendingNavigate.destination === href) {
              elData.pendingNavigate.return_timestamp = new Date().toISOString();
              elData.pendingNavigate = null;
            }
          }, 5000);
        }
      }

      // 监听消息元素内的链接点击
      el.addEventListener('click', handleLinkClick, true);

    }
  
    function tryAttachScrollListener() {
      if (!isListening) return;

      const matches = Array.from(document.querySelectorAll(scrollSelector));
      const divs = matches.filter(n => n && n.tagName === 'DIV');
      let el = divs.find(n => (n.scrollHeight || 0) > (n.clientHeight || 0)) || divs[0];
      if (!el) return;

    
	  if (scrollEl === el && el.__copeScrollHandler__) return;
      
	  if (scrollEl && scrollHandler) {
	    try { scrollEl.removeEventListener('scroll', scrollHandler); } catch(_) {}
	  }
	  if (scrollEl && scrollEl.__copeScrollHandler__) {
	    try { scrollEl.removeEventListener('scroll', scrollEl.__copeScrollHandler__); } catch(_) {}
	    scrollEl.__copeScrollHandler__ = null;
	  }
	
	  scrollEl = el;
	  if (!Array.isArray(__copeLastPush)) __copeLastPush = [];
	  const SIGNIFICANT_MOVE_PX = 5;
			
		
		scrollHandler = () => {
			if (ignoreNextScroll) { ignoreNextScroll = false; return; }
		
			const scrollTop = el.scrollTop || 0;
			const scrollHeight = el.scrollHeight || 0;
			const clientHeight = el.clientHeight || 0;
			const maxScrollable = Math.max(1, scrollHeight - clientHeight);
		
			let edge = 'none';
			if (scrollTop <= 0) edge = 'top';
			else if (scrollTop >= maxScrollable - 2) edge = 'bottom';
		
			if (!__copeScrollSession) {
				__copeScrollSession = { 
					startTime: new Date().toISOString(), 
					startScrollTop: scrollTop, 
					edge, 
					path: [] 
				};
			} else {
				if (edge !== 'none') __copeScrollSession.edge = edge;
			}
		
		const delta = scrollTop - __copeScrollSession.startScrollTop;
		if (__copeScrollSession._lastScrollTop == null) __copeScrollSession._lastScrollTop = scrollTop;
		const deltaSinceLast = scrollTop - __copeScrollSession._lastScrollTop;
		__copeScrollSession._lastScrollTop = scrollTop;
			
			// 获取所有可见的消息元素
			const visibleEls = [];
			observedElements.forEach((data, msgEl) => {
				const rect = msgEl.getBoundingClientRect();
				if (rect.bottom > 0 && rect.top < window.innerHeight) {
					visibleEls.push(msgEl);
				}
			});
			
			let currentVisible = [];
			visibleEls.forEach(msgEl => {
				const data = observedElements.get(msgEl);
				if (data && data.index != null) currentVisible.push(data.index);
			});
			
			const newIndexes = currentVisible.filter(idx => !__copeLastPush.includes(idx));
			
			if (delta > 0) newIndexes.sort((a, b) => a - b);
			else if (delta < 0) newIndexes.sort((a, b) => b - a);
			
			__copeScrollSession.path.push(...newIndexes);
			
			__copeLastPush = currentVisible.slice();
			
			let direction = 'none';
			if (__copeScrollSession.path.length > 1) {
				let isAsc = true, isDesc = true;
				for (let i = 1; i < __copeScrollSession.path.length; i++) {
					if (__copeScrollSession.path[i] > __copeScrollSession.path[i - 1]) isDesc = false;
					else if (__copeScrollSession.path[i] < __copeScrollSession.path[i - 1]) isAsc = false;
				}
				if (isAsc) direction = 'down';
				else if (isDesc) direction = 'up';
				else direction = 'mixed';
			}
			
		// 防抖处理：仅当显著位移时才重置计时器
		if (Math.abs(deltaSinceLast) >= SIGNIFICANT_MOVE_PX) {
			if (__copeScrollDebounceTimer) clearTimeout(__copeScrollDebounceTimer);
			__copeScrollDebounceTimer = setTimeout(() => {
				if (__copeScrollSession) {
					const endTime = new Date().toISOString();
					const endScrollTop = scrollTop;
					const distance = endScrollTop - __copeScrollSession.startScrollTop;
					const payload = { 
						startTime: __copeScrollSession.startTime, 
						endTime, 
						startScrollTop: __copeScrollSession.startScrollTop, 
						endScrollTop, 
						distance, 
						edge: __copeScrollSession.edge, 
						direction, 
						path: __copeScrollSession.path 
					};
					console.log('[scroll segment]', payload);
					scrollEvents.push(payload);
					safeSend({ type: 'scrollSession', payload });
          console.log('update scrollSession');
					__copeScrollSession = null;
				}
			}, 800);
		}
		};
  
      

      try { el.addEventListener('scroll', scrollHandler, { passive: true }); } catch(_) { el.addEventListener('scroll', scrollHandler); }
      el.__copeScrollHandler__ = scrollHandler;
    }

  
    function scanAndObserve() {
      if (!isListening) return;
      
      const groups = document.querySelectorAll(groupSelector);
      
      groups.forEach(group => {
        const userMsg = group.querySelector(userSelector);
        const systemMsg = group.querySelector(systemSelector);
        
        if (userMsg) observeElement(userMsg, 'user');
        if (systemMsg) observeElement(systemMsg, 'system');
      });

      // 更新索引：按消息组为单位，保证 user 为奇数 (2*q-1)，system 为偶数 (2*q)
      let q = 1;
      groups.forEach(group => {
        const u = group.querySelector(userSelector);
        const s = group.querySelector(systemSelector);
        if (u && observedElements.has(u)) {
          const d = observedElements.get(u);
          if (d) d.index = 2 * q - 1;
        }
        if (s && observedElements.has(s)) {
          const d = observedElements.get(s);
          if (d) d.index = 2 * q;
        }
        q++;
      });

      observedElements.forEach((data, el) => {
        if (!data) return;

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
                count_detail: data.countDetail,
                hover_detail: data.hoverDetail,
                copy_details: data.copyDetails,
                buttons: data.buttons,
                navigate_details: data.navigateDetails
              }
            });
          
            data.pushedToIndex = true;
          }
        }
      });
  
      tryAttachScrollListener();
    }
    
    function observeGlobalButtons() {
        const globalButtonSelector = 'div.erp-sidecar\\:fixed.erp-sidecar\\:w-full.bottom-safeAreaInsetBottom.p-md.pointer-events-none.absolute.z-10.border-subtlest.ring-subtlest.divide-subtlest.bg-transparent';
        const globalButtonContainer = document.querySelector(globalButtonSelector);
        if (!globalButtonContainer) return;
        if (window.__globalButtonObserver__) {
          window.__globalButtonObserver__.disconnect();
          window.__globalButtonObserver__ = null;
        }
      }

      
    function startListening() {
      if (isListening) return;
      isListening = true;

      
  
      mutationObserver = new MutationObserver(scanAndObserve);
      mutationObserver.observe(document.body, { childList: true, subtree: true });
      scanAndObserve();

      observeGlobalButtons();

      if (!buttonClickHandler) {
        buttonClickHandler = event => {
          const targetEl = event.target instanceof Element ? event.target : null;
          if (!targetEl) return;

          const group = targetEl.closest(groupSelector);

          // Related 区域
          const relatedItem = targetEl.closest(systemRelatedSelector);
          if (relatedItem && group) {
            const systemMsg = group.querySelector(systemSelector);
            if (systemMsg && observedElements.has(systemMsg)) {
              const data = observedElements.get(systemMsg);
              const now2 = new Date().toISOString();
              const relatedText = (relatedItem.innerText || relatedItem.textContent || '').trim();
              data.buttons.push({ name: 'Related', timestamp: now2, text: relatedText });
            }
            return; 
          }

          const button = targetEl.closest('button');
          if (!button) return;
          
          let msgEl = null;
          let elData = null;
          
          if (group) {
            const userMsg = group.querySelector(userSelector);
            const systemMsg = group.querySelector(systemSelector);
            const systemBtnScope = group.querySelector(systemButtonSelecter);
            
            
            if (userMsg && userMsg.contains(button)) {
              msgEl = userMsg;
            }
            
            else if (systemMsg && systemMsg.contains(button)) {
              msgEl = systemMsg;
            }
            // 扩展：如果按钮位于系统按钮范围内，也归属到当前组的 system 消息
            else if (systemBtnScope && systemBtnScope.contains(button)) {
              if (systemMsg) {
                msgEl = systemMsg;
              } else {
               
              }
            }
          }
          
         
          if (msgEl && observedElements.has(msgEl)) {
            elData = observedElements.get(msgEl);
          const name = button.getAttribute('aria-label') || button.getAttribute('data-testid') || button.innerText?.trim() || 'unknown';
            const now = new Date().toISOString();
           
            if (elData.role === 'system') {
              elData.activeSystemButtonName = name || elData.activeSystemButtonName;
              elData.activeButtonStreamIdx = null; 
            } else {
             
              elData.buttons.push({ name, timestamp: now });
            }
          }
          

          // 全局按钮
          const globalButtonSelector = 'div.erp-sidecar\\:fixed.erp-sidecar\\:w-full.bottom-safeAreaInsetBottom.p-md.pointer-events-none.absolute.z-10.border-subtlest.ring-subtlest.divide-subtlest.bg-transparent';
          const globalButtonContainer = document.querySelector(globalButtonSelector);
          if (globalButtonContainer && globalButtonContainer.contains(button)) {
            const name = button.getAttribute('aria-label') || button.getAttribute('data-testid') || button.innerText?.trim() || 'unknown';
            overallButtons.push({ name, timestamp: new Date().toISOString() });
          }
        };
        document.addEventListener('click', buttonClickHandler, true);
      }

      // 全局复制事件监听器
      if (!window.__COPE_copyHandler__) {
        window.__COPE_copyHandler__ = (event) => {
          const copiedText = window.getSelection()?.toString().trim();
          if (!copiedText) return;

    
          const selection = window.getSelection();
          if (selection.rangeCount > 0) {
            const range = selection.getRangeAt(0);
            const container = range.commonAncestorContainer;
            const element = container.nodeType === Node.TEXT_NODE ? container.parentElement : container;
            
          
            observedElements.forEach((elData, msgEl) => {
              if (msgEl.contains(element)) {
                elData.copyDetails.push({ 
                  text: copiedText, 
                  length: copiedText.length, 
                  timestamp: new Date().toISOString() 
                });
              }
            });
          }
        };
        document.addEventListener('copy', window.__COPE_copyHandler__, true);
      }
    }
  
    function stopListening() {
      if (!isListening) return {};
  
      if (mutationObserver) mutationObserver.disconnect();
      if (scrollEl && scrollHandler) scrollEl.removeEventListener('scroll', scrollHandler);
      if (buttonClickHandler) document.removeEventListener('click', buttonClickHandler, true);
      if (window.__COPE_copyHandler__) document.removeEventListener('copy', window.__COPE_copyHandler__, true);
      if (window.__globalButtonObserver__) window.__globalButtonObserver__.disconnect();
  
      observedElements.forEach(elData => {
        if (elData.mo) elData.mo.disconnect();
      });
  
      const result = { ...indexMap, scroll: scrollEvents.slice(), overallButton: overallButtons.slice(), press: pressEvents.slice() };
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
      pressEvents = [];
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
  