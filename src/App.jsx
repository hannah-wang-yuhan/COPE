// App.jsx
import { useRef, useState, useEffect } from 'react';
import ControlBar from './controlbar/ControlBar';
import Tabs from './tabs/Tabs';
import ResultAnalysis from './tabs/ResultAnalysis';
import EventsGeneral from './tabs/EventsGeneral';
import EventsButtons from './tabs/EventsButtons';

export default function App() {
  const [activeTab, setActiveTab] = useState(0);
  const [record, setRecord] = useState(false);

  const injectExecutorScript = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const tab = tabs[0];
      if (!tab || !tab.id) return;
  
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['executor.js'], 
      }, () => {
        console.log('executor.js 已注入');
      });
    });
  };
  
  const handleStart = () => {
    setRecord(true);
    injectExecutorScript();
  };

const handleStop = () => {
  setRecord(false);
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.id) return;

    chrome.tabs.sendMessage(tab.id, { type: 'stopListening' }, () => {
      console.log('已发送停止监听指令');
    });
  });
};



  const tabs = [
    { label: '文本', component: <ResultAnalysis /> },
    { label: '常规事件', component: <EventsGeneral /> },
    { label: '网页按钮事件', component: <EventsButtons /> },
  ];

  return (
    <div>
      <ControlBar onStart={handleStart} onStop={handleStop}/>
      <Tabs tabs={tabs} activeIndex={activeTab} onTabChange={setActiveTab} />
      <div style={{ padding: 16 }}>{tabs[activeTab].component}</div>
    </div>
  );
}
