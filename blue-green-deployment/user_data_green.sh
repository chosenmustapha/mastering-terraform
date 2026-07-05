#!/bin/bash
sudo apt update -y
sudo apt install -y httpd

sudo systemctl start httpd
sudo systemctl enable httpd

cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Green App — v2.0</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a1a0a;
      color: #e0ffe0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      border: 2px solid #44ff88;
      border-radius: 8px;
      padding: 48px 64px;
      text-align: center;
      box-shadow: 0 0 40px rgba(68,255,136,0.3);
    }
    .env-badge {
      background: #44ff88;
      color: #0a1a0a;
      font-weight: bold;
      padding: 4px 16px;
      border-radius: 4px;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 24px;
    }
    h1 { font-size: 2.5rem; color: #44ff88; margin-bottom: 16px; }
    p { color: #88cc99; font-size: 1rem; line-height: 1.6; }
    .version { margin-top: 24px; font-size: 0.85rem; color: #445544; }
    .new-badge {
      display: inline-block;
      background: rgba(68,255,136,0.15);
      border: 1px solid #44ff88;
      color: #44ff88;
      font-size: 0.75rem;
      padding: 2px 10px;
      border-radius: 20px;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="card">
    <span class="env-badge">🟢 Green Environment</span>
    <h1>Hello from v2.0</h1>
    <p>This is the <strong>Green</strong> deployment.<br>
    Redesigned checkout. Faster. New payment methods.</p>
    <span class="new-badge">✦ New Features Live</span>
    <p class="version">Version 2.0.0 — Pending traffic switch</p>
  </div>
</body>
</html>
EOF

sudo systemctl restart httpd