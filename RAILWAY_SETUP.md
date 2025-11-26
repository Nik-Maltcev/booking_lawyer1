# Настройка на Railway

## Переменные окружения для Railway

Добавьте в Railway следующие переменные:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://uhdjjvyzjqvzxuwdyjja.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVoZGpqdnl6anF2enh1d2R5amphIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMzI0MDQsImV4cCI6MjA3OTYwODQwNH0.oZDR8R_pvt-lkCRt3MAhf5raKOJaaN5nQaiO9ls5Ly8

# Database (найди в Supabase: Settings -> Database -> Connection String -> URI)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.uhdjjvyzjqvzxuwdyjja.supabase.co:5432/postgres
```

## Шаги:

1. **Найти DATABASE_URL в Supabase:**
   - Зайди в Supabase Dashboard
   - Settings -> Database
   - Connection String -> URI
   - Скопируй и замени `[YOUR-PASSWORD]` на реальный пароль

2. **Запустить миграцию Prisma:**
   ```bash
   npm install
   npx prisma db push
   ```

3. **Создать админа (опционально):**
   - Зарегистрируйся через UI
   - В Supabase SQL Editor выполни:
   ```sql
   UPDATE profiles SET role = 'ADMIN' WHERE email = 'твой@email.com';
   ```

4. **Задеплой на Railway**

## Что исправлено:

- ✅ Убран NextAuth, используется только Supabase Auth
- ✅ Подключен реальный Prisma вместо mock
- ✅ Исправлена версия Zod (3.23.8)
- ✅ Исправлены модели: user -> profile
- ✅ Добавлен email в создание профиля
