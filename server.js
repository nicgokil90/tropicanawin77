const WebSocket = require('ws');

// Render memerlukan port dinamis dari process.env.PORT
const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ 
    port: PORT,
    maxPayload: 1024 * 10 // Proteksi DDoS: Batasi ukuran payload maksimal 10KB
});

const ipConnections = new Map();
const MAX_CONNS_PER_IP = 10; // Maksimal 10 koneksi aktif per IP

wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    // 1. Cek Batas Koneksi per IP (Anti-DDoS / Connection Flooding)
    const currentConns = ipConnections.get(ip) || 0;
    if (currentConns >= MAX_CONNS_PER_IP) {
        ws.close(1008, 'Terlalu banyak koneksi dari IP ini.');
        return;
    }
    ipConnections.set(ip, currentConns + 1);

    ws.on('close', () => {
        const count = ipConnections.get(ip) || 1;
        if (count <= 1) {
            ipConnections.delete(ip);
        } else {
            ipConnections.set(ip, count - 1);
        }
    });

    ws.on('message', (message) => {
        // Broadcast pesan ke klien lain jika diperlukan
        wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    });
});

console.log(`WebSocket Server berjalan aman di port ${PORT} dengan proteksi anti-DDoS.`);
