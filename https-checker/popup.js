document.addEventListener("DOMContentLoaded", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) {
      document.getElementById("status").innerText = "No active tab found.";
      return;
    }

    const tab = tabs[0];

    if (!tab.url.startsWith("https://")) {
      document.getElementById("status").innerHTML =
        `<span class="bad">❌ This site is not using HTTPS.</span>`;
      return;
    }

    fetch(`http://localhost:3000/check?site=${encodeURIComponent(tab.url)}`)
      .then(res => res.json())
      .then(data => {
        const box = document.getElementById("status");

        if (data.error) {
          box.innerHTML = `<span class="bad">Error: ${data.error}</span>`;
          return;
        }

        let msg = "";

        msg += data.isExpired
          ? `<div class="bad"> Certificate expired</div>`
          : `<div class="good"> Not expired</div>`;

        msg += data.isSelfSigned
          ? `<div class="warn"> Self-signed certificate</div>`
          : `<div class="good"> Not self-signed</div>`;

        if (data.keySize) {
          msg += data.weakKey
            ? `<div class="warn"> Weak key (${data.keySize} bits)</div>`
            : `<div class="good">Key size: ${data.keySize} bits</div>`;
        } else {
          msg += `<div class="warn"> Could not determine key size</div>`;
        }

        msg += data.hostnameMismatch
          ? `<div class="bad"> Hostname mismatch</div>`
          : `<div class="good"> Hostname matches</div>`;

        msg += data.weakHash
          ? `<div class="warn"> Weak hash algorithm: ${data.signatureAlgorithm}</div>`
          : `<div class="good"> Strong hash algorithm: ${data.signatureAlgorithm}</div>`;

        box.innerHTML = msg;
      })
      .catch(err => {
        document.getElementById("status").innerHTML =
          `<span class="bad">Could not contact Node server: ${err.message}</span>`;
      });
  });
});
