# LLM-based Conversational Retrieval Evaluation Plugin

This Chrome extension plugin is designed for **online evaluation of LLM-based conversational retrieval systems**.  
It automatically collects interaction metrics during user conversations with LLMs (currently adapted for the ChatGPT web interface).

---

## 🔹 Features

The plugin records both **message-level** and **global-level** interaction data:

- **Message-level metrics (per message):**
  - Message content  
  - Timestamp  
  - Message index in the conversation  
  - Click events  
  - Hover events  
  - Button clicks (e.g., regenerate, copy, etc.)  
  - History  

- **Global-level metrics:**
  - Scroll behavior  
  - Global button clicks  
  
In short, the plugin provides a **comprehensive log of user interactions** (click, hover, scroll, regenerate, etc.) when engaging in conversational retrieval with LLMs.

---

## 🔹 Installation & Usage

1. **Initialize the project**

   ```bash
   cd <root-directory>
   npm install
   npm run build

2. **Load the plugin in Chrome**
  Open **chrome://extensions/** */

  Enable Developer Mode (top-right corner)
  
  Click Load unpacked
  
  Select the **dist folder** generated after the build

  **The plugin is now ready for debugging and usage!**

---

## 🔹 Data Format

The plugin collects data in structured **JSON** format. The schema is as follows:

```json
{
  //Messages
  "1": [
    //History
    {
      "msg_1757506394344_w816xn7e": {
      "id": "",
      "role": "",
      "text": "",
      "timestamp": "",
      "count_num": 0,
      "hover_count": 0,
      "hover_duration_ms": 0,
      "copy_count": 0,
      "copy_details": [
        {
          "text": "",
          "length": 0,
          "timestamp": ""
        }
      ],
      "buttons": [
        {
          "name": "",
          "timestamp": ""
        }
      ]
    }}],

  ///Overall: Scroll
  "scroll": [
    {
      "startTime": "",
      "endTime": "",
      "startScrollTop": 0,
      "endScrollTop": 0,
      "distance": 0,
      "edge": "", // bottom | top | none
      "direction": "" // down | up | mixed
    }
  ],
  
  //Overall: Button
  "overallButton": [
    {
      "name": "",
      "timestamp": ""
    }
  ]
}
