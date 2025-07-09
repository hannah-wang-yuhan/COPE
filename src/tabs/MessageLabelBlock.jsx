import React, { useState, useEffect } from 'react';
import '../styles/messagelabelblock.css';

export default function MessageLabelBlock({
  title,
  showLabelInput = true,
  showContentFields = false,
  contentTitle = '',
  contentOptions = [],
  showBehaviorFields = false,
  behaviorTitle = '',
  behaviorOptions = [],
  required = false, // 是否需要校验至少勾选一项
}) {
  const [collect, setCollect] = useState(false);
  const [labelName, setLabelName] = useState('');

  const [contentFields, setContentFields] = useState([]);
  const [behaviorFields, setBehaviorFields] = useState([]);

  const toggleOption = (option, selectedList, setter) => {
    setter((prev) =>
      prev.includes(option)
        ? prev.filter((o) => o !== option)
        : [...prev, option]
    );
  };

  const toggleAll = (options, setter) => {
    setter((prev) =>
      prev.length === options.length ? [] : [...options]
    );
  };

  useEffect(() => {
    if (!collect) {
      setLabelName('');
      setContentFields([]);
      setBehaviorFields([]);
    }
  }, [collect]);

  const isValid =
    !required || !collect ||
    (showContentFields && contentFields.length > 0) ||
    (showBehaviorFields && behaviorFields.length > 0);

  return (
    <div className={`label-block ${isValid ? '' : 'invalid'}`}>
      <h4>{title}</h4>

      {/* 第一行：是否收集 & 标签名 */}
      <div className="row">
        <label>
          <input
            type="checkbox"
            checked={collect}
            onChange={(e) => setCollect(e.target.checked)}
          />
          是否收集
        </label>
        {collect && showLabelInput && (
          <label style={{ marginLeft: '16px' }}>
            selector：
            <input
              type="text"
              value={labelName}
              onChange={(e) => setLabelName(e.target.value)}
              placeholder="请输入标签名"
              style={{ marginLeft: '8px' }}
            />
          </label>
        )}
      </div>

      {/* 第二行：内容字段 */}
      {collect && showContentFields && (
        <div className="row">
          <span style={{ marginRight: 8 }}>{contentTitle}</span>
          {contentOptions.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={contentFields.includes(option)}
                onChange={() =>
                  toggleOption(option, contentFields, setContentFields)
                }
              />
              {option}
            </label>
          ))}
          <button
            type="button"
            onClick={() => toggleAll(contentOptions, setContentFields)}
            className="small-btn"
          >
            全选
          </button>
        </div>
      )}

      {/* 第三行：行为字段 */}
      {collect && showBehaviorFields && (
        <div className="row">
          <span style={{ marginRight: 8 }}>{behaviorTitle}</span>
          {behaviorOptions.map((option) => (
            <label key={option}>
              <input
                type="checkbox"
                checked={behaviorFields.includes(option)}
                onChange={() =>
                  toggleOption(option, behaviorFields, setBehaviorFields)
                }
              />
              {option}
            </label>
          ))}
          <button
            type="button"
            onClick={() => toggleAll(behaviorOptions, setBehaviorFields)}
            className="small-btn"
          >
            全选
          </button>
        </div>
      )}

      {!isValid && (
        <div className="warning-text">
          ⚠ 请至少勾选一项收集内容或行为指标
        </div>
      )}
    </div>
  );
}

