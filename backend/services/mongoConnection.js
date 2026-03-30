/**
 * Gerenciador de conexões MongoDB Singleton
 * Reutiliza conexões para evitar condições de corrida
 */
require("dotenv").config();
const mongoose = require("mongoose");

class MongoConnection {
    constructor() {
        this.connections = new Map();
        this.maxRetries = 3;
        this.retryDelay = 2000;
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

        // Cria nova conexão com retry
        let lastError;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
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

                conn.on('reconnected', () => {
                    console.log(`MongoDB reconnected for ${clientNumber}`);
                });

                return conn;
            } catch (error) {
                lastError = error;
                console.error(`Error connecting to MongoDB for ${clientNumber} (attempt ${attempt}/${this.maxRetries}):`, error);
                
                if (attempt < this.maxRetries) {
                    console.log(`Retrying MongoDB connection in ${this.retryDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                }
            }
        }

        // Se chegou aqui, todas as tentativas falharam
        // Retorna uma conexão dummy para não quebrar a aplicação
        console.error(`❌ All MongoDB connection attempts failed for ${clientNumber}. Application will continue running but database operations may fail.`);
        throw lastError;
    }

    /**
     * Fecha todas as conexões
     */
    async closeAll() {
        try {
            const closePromises = Array.from(this.connections.values()).map(conn => conn.close());
            await Promise.all(closePromises);
            this.connections.clear();
            console.log('All MongoDB connections closed');
        } catch (error) {
            console.error('Error closing MongoDB connections:', error);
        }
    }

    /**
     * Fecha uma conexão específica
     */
    async close(clientNumber) {
        try {
            const dbName = process.env.MONGO_URI + "_" + clientNumber;
            const conn = this.connections.get(dbName);
            if (conn) {
                await conn.close();
                this.connections.delete(dbName);
            }
        } catch (error) {
            console.error(`Error closing MongoDB connection for ${clientNumber}:`, error);
        }
    }
}

// Singleton instance
const mongoConnection = new MongoConnection();

module.exports = mongoConnection;
