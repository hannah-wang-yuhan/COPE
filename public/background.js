// /* eslint-disable no-undef */
// chrome.action.onClicked.addListener((tab) => {
//   chrome.scripting.executeScript({
//     target: { tabId: tab.id },
//     files: ['contentScript.js']
//   });
// });

// // Function to open the side panel
// function openSidePanel() {
//   chrome.sidePanel.setOptions({
//     path: 'side_panel.html'  // Path to your side panel HTML file
//   }).then(() => {
//     console.log("Side panel is opened.");
//   }).catch((error) => {
//     console.error("Error opening side panel: ", error);
//   });
// }

// // Listen for a browser action click (if you have a browser action defined)
// chrome.action.onClicked.addListener((tab) => {
//   openSidePanel();
// });

// // You could also trigger the side panel open in other ways, such as responding to a message
// chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
//   if (request.action === 'openSidePanel') {
//     openSidePanel();
//     sendResponse({status: 'side panel opened'});
//   }
// });

chrome.runtime.onInstalled.addListener(() => {
  console.log('Extension installed');
  //chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.tabs.onCreated.addListener(function(tab) {
  //console.log('New tab opened:', tab);

  chrome.storage.local.get(['recStarted'], function(result) {
    const recStarted = result.recStarted || false;
    if(recStarted && tab.openerTabId) {
      //setTimeout(() => {
        chrome.runtime.sendMessage({
          type: "tab_created",
          URL: tab.pendingUrl || tab.url,
          urlTarget: tab.url
        });
      //}, 750);
    }
  });
});


// Initialize an object to keep track of navigation types
//let navigationDetails1 = {};

chrome.webNavigation.onCommitted.addListener(details => {
  const { tabId, url, transitionType, transitionQualifiers } = details;

  // console.log(`Type: ${transitionType}, Qualifiers: ${transitionQualifiers}`);

  // // Store the navigation details for the tab
  // //navigationDetails1[tabId] = transitionType;


  // if (transitionType === 'typed' || transitionType === 'generated') {
  //   console.log('User changed URL manually or through hint');
  // } else if (transitionType === 'link') {
  //   console.log('User clicked on a link');
  // } else if (transitionType === 'auto_bookmark') {
  //   console.log('User used a bookmark');
  // } else if (transitionType === 'form_submit') {
  //   console.log('Form submitted:', details);
  // } else if (transitionType === 'reload') {
  //   console.log('User reloaded the page');
  // } else if (transitionType === 'keyword') {
  //   console.log('User used a keyword');
  // } else if (transitionType === 'keyword_generated') {
  //   console.log('User used a generated keyword');
  // } else if (transitionType === 'auto_subframe') {
  //   console.log('Navigation was initiated by the browser');
  // } else if (transitionType === 'manual_subframe') {
  //   console.log('Navigation was initiated by the browser');
  // } else if (transitionType === 'start_page') {
  //   console.log('User navigated to the start page');
  // }

  // // Check for other transition types if needed
  // // Refer to the Chrome extension documentation for a full list of transition types:
  // // https://developer.chrome.com/docs/extensions/reference/webNavigation/#transition_types

  // // Check transition qualifiers for additional details
  // if (transitionQualifiers.includes('from_address_bar')) {
  //   console.log('Navigation was initiated from the address bar');
  // }
  // else if(transitionQualifiers.includes('client_redirect')) {
  //   console.log('Client redirect');
  // }
  // else if(transitionQualifiers.includes('server_redirect')) {
  //   console.log('Server redirect');
  // }
  // else if(transitionQualifiers.includes('forward_back')) {
  //   console.log('Forward or back');
  // }

  chrome.storage.local.get(['recStarted'], function(result) {
    const recStarted = result.recStarted || false;
    if(recStarted) {

      console.log(`Type: ${transitionType}, Qualifiers: ${transitionQualifiers}`);

      if ((transitionQualifiers.includes('from_address_bar') || transitionQualifiers.includes('forward_back')) || 
          (transitionType === 'typed' || transitionType === 'generated' || transitionType === 'auto_bookmark')) {

          console.log(`Type: ${transitionType}, Qualifiers: ${transitionQualifiers}`);
        //setTimeout(() => {
          chrome.runtime.sendMessage({
            type: 'navigate',
            URL: url
          });
        //}, 750);
      }
    }
  });
});


// Initialize an empty object to store URLs for each tab
var urls = {};

chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.url) {
    urls[tabId] = changeInfo.url;
    // Check the recorded navigation type for this tab
    //const transitionType = navigationDetails1[tabId];

    // chrome.storage.local.get(['recStarted'], function (result) {
    //   recStarted = result.recStarted || false;
    //   if (recStarted) {
    //     //console.log(`Navigation committed: Tab ID ${details.tabId}, Transition Type: ${details.transitionType}`);

    //     setTimeout(() => {
    //       chrome.runtime.sendMessage({
    //         type: "navigate",
    //         URL: changeInfo.url
    //       });
    //     }, 750);
    //   }
    // });
    
    // Optionally, clear the recorded navigation type after processing
    //delete navigationDetails1[tabId];
  }
});


chrome.tabs.onRemoved.addListener(function(tabId, removeInfo) {
  chrome.storage.local.get(['recStarted'], function(result) {
    const recStarted = result.recStarted || false;
    if(recStarted) {
      if (urls[tabId]) {
        var closedTabUrl = urls[tabId];
        console.log('Tab closed:', closedTabUrl);

        chrome.runtime.sendMessage({
          type: "tab_closed",
          URL: closedTabUrl
        });
        // Remove the URL from the urls object to prevent memory leaks
        delete urls[tabId];
      } else {
        // If the URL is not available, log a warning message
        console.warn('URL of closed tab not available:', tabId);
      }
    }
  });
});

//Tab switching
// chrome.tabs.onActivated.addListener(function(activeInfo) {
//   chrome.storage.local.get(['recStarted'], function(result) {
//     recStarted = result.recStarted || false;
//     if(recStarted) {
//       chrome.tabs.get(activeInfo.tabId, function(tab) {
//         console.log('Tab switched:', tab.url);
//         chrome.runtime.sendMessage({
//           type: "tab_switched",
//           URL: tab.url
//         });
//       });
//     }
//   });
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'capturedData') {
    // 转发给所有插件页面
    chrome.runtime.sendMessage({ type: 'updateData', payload: message.payload });
  }
});
