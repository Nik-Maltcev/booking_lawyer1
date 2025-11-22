#!/usr/bin/env tsx

/**
 * Скрипт для создания администратора
 * Использование: npx tsx scripts/create-admin.ts <email> <password> <name>
 */

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function createAdmin() {
  const args = process.argv.slice(2)

  if (args.length < 2) {
    console.error('❌ Использование: npx tsx scripts/create-admin.ts <email> <password> [name]')
    console.error('Пример: npx tsx scripts/create-admin.ts admin@example.com SecurePass123 "Admin Name"')
    process.exit(1)
  }

  const [email, password, name] = args

  try {
    // Проверяем, существует ли уже пользователь
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      console.error(`❌ Пользователь с email ${email} уже существует`)
      process.exit(1)
    }

    // Создаем админа
    const hashedPassword = await bcrypt.hash(password, 12)
    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || email.split('@')[0],
        role: 'ADMIN',
        bookingLink: nanoid(10),
      },
    })

    console.log('✅ Администратор успешно создан!')
    console.log('')
    console.log('📝 Данные для входа:')
    console.log('  Email:', admin.email)
    console.log('  Пароль:', password)
    console.log('  Имя:', admin.name)
    console.log('')
    console.log('🔗 Войдите в систему: /login')
  } catch (error) {
    console.error('❌ Ошибка при создании администратора:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createAdmin()
