import React, { useState } from 'react';
import '../styles/labelconfig.css';
import MessageLabelBlock from './MessageLabelBlock';

export default function LabelConfig() {

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log('对话容器:', dialogValue);
        console.log('输入容器:', inputValue);
        // 可添加表单校验和提交逻辑
    };

    return (
        <form className="label-config-form" onSubmit={handleSubmit}>
            <div className="form-section">
                <h3>整体网站</h3>
                <MessageLabelBlock
                    title="滚动"
                    showLabelInput={false}
                    showContentFields={false}
                    showBehaviorFields={false}
                    required={false}
                />
                <MessageLabelBlock
                    title="驻留"
                    showLabelInput={false}
                    showContentFields={false}
                    showBehaviorFields={false}
                    required={false}
                />

            </div>
            <div className="form-section">
                <h3>对话容器</h3>
                <MessageLabelBlock
                    title="系统消息"
                    showLabelInput={true}
                    showContentFields={true}
                    contentTitle="收集内容："
                    contentOptions={['时间戳', '文本']}
                    showBehaviorFields={true}
                    behaviorTitle="收集行为："
                    behaviorOptions={['悬停', '驻留', '点击', '复制']}
                    required={true}
                />

                <MessageLabelBlock
                    title="用户消息"
                    showLabelInput={true}
                    showContentFields={true}
                    contentTitle="收集内容："
                    contentOptions={['时间戳', '文本']}
                    showBehaviorFields={true}
                    behaviorTitle="收集行为："
                    behaviorOptions={['悬停', '驻留', '点击', '复制']}
                    required={true}
                />

            </div>

            <div className="form-section">
                <h3>输入容器</h3>
                <MessageLabelBlock
                    title="停止生成按钮"
                    showLabelInput={true}
                    showContentFields={false}
                    showBehaviorFields={false}
                    required={false}
                />

            </div>

            <button type="submit" className="submit-button">提交</button>
        </form>
    );
}
