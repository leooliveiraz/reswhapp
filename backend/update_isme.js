/**
 * Script para atualizar mensagens antigas adicionando o campo isMe
 * Baseado no campo fromMe existente
 */
require("dotenv").config();
const mongoose = require("mongoose");
const mongoConnection = require("./services/mongoConnection");

async function updateIsMeField() {
    console.log("🚀 Iniciando atualização do campo isMe...");

    try {
        // Conecta ao MongoDB
        const mongoUri = process.env.MONGODB_URI || "mongodb://localhost:27017";
        await mongoose.connect(mongoUri);
        console.log("✅ Conectado ao MongoDB");

        // Lista todos os bancos de dados
        const admin = mongoose.connection.db.admin();
        const databases = await admin.listDatabases();
        
        // Filtra apenas os bancos que seguem o padrão (ex: "whatsapp_5511999999999")
        const clientDatabases = databases.databases.filter(db => 
            db.name.includes("_") && !db.name.startsWith("admin") && !db.name.startsWith("local")
        );

        console.log(`\n📊 Encontrados ${clientDatabases.length} banco(s) de cliente(s)`);

        let totalUpdated = 0;

        // Para cada banco de dados de cliente
        for (const clientDb of clientDatabases) {
            const clientNumber = clientDb.name.split("_").pop();
            console.log(`\n🔄 Processando banco: ${clientDb.name} (cliente: ${clientNumber})`);

            try {
                const conn = await mongoConnection.getConnection(clientNumber);
                const db = conn.db;
                
                // Lista todas as coleções (cada coleção é um chat)
                const collections = await db.listCollections().toArray();
                
                console.log(`   📁 ${collections.length} coleção(ões) encontrada(s)`);

                let updatedInClient = 0;

                // Para cada coleção (chat)
                for (const collection of collections) {
                    const collectionName = collection.name;
                    const col = db.collection(collectionName);

                    // Conta mensagens sem isMe
                    const countWithoutIsMe = await col.countDocuments({
                        isMe: { $exists: false }
                    });

                    if (countWithoutIsMe === 0) {
                        continue;
                    }

                    console.log(`   📝 Coleção "${collectionName}": ${countWithoutIsMe} mensagem(ns) sem isMe`);

                    // Atualiza todas as mensagens que não têm isMe
                    const result = await col.updateMany(
                        { isMe: { $exists: false } },
                        [
                            {
                                $set: {
                                    isMe: {
                                        $cond: {
                                            if: { $eq: ["$fromMe", true] },
                                            then: true,
                                            else: false
                                        }
                                    }
                                }
                            }
                        ]
                    );

                    console.log(`   ✅ Atualizadas: ${result.modifiedCount} mensagem(ns)`);
                    updatedInClient += result.modifiedCount;
                }

                console.log(`\n✅ Cliente ${clientNumber}: ${updatedInClient} mensagem(ns) atualizada(s)`);
                totalUpdated += updatedInClient;

            } catch (error) {
                console.error(`   ❌ Erro ao processar cliente ${clientNumber}:`, error.message);
            }
        }

        console.log(`\n🎉 Processo concluído!`);
        console.log(`📊 Total de mensagens atualizadas: ${totalUpdated}`);

    } catch (error) {
        console.error("❌ Erro durante a atualização:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Conexão MongoDB fechada");
    }
}

// Executa o script
updateIsMeField();
