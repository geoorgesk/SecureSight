// background.js

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "checkCert") {
    let siteUrl = message.url;

    // Try to fetch the site headers (HEAD request is enough)
    fetch(siteUrl, { method: "HEAD" })
      .then((response) => {
        if (response.ok) {
          // Site responded properly over HTTPS
          sendResponse({ status: "✅ Certificate looks valid" });
        } else {
          // HTTPS responded but something is off (rare case)
          sendResponse({ status: "⚠️ HTTPS responded with an issue" });
        }
      })
      .catch((error) => {
        // Fetch failed → usually means SSL problem (expired, invalid, self-signed)
        sendResponse({ status: "❌ Invalid or expired certificate" });
      });

    return true; // keeps sendResponse async
  }
});
