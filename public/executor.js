const selector = '.text-base.my-auto.mx-auto.py-5';

const observedElements = new Map(); 
// Map<HTMLElement, { firstSeen: Date, lastText: string, timeoutId: number|null, sent: boolean }>

function sendCapturedData(data) {
  chrome.runtime.sendMessage({ type: 'capturedData', payload: data });
}

function debounceSend(el, elData) {
  if (elData.timeoutId) clearTimeout(elData.timeoutId);
  elData.timeoutId = setTimeout(() => {
    if (!elData.sent) {
      sendCapturedData([{
        timestamp: elData.firstSeen.toISOString(),
        text: elData.lastText,
      }]);
      elData.sent = true;
    }
  }, 1000); // 1秒不变，发送一次
}

function observeElement(el) {
  if (observedElements.has(el)) return;

  const elData = {
    firstSeen: new Date(),
    lastText: el.innerText.trim(),
    timeoutId: null,
    sent: false,
  };
  observedElements.set(el, elData);

  // 观察文本变化
  const mo = new MutationObserver(() => {
    const newText = el.innerText.trim();
    if (newText !== elData.lastText && !elData.sent) {
      elData.lastText = newText;
      debounceSend(el, elData);
    }
  });
  mo.observe(el, { childList: true, subtree: true, characterData: true });

  // 初次出现时不发，只更新lastText，等待稳定后发送
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

const observer = new MutationObserver(scanAndObserve);
observer.observe(document.body, { childList: true, subtree: true });

scanAndObserve();

console.log('[Executor] 监听启动完成');

