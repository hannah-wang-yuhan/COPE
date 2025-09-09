import React, { useEffect, useState } from 'react';

export default function ResultAnalysis() {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['cope_messages'], res => {
        if (Array.isArray(res?.cope_messages)) {
          setMessages(res.cope_messages);
        }
      });
    }

    if (!window.chrome?.runtime?.onMessage) return;

    function handleMessage(message) {
      if (message.type === 'updateData') {
        setMessages(prev => {
          const next = [...prev, ...message.payload];
          if (window.chrome?.storage?.local) {
            chrome.storage.local.set({ cope_messages: next });
          }
          return next;
        });
      }
    }

    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  const truncate = (text, maxLength = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
  };

  return (
    <div style={{ padding: '16px' }}>
      <h3>结果分析</h3>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thStyle}>时间戳</th>
            <th style={thStyle}>文本</th>
          </tr>
        </thead>
        <tbody>
          {messages.map((msg, i) => (
            <tr key={i}>
              <td style={tdStyle}>{msg.timestamp}</td>
              <td style={tdStyle}>{truncate(msg.text)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const thStyle = {
  borderBottom: '1px solid #ccc',
  padding: '8px',
  textAlign: 'left',
  backgroundColor: '#f8f8f8'
};

const tdStyle = {
  borderBottom: '1px solid #eee',
  padding: '8px'
};

