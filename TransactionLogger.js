const fs = require('fs');

class TransactionLogger {
    constructor(filename = 'server.log') {
        this.filename = filename;
    }

    // Grava a operação no formato: TIMESTAMP | OPERAÇÃO | DADOS
    write(operation, data) {
        const entry = {
            timestamp: new Date().toISOString(),
            operation: operation,
            data: data
        };
        
        // appendFileSync garante que a escrita seja adicionada ao final sem sobrescrever
        fs.appendFileSync(this.filename, JSON.stringify(entry) + '\n');
    }
}

module.exports = TransactionLogger;