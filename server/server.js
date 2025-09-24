const express = require("express");
const tls = require("tls");

const app = express();
const PORT = 3000;

// Allow the Chrome extension to call this API
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
    host,
    port: 443,
    servername: host,
    rejectUnauthorized: false, // we want to inspect even bad/expired certs
  };

  const socket = tls.connect(options, () => {
    const cert = socket.getPeerCertificate(true); // full chain

    if (!cert || !Object.keys(cert).length) {
      res.json({ error: "No certificate found" });
      socket.end();
      return;
    }

    // ------------------ 1) Expiration ------------------
    const now = new Date();
    const validTo = new Date(cert.valid_to);
    const isExpired = now > validTo;

    // ------------------ 2) Self-signed ------------------
    const isSelfSigned =
      cert.issuerCertificate &&
      cert.issuerCertificate.subject &&
      cert.subject &&
      cert.issuerCertificate.subject.CN === cert.subject.CN;

    // ------------------ 3) Weak key length ---------------
    // Some Node versions expose pubkey.bitSize. If not, estimate from modulus.
    let keySize = null;
    if (cert.pubkey && cert.pubkey.bitSize) {
      keySize = cert.pubkey.bitSize;
    } else if (cert.modulus) {
      keySize = cert.modulus.length * 4; // hex chars * 4 = bits
    }
    const weakKey = keySize && keySize < 2048;

    // ------------------ 4) Hostname mismatch -------------
    const altNames = (cert.subjectaltname || "").toLowerCase();
    const hostnameMismatch = !altNames.includes(host.toLowerCase());

    // ------------------ 5) Signature Algorithm -----------
    const sigAlgo = cert.signatureAlgorithm || "Unknown";
    const weakHash = /sha1|md5/i.test(sigAlgo);

    res.json({
      host,
      validTo: validTo.toISOString(),
      isExpired,
      isSelfSigned,
      keySize,
      weakKey,
      hostnameMismatch,
      signatureAlgorithm: sigAlgo,
      weakHash
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
