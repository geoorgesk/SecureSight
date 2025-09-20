// popup.js

// When popup loads, check the active tab's certificate
document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      document.getElementById("status").innerText = "No active tab found.";
      return;
    }

    const tab = tabs[0];

    // Only check if it's HTTPS
    if (tab.url.startsWith("https://")) {
      chrome.runtime.sendMessage(
        { action: "checkCert", url: tab.url },
        (response) => {
          if (chrome.runtime.lastError) {
            document.getElementById("status").innerText =
              "Error: " + chrome.runtime.lastError.message;
          } else if (response && response.status) {
            document.getElementById("status").innerText = response.status;
          } else {
            document.getElementById("status").innerText =
              "No certificate info available.";
          }
        }
      );
    } else {
      document.getElementById("status").innerText =
        "This site is not using HTTPS.";
    }
  });
});
