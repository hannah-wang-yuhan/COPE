// App.jsx
import { useRef, useState, useEffect } from 'react';
import ControlBar from './controlbar/ControlBar';
import Tabs from './tabs/Tabs';
import LabelConfig from './tabs/LabelConfig';
import RealTimeDisplay from './tabs/RealTimeDisplay';
import ResultAnalysis from './tabs/ResultAnalysis';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [record, setRecord] = useState(false);

  const injectExecutorScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) return;
  
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['executor.js'], // ⚠ 注意路径应和打包后结构一致
      }, () => {
        console.log('✅ executor.js 已注入');
      });
    });
  };
  
  const handleStart = () => {
    setRecord(true);
    injectExecutorScript();
  };

  const handleStop = () => {
    setRecord(false);
  };

  const handleExport = () => {
    console.log('导出');
  };

  const tabs = [
    { label: '标签配置', component: <LabelConfig /> },
    {
      label: '实时展示',
      component: (
        <RealTimeDisplay
          configList={[
            { label: '系统消息', collect: true, fields: ['时间戳', '文本'] },
            { label: '用户消息', collect: true, fields: ['时间戳', '文本'] },
          ]}
          messageData={{
            '系统消息': [
              { timestamp: '12:00:01', text: '欢迎使用本系统！' },
              { timestamp: '12:00:04', text: '好的，正在为您加载...' },
            ],
            '用户消息': [{ timestamp: '12:00:02', text: '你好，我想查天气' }],
          }}
        />
      ),
    },
    { label: '结果分析', component: <ResultAnalysis /> },
  ];

  return (
    <div>
      <ControlBar onStart={handleStart} onStop={handleStop} onExport={handleExport} />
      <Tabs tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab} />
      <div style={{ padding: 16 }}>{tabs[activeTab].component}</div>
    </div>
  );
}
