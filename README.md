# Sistema de Cobranças via WhatsApp

Sistema completo para automatizar cobranças via WhatsApp com Node.js, Express, MySQL, Prisma ORM e Venom-bot.

## Tecnologias utilizadas

- Backend: Node.js com Express
- Banco de Dados: MySQL com Prisma ORM
- Frontend: HTML com React via CDN
- Integração WhatsApp: Venom-bot
- Scheduler: node-cron

## Configuração

1. Instale as dependências:
```bash
npm install
```

2. Configure o banco de dados MySQL e atualize o arquivo `.env` com a URL de conexão.

3. Execute as migrações do Prisma:
```bash
npm run prisma:migrate
```

4. Inicie o servidor de desenvolvimento:
```bash
npm run dev
```

5. Acesse o sistema no navegador: http://localhost:3000

## Funcionalidades

- Gerenciamento de clientes
- Gerenciamento de cobranças
- Envio automático de cobranças via WhatsApp
- Dashboard com resumo das cobranças

## Estrutura do projeto

- `server/`: Backend da aplicação
  - `src/controllers/`: Controladores da API
  - `src/routes/`: Rotas da API
  - `src/services/`: Serviços de negócio
- `public/`: Frontend da aplicação
  - `css/`: Estilos CSS
  - `js/`: Scripts JavaScript
  - `components/`: Componentes React
- `prisma/`: Configuração do Prisma ORM 