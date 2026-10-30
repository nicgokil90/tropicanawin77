const WebSocket = require('ws');

// Render akan menyediakan PORT secara otomatis melalui environment variable
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

console.log(`WebSocket server KemiChat berjalan di port ${port}`);

wss.on('connection', (ws) => {
    console.log('Klien/Admin terhubung');

    ws.on('message', (message) => {
        // Broadcast pesan/status typing ke semua koneksi yang aktif
        wss.clients.forEach((client) => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(message.toString());
            }
        });
    });

    ws.on('close', () => {
        console.log('Koneksi terputus');
    });
});
