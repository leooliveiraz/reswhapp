/**
 * Gerenciador de conexões MongoDB Singleton
 * Reutiliza conexões para evitar condições de corrida
 */
require("dotenv").config();
const mongoose = require("mongoose");

class MongoConnection {
    constructor() {
        this.connections = new Map();
    }

    /**
     * Obtém ou cria uma conexão para um banco específico
     * @param {string} clientNumber - Número do cliente para nome do banco
     * @returns {Promise<mongoose.Connection>}
     */
    async getConnection(clientNumber) {
        const dbName = process.env.MONGO_URI + "_" + clientNumber;
        
        // Verifica se já existe conexão ativa
        if (this.connections.has(dbName)) {
            const conn = this.connections.get(dbName);
            if (conn.readyState === 1) { // 1 = conectado
                return conn;
            }
            // Conexão existe mas não está ativa, remove para recriar
            this.connections.delete(dbName);
        }

        // Cria nova conexão
        try {
            const conn = await mongoose.createConnection(dbName).asPromise();
            this.connections.set(dbName, conn);
            
            conn.on('error', (error) => {
                console.error(`MongoDB error for ${clientNumber}:`, error);
                this.connections.delete(dbName);
            });

            conn.on('disconnected', () => {
                console.log(`MongoDB disconnected for ${clientNumber}`);
                this.connections.delete(dbName);
            });

            return conn;
        } catch (error) {
            console.error(`Error connecting to MongoDB for ${clientNumber}:`, error);
            throw error;
        }
    }

    /**
     * Fecha todas as conexões
     */
    async closeAll() {
        const closePromises = Array.from(this.connections.values()).map(conn => conn.close());
        await Promise.all(closePromises);
        this.connections.clear();
        console.log('All MongoDB connections closed');
    }

    /**
     * Fecha uma conexão específica
     */
    async close(clientNumber) {
        const dbName = process.env.MONGO_URI + "_" + clientNumber;
        const conn = this.connections.get(dbName);
        if (conn) {
            await conn.close();
            this.connections.delete(dbName);
        }
    }
}

// Singleton instance
const mongoConnection = new MongoConnection();

module.exports = mongoConnection;
