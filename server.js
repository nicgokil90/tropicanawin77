const WebSocket = require('ws');

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({ 
    port: PORT,
    maxPayload: 1024 * 10 // Proteksi DDoS: Batasi ukuran payload maksimal 10KB
});

const ipConnections = new Map();
const MAX_CONNS_PER_IP = 10;

wss.on('connection', (ws, req) => {
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

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
        try {
            const data = JSON.parse(message);
            
            // Tangani registrasi sesi klien
            if (data.action === 'register') {
                ws.clientId = data.client_id;
                return;
            }

            // Broadcast pesan real-time ke semua klien/admin yang terhubung
            wss.clients.forEach(client => {
                if (client.readyState === WebSocket.OPEN) {
                    client.send(message);
                }
            });
        } catch (e) {
            // Abaikan jika format bukan JSON
        }
    });
});

console.log(`WebSocket Server berjalan aman di port ${PORT} dengan proteksi anti-DDoS.`);
