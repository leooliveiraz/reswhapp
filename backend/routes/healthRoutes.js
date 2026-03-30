/**
 * Rotas de health check e status da API
 */

function healthRoutes(app, whatsappClient, io) {
    // Health check básico
    app.get('/health', (req, res) => {
        try {
            res.status(200).json({
                status: 'OK',
                timestamp: new Date().toISOString(),
                service: 'WhatsApp API',
                clientReady: whatsappClient.isClientReady()
            });
        } catch (error) {
            console.error('Error in /health:', error);
            res.status(500).json({
                status: 'ERROR',
                error: error.message
            });
        }
    });

    // Health check detalhado
    app.get('/api/health', (req, res) => {
        try {
            res.status(200).json({
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                clientInfo: whatsappClient.getClientInfo(),
                connections: io.engine.clientsCount
            });
        } catch (error) {
            console.error('Error in /api/health:', error);
            res.status(500).json({
                status: 'ERROR',
                error: error.message
            });
        }
    });

    // Status detalhado do sistema
    app.get('/api/status', (req, res) => {
        try {
            const clientInfo = whatsappClient.getClientInfo();
            const isReady = whatsappClient.isClientReady();
            const client = whatsappClient.getClient();

            res.status(200).json({
                status: 'ok',
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                whatsapp: {
                    ready: isReady,
                    connected: !!client,
                    info: clientInfo,
                    reconnecting: whatsappClient.isReconnecting,
                    reconnectAttempts: whatsappClient.reconnectAttempts
                },
                socket: {
                    connections: io.engine.clientsCount
                }
            });
        } catch (error) {
            console.error('Error in /api/status:', error);
            res.status(500).json({
                status: 'ERROR',
                error: error.message
            });
        }
    });

    // Ready check (para load balancers)
    app.get('/ready', (req, res) => {
        try {
            if (whatsappClient.isClientReady()) {
                res.status(200).json({ ready: true });
            } else {
                res.status(503).json({ ready: false, reason: 'WhatsApp client not ready' });
            }
        } catch (error) {
            console.error('Error in /ready:', error);
            res.status(503).json({ ready: false, reason: error.message });
        }
    });

    // Live check (se o processo está vivo)
    app.get('/live', (req, res) => {
        res.status(200).json({ alive: true });
    });
}

module.exports = healthRoutes;
