import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Начинаем заполнение базы данных...')

  // Создаем админа
  const adminPassword = await bcrypt.hash('admin123', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Администратор',
      password: adminPassword,
      role: 'ADMIN',
      bookingLink: nanoid(10),
    },
  })

  console.log('✅ Создан админ:', admin.email)

  // Создаем тестового юриста
  const lawyerPassword = await bcrypt.hash('lawyer123', 12)
  const lawyer = await prisma.user.upsert({
    where: { email: 'lawyer@example.com' },
    update: {},
    create: {
      email: 'lawyer@example.com',
      name: 'Иван Иванов',
      password: lawyerPassword,
      role: 'USER',
      bookingLink: nanoid(10),
    },
  })

  console.log('✅ Создан тестовый юрист:', lawyer.email)

  // Создаем доступность для тестового юриста
  await prisma.availability.createMany({
    data: [
      // Понедельник
      {
        userId: lawyer.id,
        dayOfWeek: 1,
        startTime: '09:00',
        endTime: '12:00',
        duration: 60,
      },
      {
        userId: lawyer.id,
        dayOfWeek: 1,
        startTime: '14:00',
        endTime: '18:00',
        duration: 30,
      },
      // Среда
      {
        userId: lawyer.id,
        dayOfWeek: 3,
        startTime: '10:00',
        endTime: '16:00',
        duration: 60,
      },
      // Пятница
      {
        userId: lawyer.id,
        dayOfWeek: 5,
        startTime: '09:00',
        endTime: '17:00',
        duration: 30,
      },
    ],
  })

  console.log('✅ Создано расписание для тестового юриста')
  console.log('')
  console.log('🎉 База данных успешно заполнена!')
  console.log('')
  console.log('📝 Данные для входа:')
  console.log('Админ:')
  console.log('  Email: admin@example.com')
  console.log('  Пароль: admin123')
  console.log('')
  console.log('Тестовый юрист:')
  console.log('  Email: lawyer@example.com')
  console.log('  Пароль: lawyer123')
  console.log('  Ссылка для записи: /book/' + lawyer.bookingLink)
}

main()
  .catch((e) => {
    console.error('❌ Ошибка при заполнении базы данных:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
