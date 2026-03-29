/**
 * Rotas de health check e status da API
 */

function healthRoutes(app, whatsappClient, io) {
    // Health check básico
    app.get('/health', (req, res) => {
        res.status(200).json({
            status: 'OK',
            timestamp: new Date().toISOString(),
            service: 'WhatsApp API',
            clientReady: whatsappClient.isClientReady()
        });
    });

    // Health check detalhado
    app.get('/api/health', (req, res) => {
        res.status(200).json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            clientInfo: whatsappClient.getClientInfo(),
            connections: io.engine.clientsCount
        });
    });
}

module.exports = healthRoutes;
