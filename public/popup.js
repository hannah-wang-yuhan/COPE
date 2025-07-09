// popup.js

document.getElementById('open-panel').addEventListener('click', () => {
  // Send a message to the background script to open the side panel
  chrome.runtime.sendMessage({ action: 'openSidePanel' });
});
