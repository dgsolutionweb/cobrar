# Guia de Deploy para VPS

Este documento contém instruções detalhadas para fazer o deploy da aplicação Cobrar em um servidor VPS (Virtual Private Server).

## Índice

1. [Requisitos do Servidor](#requisitos-do-servidor)
2. [Configuração Inicial do VPS](#configuração-inicial-do-vps)
3. [Instalação de Dependências](#instalação-de-dependências)
4. [Configuração do Banco de Dados](#configuração-do-banco-de-dados)
5. [Clone e Setup do Código](#clone-e-setup-do-código)
6. [Configuração do Ambiente](#configuração-do-ambiente)
7. [Build da Aplicação](#build-da-aplicação)
8. [Configuração do Nginx](#configuração-do-nginx)
9. [Configuração do PM2](#configuração-do-pm2)
10. [Configuração SSL com Certbot](#configuração-ssl-com-certbot)
11. [Monitoramento e Manutenção](#monitoramento-e-manutenção)

## Requisitos do Servidor

Requisitos mínimos recomendados para a VPS:

- Ubuntu 20.04 LTS ou superior
- 2GB RAM (mínimo)
- 1 vCPU (recomendado 2 vCPUs)
- 20GB de armazenamento SSD
- Endereço IP público
- Nome de domínio (opcional, mas recomendado para SSL)

## Configuração Inicial do VPS

### 1. Acessar o servidor via SSH

```bash
ssh username@your_server_ip
```

### 2. Atualizar o sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 3. Configurar firewall básico

```bash
sudo apt install ufw -y
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### 4. Configurar timezone

```bash
sudo timedatectl set-timezone America/Sao_Paulo
```

## Instalação de Dependências

### 1. Instalar Node.js e npm

```bash
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
node -v  # Verificar versão (deve ser 16.x ou superior)
npm -v   # Verificar versão do npm
```

### 2. Instalar Git

```bash
sudo apt install git -y
```

### 3. Instalar PM2 (Process Manager)

```bash
sudo npm install -g pm2
```

### 4. Instalar Nginx

```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

## Configuração do Banco de Dados

### 1. Instalar MySQL

```bash
sudo apt install mysql-server -y
sudo systemctl start mysql
sudo systemctl enable mysql
```

### 2. Configurar segurança do MySQL

```bash
sudo mysql_secure_installation
```

Siga as instruções para configurar:
- Definir senha para o usuário root
- Remover usuários anônimos
- Desabilitar login remoto para o root
- Remover banco de dados de teste
- Recarregar privilégios

### 3. Criar banco de dados e usuário

```bash
sudo mysql -u root -p
```

No prompt do MySQL, execute:

```sql
CREATE DATABASE cobrar;
CREATE USER 'cobraruser'@'localhost' IDENTIFIED BY 'sua_senha_segura';
GRANT ALL PRIVILEGES ON cobrar.* TO 'cobraruser'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

## Clone e Setup do Código

### 1. Criar diretório para a aplicação

```bash
sudo mkdir -p /cobrar
sudo chown -R $USER:$USER /cobrar
```

### 2. Clonar o repositório

```bash
cd /cobrar
git clone https://seu-repositorio-git/cobrar.git .
```

### 3. Instalar dependências

```bash
npm install
```

## Configuração do Ambiente

### 1. Criar arquivo .env

```bash
nano /cobrar/.env
```

Adicione as seguintes variáveis de ambiente:

```
# Configurações do Servidor
PORT=3000
NODE_ENV=production

# Configurações do Banco de Dados (MySQL)
DB_HOST=localhost
DB_USER=cobraruser
DB_PASSWORD=sua_senha_segura
DB_NAME=cobrar
DB_PORT=3306

# Para Prisma (se estiver usando)
DATABASE_URL=mysql://cobraruser:sua_senha_segura@localhost:3306/cobrar

# Configurações JWT
JWT_SECRET=sua_chave_jwt_segura_e_aleatoria
JWT_EXPIRES_IN=1d

# Outras configurações específicas da aplicação
```

### 2. Configurar o Prisma (se aplicável)

Se o projeto utiliza Prisma, gere os artefatos do cliente:

```bash
npx prisma generate
```

Crie as tabelas no banco de dados:

```bash
npx prisma migrate deploy
```

## Build da Aplicação

### 1. Compilar o frontend

```bash
npm run build
```

## Configuração do Nginx

### 1. Criar configuração do Nginx

```bash
sudo nano /etc/nginx/sites-available/cobrar
```

Adicione a seguinte configuração:

```nginx
server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Habilitar o site

```bash
sudo ln -s /etc/nginx/sites-available/cobrar /etc/nginx/sites-enabled/
sudo nginx -t  # Testar configuração
sudo systemctl restart nginx
```

## Configuração do PM2

### 1. Configurar PM2 para executar a aplicação

```bash
cd /cobrar
pm2 start server/src/index.js --name cobrar
```

### 2. Configurar PM2 para iniciar automaticamente

```bash
pm2 startup
# Execute o comando fornecido pelo PM2
pm2 save
```

### 3. Criar arquivo de configuração PM2 (opcional)

```bash
nano /cobrar/ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'cobrar',
    script: 'server/src/index.js',
    instances: 'max',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
};
```

Para usar este arquivo:

```bash
pm2 start ecosystem.config.js
pm2 save
```

## Configuração SSL com Certbot

### 1. Instalar Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obter certificado SSL

```bash
sudo certbot --nginx -d seu-dominio.com -d www.seu-dominio.com
```

Siga as instruções do Certbot. Ele modificará automaticamente a configuração do Nginx para usar HTTPS.

### 3. Verificar renovação automática

```bash
sudo certbot renew --dry-run
```

O Certbot adiciona uma tarefa cron para renovação automática dos certificados.

## Monitoramento e Manutenção

### 1. Monitorar logs da aplicação

```bash
pm2 logs cobrar
```

### 2. Monitorar status da aplicação

```bash
pm2 status
pm2 monit  # Interface de monitoramento
```

### 3. Atualizar a aplicação

```bash
cd /cobrar
git pull
npm install
npm run build
pm2 restart cobrar
```

### 4. Backup do banco de dados

Configurar backup periódico do MySQL:

```bash
sudo mkdir -p /backup
sudo mysqldump -u root -p cobrar > /backup/cobrar_$(date +%Y-%m-%d).sql
```

Crie um script de backup e configure uma tarefa cron para executá-lo periodicamente:

```bash
sudo nano /etc/cron.daily/backup-cobrar
```

Conteúdo do script:

```bash
#!/bin/bash
BACKUP_DIR="/backup"
MYSQL_USER="root"
MYSQL_PASSWORD="sua_senha_root"
DATABASE="cobrar"
DATE=$(date +%Y-%m-%d)

# Criar backup
mysqldump --user=$MYSQL_USER --password=$MYSQL_PASSWORD $DATABASE > $BACKUP_DIR/cobrar_$DATE.sql

# Opcional: compactar o arquivo
gzip -f $BACKUP_DIR/cobrar_$DATE.sql

# Opcional: Remover backups com mais de 30 dias
find $BACKUP_DIR -name "cobrar_*.sql.gz" -type f -mtime +30 -delete
```

Torne o script executável:

```bash
sudo chmod +x /etc/cron.daily/backup-cobrar
```

## Solução de Problemas

### Verificar logs do Nginx

```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### Verificar logs do MySQL

```bash
sudo tail -f /var/log/mysql/error.log
```

### Verificar logs do PM2

```bash
pm2 logs
```

### Reiniciar serviços

```bash
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart cobrar
```

---

## Recursos Adicionais

- [Documentação do Node.js](https://nodejs.org/en/docs/)
- [Documentação do PM2](https://pm2.keymetrics.io/docs/usage/quick-start/)
- [Documentação do Nginx](https://nginx.org/en/docs/)
- [Documentação do MySQL](https://dev.mysql.com/doc/)
- [Documentação do Certbot](https://certbot.eff.org/docs/) 