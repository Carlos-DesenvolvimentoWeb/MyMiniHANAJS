const express = require('express');
const cors = require('cors');
const app = express();
const MiniHana = require('./MiniHana');
const db = new MiniHana();
const port = 3000;
const TransactionLogger = require('./TransactionLogger');
const logger = new TransactionLogger();
app.use(cors()); 
app.use(express.json());
db.loadFromCSV('estoque.csv');

app.post('/api/inventory/insert', (req, res) => {
    try {
        let { product, price, quantity } = req.body;

        price = parseFloat(price);
        quantity = parseInt(quantity);

        // 1. Validação (Importante para não corromper as colunas)
        if (!product || price === undefined || quantity === undefined) {
            return res.status(400).json({ 
                error: "Dados incompletos. Envie product, price e quantity." 
            });
        }

        // 2. Executa o Insert Colunar no nosso "Mini-HANA"
        db.insert(product, parseFloat(price), parseInt(quantity));

        // 3. Resposta de sucesso para o Robô
        res.status(201).json({
            message: "Registro inserido com sucesso no In-Memory DB",
            data: { product, price, quantity }
        });
        // REGISTRO NO AOF: Se o server cair agora, sabemos que isso aconteceu
        logger.write('INSERT', { product, price, quantity });
    } catch (error) {
        console.error("Erro no insert:", error);
        res.status(500).json({ error: "Erro interno no processamento colunar." });
    }
});

// --- ROTA DE ANALYTICS (O Processamento Colunar) ---
app.get('/api/inventory/analytics', (req, res) => {
    try {
        const prices = db.columns.price;
        const quantities = db.columns.quantity;
        const productIDs = db.columns.productID;

        // Se o banco estiver vazio, retornamos um aviso
        if (prices.length === 0) {
            return res.json({ 
                message: "O banco de dados está vazio. Insira dados primeiro." 
            });
        }

        let totalValue = 0;
        let totalItems = 0;
        let mostExpensiveIdx = 0;

        // PERFORMANCE: Percorremos os vetores contíguos na memória
        for (let i = 0; i < prices.length; i++) {
            const currentPrice = prices[i];
            const currentQty = quantities[i];

            // Cálculo do valor total (ETL in-memory)
            totalValue += currentPrice * currentQty;
            totalItems += currentQty;

            // Lógica para encontrar o item mais caro
            if (currentPrice > prices[mostExpensiveIdx]) {
                mostExpensiveIdx = i;
            }
        }

        // Retornamos o resultado formatado
        res.json({
            timestamp: new Date().toISOString(),
            summary: {
                totalStockValue: totalValue.toFixed(2),
                totalQuantity: totalItems,
                averageItemPrice: (totalValue / totalItems).toFixed(2),
                distinctProducts: db.dictionary.length
            },
            insights: {
                mostExpensiveProduct: db.dictionary[productIDs[mostExpensiveIdx]],
                unitPrice: prices[mostExpensiveIdx]
            }
        });

    } catch (error) {
        console.error("Erro no analytics:", error);
        res.status(500).json({ error: "Erro ao processar indicadores analíticos." });
    }
});
// --- ROTA DE UPDATE (Atualização de Saldo) ---
app.put('/api/inventory/update-quantity', (req, res) => {
    try {
        const { product, quantity } = req.body;

        if (!product || quantity === undefined) {
            return res.status(400).json({ error: "Informe o 'product' e a nova 'quantity'." });
        }

        const result = db.updateQuantity(product, quantity);

        logger.write('UPDATE', { product, result });
        res.json({
            message: `Quantidade de '${product}' atualizada com sucesso.`,
            details: result
        });
    } catch (error) {
        res.status(404).json({ error: error.message });
    }
});
// --- ROTA DE PERSISTÊNCIA (SAVEPOINT MANUAL) ---
app.post('/api/inventory/save', (req, res) => {
    db.saveToCSV('estoque.csv');
    logger.write('SAVE', 'Savepoint realizado com sucesso!');
    res.json({ message: "Savepoint realizado com sucesso!" });

});

app.listen(port, () => {
    console.log(`MiniHANA running at http://localhost:${port}/`); // Log a message when the server starts
});

process.on('SIGINT', () => {
    console.log("\n[SHUTDOWN] Salvando banco...");
    db.saveToCSV('estoque.csv');
    process.exit();
});
