# 初始化项目
cd <根目录路径>
npm install
npm run build 
(生成dist文件夹，在 “chrome浏览器 -- 扩展程序 -- 管理扩展成程序 -- 加载未打包的扩展程序” 中，选择 dist 文件地址，打开，即可调试插件)

# 插件使用
本插件目前在开发阶段，仅支持 ChatGPT 平台内对话与时间戳爬取展示，使用步骤如下：
1. 在扩展程序中找到插件，点击“···”，选择“打开侧边栏”；
2. 点击开始，切换到“结果分析”栏目；
3. 此时可在插件页面上观察到历史对话记录与新对话记录。
！！ 请注意，为了获取消息发出的真实时间，并高效率地获取完整对话内容，这里进行缓冲存储 + 防抖的操作，即获取消息的时间戳取自消息标签产生的时间，消息的内容取自消息标签稳定的时刻，因此，在获取新记录时，如有延迟，实属正常。
！！ 请注意，由于目前正处于开发阶段，状态清除并未完善，故在每次结束调试后，请在扩展程序内关闭该插件，防止影响浏览器性能和 ChatGPT 的使用。

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
