🚀 MiniHANA: In-Memory Columnar Database Simulator

Este projeto é um simulador de banco de dados In-Memory com armazenamento colunar, inspirado na arquitetura do SAP HANA. Desenvolvido para servir como o "cérebro" de automações de estoque (RPA), ele foca em alta performance para processos de ETL e Analytics.
🧠 Diferenciais Técnicos

    Arquitetura Colunar: Diferente de bancos tradicionais (Row-based), os dados são armazenados em vetores de atributos na memória (Column-based), otimizando o processamento de grandes volumes de dados numéricos.

    Dictionary Encoding: Implementação de compressão de strings via dicionário, reduzindo o consumo de RAM e acelerando consultas.

    AOF (Append-Only File): Sistema de logs de transação que garante integridade dos dados e auditoria de cada movimentação.

    In-Memory ETL: Motor de cálculo analítico capaz de processar valor total, médias e insights de estoque diretamente na RAM.

🛠️ Tecnologias Utilizadas

    Node.js & Express: Engine do servidor e gerenciamento de rotas REST.

    File System (fs): Persistência híbrida (CSV para dados e JSON para metadados/dicionário).

🔌 Endpoints da API

O banco foi desenhado para ser alimentado por robôs (Automation Anywhere) através das seguintes rotas:

Método	Rota	                    Descrição
POST	/api/inventory/insert	    Cadastro de novos produtos com compressão automática.
PATCH	/api/inventory/stock-move	Movimentação incremental (Entradas/Saídas) de estoque.
GET	    /api/inventory/search	    Point Query para consulta de saldo e preço.
GET	    /api/inventory/analytics	Processamento analítico de indicadores de BI.

💾 Persistência e Resiliência

Para garantir que nenhum dado seja perdido entre os desligamentos do servidor:

    Savepoints: Ao encerrar o servidor, o estado da RAM é persistido em um arquivo CSV amigável para humanos.

    Metadata Preservation: O dicionário de strings é salvo separadamente para manter a integridade dos IDs internos.

    Transaction Logs: Cada operação de escrita é registrada instantaneamente no arquivo server.log.

Como rodar o projeto

    Clone o repositório: git clone ...

    Instale as dependências: npm install

    Inicie o banco: npm start (ou nodemon server.js)

