import React, { useEffect, useState } from 'react';

export default function EventsGeneral() {
  const [clicks, setClicks] = useState([]);
  const [hovers, setHovers] = useState([]);
  const [scrolls, setScrolls] = useState([]);

  useEffect(() => {
    if (window.chrome?.storage?.local) {
      chrome.storage.local.get(['cope_clicks', 'cope_hovers', 'cope_scrolls'], res => {
        if (Array.isArray(res?.cope_clicks)) setClicks(res.cope_clicks);
        if (Array.isArray(res?.cope_hovers)) setHovers(res.cope_hovers);
        if (Array.isArray(res?.cope_scrolls)) setScrolls(res.cope_scrolls);
      });
    }

    if (!window.chrome?.runtime?.onMessage) return;
    function handleMessage(message) {
      if (message.type === 'messageClick') {
        setClicks(prev => {
          const next = [
            ...prev,
            { timestamp: message.payload.timestamp, index: message.payload.index, msgId: message.payload.msgId }
          ];
          if (window.chrome?.storage?.local) chrome.storage.local.set({ cope_clicks: next });
          return next;
        });
      } else if (message.type === 'messageHover') {
        setHovers(prev => {
          const next = [
            ...prev,
            {
              timestamp: message.payload.timestamp,
              index: message.payload.index,
              msgId: message.payload.msgId,
              durationMs: message.payload.durationMs
            }
          ];
          if (window.chrome?.storage?.local) chrome.storage.local.set({ cope_hovers: next });
          return next;
        });
      } else if (message.type === 'scrollSession') {
        setScrolls(prev => {
          const next = [ ...prev, message.payload ];
          if (window.chrome?.storage?.local) chrome.storage.local.set({ cope_scrolls: next });
          return next;
        });
      }
    }
    chrome.runtime.onMessage.addListener(handleMessage);
    return () => chrome.runtime.onMessage.removeListener(handleMessage);
  }, []);

  return (
    <div style={{ padding: 16 }}>
      <h3>常规事件</h3>

      <h4>点击事件</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>时间戳</th>
            <th style={thStyle}>消息序号</th>
            <th style={thStyle}>消息ID</th>
          </tr>
        </thead>
        <tbody>
          {clicks.map((c, i) => (
            <tr key={`c-${i}`}>
              <td style={tdStyle}>{c.timestamp}</td>
              <td style={tdStyle}>{c.index}</td>
              <td style={tdStyle}>{c.msgId}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ marginTop: 16 }}>悬浮事件</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>时间戳</th>
            <th style={thStyle}>消息序号</th>
            <th style={thStyle}>消息ID</th>
            <th style={thStyle}>悬浮时长(ms)</th>
          </tr>
        </thead>
        <tbody>
          {hovers.map((h, i) => (
            <tr key={`h-${i}`}>
              <td style={tdStyle}>{h.timestamp}</td>
              <td style={tdStyle}>{h.index}</td>
              <td style={tdStyle}>{h.msgId}</td>
              <td style={tdStyle}>{h.durationMs}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h4 style={{ marginTop: 16 }}>滚动事件</h4>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={thStyle}>开始时间</th>
            <th style={thStyle}>结束时间</th>
            <th style={thStyle}>起始top</th>
            <th style={thStyle}>结束top</th>
            <th style={thStyle}>距离</th>
            <th style={thStyle}>方向</th>
            <th style={thStyle}>边界</th>
          </tr>
        </thead>
        <tbody>
          {scrolls.map((s, i) => (
            <tr key={`s-${i}`}>
              <td style={tdStyle}>{s.startTime}</td>
              <td style={tdStyle}>{s.endTime}</td>
              <td style={tdStyle}>{s.startScrollTop}</td>
              <td style={tdStyle}>{s.endScrollTop}</td>
              <td style={tdStyle}>{s.distance}</td>
              <td style={tdStyle}>{s.direction}</td>
              <td style={tdStyle}>{s.edge}</td>
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


