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
    if (tab.url.startsWith("https://")) {// --- NEW: call Node server for weak hashing check ---
fetch(`http://localhost:3000/check?site=${encodeURIComponent(tab.url)}`)
  .then(res => res.json())
  .then(data => {
    const extra = document.getElementById("weak-hash");
    if (data.error) {
      extra.textContent = "Hash check error: " + data.error;
    } else if (data.weak) {
      extra.textContent = "⚠️ Weak hash algorithm: " + data.signatureAlgorithm;
    } else {
      extra.textContent = "✅ Strong hash algorithm: " + data.signatureAlgorithm;
    }
  })
  .catch(err => {
    document.getElementById("weak-hash").textContent =
      "Could not contact Node server: " + err.message;
  });

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
