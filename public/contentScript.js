/* eslint-disable no-undef */
// Create sidebar container
const sidebar = document.createElement('div');
sidebar.id = 'mySidebar';
sidebar.style.position = 'fixed';
sidebar.style.top = '0';
sidebar.style.left = '0';
sidebar.style.width = '1000px';
sidebar.style.height = '100%';
sidebar.style.backgroundColor = 'white';
sidebar.style.boxShadow = '2px 0 5px rgba(0,0,0,0.5)';
sidebar.style.zIndex = '9999';
sidebar.style.overflowY = 'auto';
sidebar.style.display = 'none'; // Start hidden

// // Add content to the sidebar
// const sidebarContent = document.createElement('div');
// sidebarContent.id = 'root';
// sidebar.appendChild(sidebarContent);

// // Add a button to toggle the sidebar
// const toggleButton = document.createElement('button');
// toggleButton.textContent = 'Toggle Sidebar';
// toggleButton.style.position = 'fixed';
// toggleButton.style.top = '10px';
// toggleButton.style.left = '260px';
// toggleButton.style.zIndex = '10000';

// toggleButton.addEventListener('click', () => {
//   sidebar.style.display = sidebar.style.display === 'none' ? 'block' : 'none';
// });

// // Append sidebar and button to the body
// document.body.appendChild(sidebar);
// document.body.appendChild(toggleButton);

// // Load React build files
// const script = document.createElement('script');
// script.type = 'module';
// script.src = chrome.runtime.getURL('assets/main.js');
// document.body.appendChild(script);
