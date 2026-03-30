# Tratamento de Erros e Resiliência

Este documento descreve as melhorias de tratamento de erros implementadas para evitar que a aplicação morra e prevenir corrupções no Puppeteer/whatsapp-web.js.

## 🛡️ Proteções Implementadas

### 1. Global Error Handlers (`main.js`)

```javascript
// Previne crash por erros não capturados em Promises
process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ [UNHANDLED REJECTION]', reason);
    // NÃO encerra o processo
});

// Previne crash por exceções não capturadas
process.on('uncaughtException', (error) => {
    console.error('❌ [UNCAUGHT EXCEPTION]', error);
    // NÃO encerra o processo
});

// Previne crash por erros de sistema
process.on('error', (error) => {
    console.error('❌ [PROCESS ERROR]', error);
    // NÃO encerra o processo
});
```

### 2. Graceful Shutdown

- Implementado shutdown elegante para SIGTERM e SIGINT
- Fecha conexões de forma ordenada (HTTP → WhatsApp → MongoDB)
- Previne corrupção de dados durante desligamento

### 3. WhatsApp Client Resilience (`whatsappClient.js`)

#### Auto-reconexão
- Reconexão automática em caso de desconexão
- Máximo de 5 tentativas com delay exponencial
- Estado de reconexão controlado para evitar loops

#### Retry com Timeout
```javascript
async _withRetry(operation, options = {
    maxAttempts: 3,
    delay: 2000,
    timeout: 60000
})
```

#### Event Listeners de Erro
- `auth_failure`: Loga erro, não crasha
- `disconnected`: Inicia reconexão automática
- `error`: Loga erro, mantém aplicação rodando
- `loading_screen`: Debug
- `change_state`: Debug

### 4. MongoDB Resilience (`mongoConnection.js`)

- Retry automático (3 tentativas) em falhas de conexão
- Listener de reconexão do MongoDB
- Graceful degradation: aplicação continua rodando mesmo sem DB
- Close de conexões com tratamento de erro

### 5. Database Operations (`messageDataBase.js`, `chatDataBase.js`)

- Todas as funções envoltas em try-catch
- Erros são logados mas não propagados
- Retorna estruturas vazias em caso de falha
- Previne corrupção por operações incompletas

### 6. Socket.io Error Handling (`socketRoutes.js`)

- Handler de erro por socket
- Todas as operações com catch
- Retorna dados vazios em caso de erro
- Previne disconnect em cadeia

### 7. Health Check Routes (`healthRoutes.js`)

- Todas as rotas com try-catch
- Retorna status 500 em vez de crashar
- Rotas adicionais para diagnóstico:
  - `/api/status`: Status detalhado do sistema
  - `/ready`: Ready check para load balancers
  - `/live`: Liveness probe

## 📋 Boas Práticas Adicionais

### Para evitar corrupção do Puppeteer:

1. **Sempre use try-catch** em operações assíncronas
2. **Não confie em operações externas** (sempre valide)
3. **Implemente timeouts** em operações de longa duração
4. **Limpe recursos** em blocos finally quando necessário

### Para operações críticas:

```javascript
try {
    // Operação crítica
    await criticalOperation();
} catch (error) {
    console.error('Erro:', error);
    // Não relança - mantém aplicação rodando
    // Retorna valor seguro/fallback
    return defaultValue;
}
```

## 🔍 Monitoramento

Use as seguintes rotas para monitorar a saúde da aplicação:

- `GET /health` - Health check básico
- `GET /api/health` - Health check detalhado
- `GET /api/status` - Status completo do sistema
- `GET /ready` - Ready check (503 se não pronto)
- `GET /live` - Liveness probe (sempre 200 se vivo)

## 🚨 Logs de Erro

Todos os erros são logados com prefixos para fácil identificação:

- `❌ [UNHANDLED REJECTION]` - Promise não tratada
- `❌ [UNCAUGHT EXCEPTION]` - Exceção não capturada
- `❌ [PROCESS ERROR]` - Erro de sistema
- `❌ WhatsApp Client error:` - Erro do WhatsApp
- `❌ Error in saveLastChatMessageMass:` - Erro no DB
- `⚠️ Disconnected:` - Desconexão do WhatsApp
- `🔄 Reconnecting...` - Tentativa de reconexão

## ⚙️ Configuração

No `WhatsAppClient`, você pode configurar:

```javascript
new WhatsAppClient({
    maxReconnectAttempts: 5,     // Máximo de tentativas de reconexão
    reconnectDelay: 5000,        // Delay entre tentativas (ms)
    chromeTimeout: 60000         // Timeout do Puppeteer (ms)
})
```

## 📝 Notas Importantes

1. **A aplicação NUNCA deve morrer** - todos os erros são capturados
2. **Operações falham silenciosamente** - loga erro, continua rodando
3. **Reconexão é automática** - WhatsApp, MongoDB, Sockets
4. **Dados são protegidos** - try-catch em todas as operações de DB
5. **Graceful degradation** - funcionalidade reduzida é melhor que crash
