# VibeMe AI - Production Deployment Guide

## Repository

-   Git URL: https://github.com/zinminmyat1995/vibeme.ai
-   HTTPS: https://github.com/zinminmyat1995/vibeme.ai.git

------------------------------------------------------------------------

## 1. Server Requirements

-   PHP 8.3+
-   Node.js 22+
-   MySQL 8+
-   Redis
-   Composer
-   NPM
-   Nginx or Apache

------------------------------------------------------------------------

## 2. Required PHP Extensions

ctype, curl, dom, fileinfo, filter, hash, mbstring, openssl, pdo,
session, tokenizer, xml, gd, redis

------------------------------------------------------------------------

## 3. Installation Steps

### Clone Project

``` bash
cd /var/www
git clone https://github.com/zinminmyat1995/vibeme.ai.git vibeme
cd vibeme
```

### Install Dependencies

``` bash
composer install --no-dev --optimize-autoloader
npm install
```

### Environment Setup

``` bash
cp .env.example .env
php artisan key:generate
```

Update .env: - APP_ENV=production - APP_DEBUG=false -
APP_URL=https://yourdomain.com

Database: - DB_DATABASE - DB_USERNAME - DB_PASSWORD

Redis: - QUEUE_CONNECTION=redis

------------------------------------------------------------------------

## 4. Build & Optimize

``` bash
php artisan optimize
npm run build
```

------------------------------------------------------------------------

## 5. Database

``` bash
php artisan migrate --force
php artisan db:seed --force
```

------------------------------------------------------------------------

## 6. Storage

``` bash
php artisan storage:link
chmod -R 775 storage bootstrap/cache
```

------------------------------------------------------------------------

## 7. Queue Worker (Supervisor)

Install:

``` bash
sudo apt install supervisor
```

Config:

``` ini
[program:vibeme-worker]
command=php /var/www/vibeme/artisan queue:work --sleep=3 --tries=3
autostart=true
autorestart=true
stdout_logfile=/var/www/vibeme/storage/logs/worker.log
```

------------------------------------------------------------------------

## 8. Scheduler

``` bash
* * * * * cd /var/www/vibeme && php artisan schedule:run >> /dev/null 2>&1
```

------------------------------------------------------------------------

## 9. Final Checklist

-   .env configured
-   migration done
-   build done
-   queue running
-   cron added

------------------------------------------------------------------------

