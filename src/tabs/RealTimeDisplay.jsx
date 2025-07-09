import React from 'react';
import '../styles/realtimedisplay.css';

export default function RealTimeDisplay({ configList, messageData }) {
  // configList 是多个标签配置块的结构，例如：
  // [
  //   {
  //     label: '系统消息',
  //     collect: true,
  //     fields: ['时间戳', '文本']
  //   },
  //   ...
  // ]

  return (
    <div className="live-display">
      {configList
        .filter(cfg => cfg.collect)
        .map((cfg, idx) => (
          <div key={idx} className="message-table-block">
            <h4>{cfg.label}</h4>
            <table className="message-table">
              <thead>
                <tr>
                  {cfg.fields.includes('时间戳') && <th>时间戳</th>}
                  {cfg.fields.includes('文本') && <th>文本</th>}
                  {/* 可以扩展更多字段 */}
                </tr>
              </thead>
              <tbody>
                {(messageData[cfg.label] || []).map((msg, i) => (
                  <tr key={i}>
                    {cfg.fields.includes('时间戳') && <td>{msg.timestamp}</td>}
                    {cfg.fields.includes('文本') && (
                      <td>{truncate(msg.text, 100)}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}

function truncate(text, maxLength) {
  if (!text) return '';
  return text.length > maxLength ? text.slice(0, maxLength) + '…' : text;
}
