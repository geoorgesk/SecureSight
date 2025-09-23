// server/server.js
const express = require("express");
const tls = require("tls");
const url = require("url");

const app = express();
const PORT = 3000;

// Allow extension to call this server (simple CORS)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.get("/check", (req, res) => {
  const site = req.query.site;
  if (!site) {
    return res.status(400).json({ error: "Missing ?site= parameter" });
  }

  let host;
  try {
    const parsed = new URL(site);
    host = parsed.hostname;
  } catch {
    return res.status(400).json({ error: "Invalid URL" });
  }

  const options = {
    host: host,
    port: 443,
    servername: host
  };

  const socket = tls.connect(options, () => {
    const cert = socket.getPeerCertificate(true); // keep true
console.log(cert); // <— TEMP: see what fields you actually get

    if (!cert || !cert.raw) {
      res.json({ error: "No certificate found" });
      socket.end();
      return;
    }

    // signatureAlgorithm might look like 'sha256WithRSAEncryption'
    const sigAlgo = cert.signatureAlgorithm || "Unknown";

    let isWeak = false;
    if (/sha1/i.test(sigAlgo) || /md5/i.test(sigAlgo)) {
      isWeak = true;
    }

    res.json({
      host,
      signatureAlgorithm: sigAlgo,
      weak: isWeak
    });
    socket.end();
  });

  socket.setTimeout(8000, () => {
    res.json({ error: "TLS connection timed out" });
    socket.destroy();
  });

  socket.on("error", (err) => {
    res.json({ error: err.message });
  });
});

app.listen(PORT, () => {
  console.log(`TLS check server running at http://localhost:${PORT}`);
});
