#!/bin/bash
sudo apt update -y
sudo apt install -y apache2
sudo systemctl start apache2
sudo systemctl enable apache2

# Write the Blue App HTML
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Blue App — v1.0</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      background: #0a0a1a;
      color: #e0e0ff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      border: 2px solid #4488ff;
      border-radius: 8px;
      padding: 48px 64px;
      text-align: center;
      box-shadow: 0 0 40px rgba(68,136,255,0.3);
    }
    .env-badge {
      background: #4488ff;
      color: #0a0a1a;
      font-weight: bold;
      padding: 4px 16px;
      border-radius: 4px;
      font-size: 12px;
      letter-spacing: 2px;
      text-transform: uppercase;
      display: inline-block;
      margin-bottom: 24px;
    }
    h1 { font-size: 2.5rem; color: #4488ff; margin-bottom: 16px; }
    p { color: #8899cc; font-size: 1rem; line-height: 1.6; }
    .version { margin-top: 24px; font-size: 0.85rem; color: #445577; }
  </style>
</head>
<body>
  <div class="card">
    <span class="env-badge">🔵 Blue Environment</span>
    <h1>Hello from v1.0</h1>
    <p>This is the <strong>Blue</strong> deployment.<br>
    Classic checkout flow. Stable. Battle-tested.</p>
    <p class="version">Version 1.0.0 — Active since deployment</p>
  </div>
</body>
</html>
EOF

sudo systemctl restart apache2