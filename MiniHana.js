const fs = require('fs');

class MiniHana {
    constructor() {
        // Dicionário para comprimir Strings (Valores únicos)
        this.dictionary = []; 
        
        // Estrutura Colunar (Vetores de Atributos)
        this.columns = {
            productID: [],   // Armazenará os índices do dicionário (inteiros)
            price: [],       // Números (float)
            quantity: []     // Números (int)
        };
    }

    // --- MÉTODOS DE ESCRITA (INSERT) ---
    
    insert(productName, price, quantity) {
        // 1. Dictionary Encoding: verifica se o produto já existe no dicionário
        let idx = this.dictionary.indexOf(productName);
        
        if (idx === -1) {
            // Se não existe, adiciona ao dicionário
            this.dictionary.push(productName);
            idx = this.dictionary.length - 1;
        }

        // 2. Insert Colunar: cada dado vai para o seu respectivo "balde"
        this.columns.productID.push(idx);
        this.columns.price.push(price);
        this.columns.quantity.push(quantity);
        
        console.log(`[INSERT] ${productName} adicionado com sucesso.`);
    }

    // --- MÉTODOS DE CÁLCULO (O "MOTOR" DO HANA) ---

    getTotalStockValue() {
        // No banco colunar, o cálculo é linear e extremamente rápido na CPU
        let total = 0;
        for (let i = 0; i < this.columns.price.length; i++) {
            total += this.columns.price[i] * this.columns.quantity[i];
        }
        return total;
    }

    // --- MÉTODOS DE PERSISTÊNCIA (SAVEPOINT) ---
    saveToCSV(filename) {
        // Agora salvamos o nome real no CSV para ser legível
        let csvContent = "product,price,quantity\n";
        
        for (let i = 0; i < this.columns.productID.length; i++) {
            // Buscamos o nome no dicionário usando o ID da coluna
            const productName = this.dictionary[this.columns.productID[i]];
            csvContent += `${productName},${this.columns.price[i]},${this.columns.quantity[i]}\n`;
        }

        fs.writeFileSync(filename, csvContent);
        
        // Opcional: Salvar o dicionário garante que os IDs não mudem nunca
        fs.writeFileSync('dictionary.json', JSON.stringify(this.dictionary));
        
        console.log(`[SAVE] CSV gerado com nomes reais para conferência.`);
    }

    loadFromCSV(filename) {
        // 1. Tenta restaurar o dicionário existente para manter a ordem dos IDs
        if (fs.existsSync('dictionary.json')) {
            try {
                const data = fs.readFileSync('dictionary.json', 'utf8');
                this.dictionary = JSON.parse(data);
            } catch (e) { this.dictionary = []; }
        }

        // 2. Lê os dados do CSV
        if (!fs.existsSync(filename)) return;

        const csvData = fs.readFileSync(filename, 'utf8');
        const lines = csvData.split('\n').slice(1); // Pula o cabeçalho

        lines.forEach(line => {
            if (line.trim()) {
                const [name, price, qty] = line.split(',');
                // Usamos o método insert para que ele gerencie os IDs automaticamente
                this.insert(name, parseFloat(price), parseInt(qty));
            }
        });
        console.log(`[LOAD] Banco reidratado com sucesso.`);
    }

    updateQuantity(productName, newQuantity) {
        // 1. Localiza o ID do produto no dicionário
        const idx = this.dictionary.indexOf(productName);

        if (idx === -1) {
            throw new Error("Produto não encontrado no dicionário.");
        }

        // 2. Localiza onde esse ID aparece na coluna productID
        // Nota: Em um banco real, poderíamos ter o mesmo produto em várias linhas.
        // Aqui vamos atualizar a PRIMEIRA ocorrência que encontrarmos.
        const position = this.columns.productID.indexOf(idx);

        if (position === -1) {
            throw new Error("Produto não encontrado nas colunas de dados.");
        }

        // 3. Atualiza a coluna de quantidade no índice encontrado
        const oldQty = this.columns.quantity[position];
        this.columns.quantity[position] = parseInt(newQuantity);

        console.log(`[UPDATE] ${productName}: de ${oldQty} para ${newQuantity}`);
        return { oldQty, newQuantity };
    }

}

module.exports = MiniHana;
// --- TESTANDO SEU BANCO ---

// const db = new MiniHana();

// Simulação de inicialização
// db.loadFromCSV('estoque.csv');

// Simulação de automação (RPA enviando dados)
//db.insert("Teclado Mecânico", 250.00, 10);
//db.insert("Mouse Gamer", 120.00, 25);
//db.insert("Teclado Mecânico", 250.00, 5); // Note que o dicionário não duplicará "Teclado"

// Cálculo de ETL (Executado totalmente em memória)
// console.log("Valor Total do Estoque: R$", db.getTotalStockValue());

// Simulação de desligamento do servidor
// db.saveToCSV('estoque.csv');