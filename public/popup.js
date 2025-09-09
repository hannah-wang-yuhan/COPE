document.getElementById('open-panel').addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'openSidePanel' });
});
