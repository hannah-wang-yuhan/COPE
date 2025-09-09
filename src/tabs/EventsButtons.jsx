import React, { useEffect, useState } from 'react';

export default function EventsButtons() {
  const [buttons, setButtons] = useState([]);

  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['cope_buttons'], res => {
        if (Array.isArray(res?.cope_buttons)) setButtons(res.cope_buttons);
      });
    }

    if (!window.chrome?.runtime?.onMessage) return;
    function handleMessage(message) {
      if (message.type === 'buttonClick') {
        setButtons(prev => {
          const next = [
            ...prev,
            {
              timestamp: message.payload.timestamp,
              index: message.payload.index,
              msgId: message.payload.msgId,
              name: message.payload.name
            }
          ];
          if (window.chrome?.storage?.local) chrome.storage.local.set({ cope_buttons: next });
          return next;
        });
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>网页按钮事件</h3>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>时间戳</th>
            <th style={thStyle}>消息序号</th>
            <th style={thStyle}>消息ID</th>
            <th style={thStyle}>按钮名称</th>
          </tr>
        </thead>
        <tbody>
          {buttons.map((b, i) => (
            <tr key={`b-${i}`}>
              <td style={tdStyle}>{b.timestamp}</td>
              <td style={tdStyle}>{b.index}</td>
              <td style={tdStyle}>{b.msgId}</td>
              <td style={tdStyle}>{b.name}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const tableStyle = { width: '100%', borderCollapse: 'collapse' };
const thStyle = { borderBottom: '1px solid #ccc', padding: '8px', textAlign: 'left', backgroundColor: '#f8f8f8' };
const tdStyle = { borderBottom: '1px solid #eee', padding: '8px' };


