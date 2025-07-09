// Executor.jsx
import { useImperativeHandle, forwardRef, useRef } from 'react';

const Executor = forwardRef((props, ref) => {
  const observerRef = useRef(null);

  // 主监听函数
  const recordChrome = () => {
    console.log('🚀 Executor 开始监听 Chrome 事件');
  
    // 初始捕捉已有节点
    captureAllMatchingElements();
  
    // 设置监听 DOM 变化
    observerRef.current = new MutationObserver(() => {
      captureAllMatchingElements();
    });
  
    observerRef.current.observe(document.body, {
      childList: true,
      subtree: true,
    });
  };
  
  // 匹配并提取文本内容的函数
  const captureAllMatchingElements = () => {
    const selector = '.text-base.my-auto.mx-auto.py-5';
    const elements = document.querySelectorAll(selector);
  
    elements.forEach((el) => {
      const timestamp = new Date().toLocaleTimeString();
      const textContent = el.innerText || el.textContent || '';
  
      console.log(`🧩 发现目标元素 at ${timestamp}`);
      console.log('➡️ 内容：', textContent.trim());
  
      // 如果要存储，可以 push 到一个状态数组里 or 存入 chrome.storage
    });
  };
  

  const stopRecordChrome = () => {
    console.log('🛑 Executor 停止监听');
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  };

  useImperativeHandle(ref, () => ({
    recordChrome,
    stopRecordChrome,
  }));

  return null;
});

export default Executor;
