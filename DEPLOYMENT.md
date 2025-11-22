# Деплой на Railway

Это руководство поможет вам развернуть приложение Booking Lawyer на Railway.

## Предварительные требования

- Аккаунт на [Railway.app](https://railway.app)
- GitHub аккаунт (для подключения репозитория)

## Шаги развертывания

### 1. Создание нового проекта на Railway

1. Войдите в [Railway.app](https://railway.app)
2. Нажмите **"New Project"**
3. Выберите **"Deploy from GitHub repo"**
4. Выберите ваш репозиторий `booking_lawyer`
5. Railway автоматически обнаружит Next.js проект

### 2. Добавление PostgreSQL базы данных

1. В вашем проекте Railway нажмите **"+ New"**
2. Выберите **"Database"** → **"Add PostgreSQL"**
3. Railway автоматически создаст базу данных и добавит переменную `DATABASE_URL`

### 3. Настройка переменных окружения

В разделе **Variables** вашего сервиса добавьте следующие переменные:

#### Обязательные переменные:

```env
# DATABASE_URL уже будет добавлена автоматически при создании PostgreSQL

# NextAuth URL (замените на ваш домен Railway)
NEXTAUTH_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# NextAuth Secret (сгенерируйте случайную строку)
NEXTAUTH_SECRET=your-random-secret-key-minimum-32-characters-long
```

#### Как сгенерировать NEXTAUTH_SECRET:

Выполните в терминале:
```bash
openssl rand -base64 32
```

Или используйте онлайн генератор: https://generate-secret.vercel.app/32

### 4. Настройка домена

1. Railway автоматически предоставит домен вида `your-app.up.railway.app`
2. Вы можете добавить свой домен в разделе **Settings** → **Domains**
3. После добавления домена обновите переменную `NEXTAUTH_URL` на ваш домен

### 5. Применение миграций базы данных

После первого деплоя нужно применить схему базы данных:

#### Вариант 1: Через Railway CLI (рекомендуется)

1. Установите Railway CLI:
```bash
npm i -g @railway/cli
```

2. Войдите в Railway:
```bash
railway login
```

3. Подключитесь к проекту:
```bash
railway link
```

4. Примените схему базы данных:
```bash
railway run npx prisma db push
```

5. (Опционально) Заполните базу тестовыми данными:
```bash
railway run npm run seed
```

#### Вариант 2: Через веб-интерфейс Railway

1. Перейдите в ваш сервис на Railway
2. Откройте вкладку **"Settings"**
3. Найдите раздел **"Deploy"**
4. В поле **"Custom Start Command"** временно установите:
```bash
npx prisma db push && npm start
```
5. Сохраните и дождитесь редеплоя
6. После успешного деплоя верните команду на `npm start`

### 6. Создание первого администратора

После применения миграций создайте администратора одним из способов:

#### Способ 1: Используя seed скрипт

```bash
railway run npm run seed
```

Это создаст:
- Админа: `admin@example.com` / `admin123`
- Тестового юриста: `lawyer@example.com` / `lawyer123`

#### Способ 2: Через регистрацию и Prisma Studio

1. Зарегистрируйте пользователя через интерфейс `/register`
2. Откройте Prisma Studio локально с подключением к Railway БД:
```bash
# Скопируйте DATABASE_URL из Railway
export DATABASE_URL="postgresql://..."
npx prisma studio
```
3. Измените роль пользователя с `USER` на `ADMIN`

#### Способ 3: Через SQL в Railway

1. Перейдите в вашу PostgreSQL базу на Railway
2. Откройте вкладку **"Query"**
3. Выполните SQL:
```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'your@email.com';
```

## Переменные окружения (полный список)

```env
# Автоматически добавляется Railway
DATABASE_URL=postgresql://...

# Настройка NextAuth
NEXTAUTH_URL=https://your-app.up.railway.app
NEXTAUTH_SECRET=your-random-secret-key-minimum-32-characters-long

# Опционально: Node.js настройки
NODE_ENV=production
```

## Проверка деплоя

После успешного развертывания:

1. Откройте ваш домен Railway
2. Вы должны увидеть страницу входа
3. Попробуйте зарегистрировать нового пользователя
4. Войдите как администратор для доступа к админ-панели

## Автоматические деплои

Railway автоматически пересобирает и деплоит приложение при каждом push в главную ветку вашего репозитория.

## Мониторинг и логи

- **Логи**: Вкладка **"Deployments"** → выберите деплой → **"View Logs"**
- **Метрики**: Вкладка **"Metrics"** показывает использование CPU, памяти и сети
- **База данных**: Мониторинг PostgreSQL в разделе базы данных

## Резервное копирование базы данных

Railway автоматически создает резервные копии PostgreSQL. Для ручного бэкапа:

```bash
# Через Railway CLI
railway run pg_dump $DATABASE_URL > backup.sql

# Восстановление
railway run psql $DATABASE_URL < backup.sql
```

## Масштабирование

Railway автоматически масштабирует ваше приложение. Для настройки ресурсов:

1. Перейдите в **Settings** → **Resources**
2. Настройте CPU и память по необходимости

## Цены Railway

- **Free Tier**: $5 в месяц в кредитах
- **Pro Plan**: $20/месяц + использование ресурсов

PostgreSQL входит в использование ресурсов.

## Troubleshooting

### Ошибка подключения к базе данных

Проверьте, что:
- PostgreSQL сервис запущен
- Переменная `DATABASE_URL` установлена правильно
- Схема базы данных применена (`prisma db push`)

### Ошибка NextAuth

Проверьте, что:
- `NEXTAUTH_URL` установлена на правильный домен (с https://)
- `NEXTAUTH_SECRET` установлен и имеет длину минимум 32 символа

### Ошибка сборки

Проверьте логи сборки в Railway. Обычные проблемы:
- Отсутствующие зависимости
- Ошибки TypeScript
- Ошибки Prisma

### Приложение не отвечает

1. Проверьте логи в Railway
2. Убедитесь, что команда старта `npm start`
3. Проверьте, что порт правильно настроен (Railway использует `PORT` автоматически)

## Дополнительные ресурсы

- [Railway Documentation](https://docs.railway.app)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma with Railway](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-railway)

## Поддержка

Если возникли проблемы:
1. Проверьте логи в Railway
2. Просмотрите документацию Railway
3. Создайте issue в репозитории проекта
