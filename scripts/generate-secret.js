#!/usr/bin/env node

/**
 * Генератор безопасного секретного ключа для NEXTAUTH_SECRET
 * Использование: node scripts/generate-secret.js
 */

const crypto = require('crypto')

const secret = crypto.randomBytes(32).toString('base64')

console.log('🔐 Сгенерирован безопасный NEXTAUTH_SECRET:')
console.log('')
console.log(secret)
console.log('')
console.log('📋 Добавьте эту строку в ваши переменные окружения:')
console.log(`NEXTAUTH_SECRET="${secret}"`)
console.log('')
console.log('💡 Для Railway: добавьте эту переменную в раздел Variables вашего проекта')
