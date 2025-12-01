'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import { supabase, setupSupabaseAuthListener } from '@/lib/supabase'

interface User {
  id: string
  email: string
  name: string | null
  bookingLink: string
  createdAt: Date
  _count: {
    bookings: number
    availabilities: number
  }
  bookings: Booking[]
}

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  bookingDate: Date
  status: string
  paymentStatus: boolean
}

interface Stats {
  totalUsers: number
  totalBookings: number
  paidBookings: number
  pendingPayments: number
}

export default function AdminClient({
  users,
  stats,
}: {
  users: User[]
  stats: Stats
}) {
  const [selectedUser, setSelectedUser] = useState<User | null>(null)

  useEffect(() => {
    setupSupabaseAuthListener()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Панель администратора</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={async () => {
                  await supabase.auth.signOut()
                  window.location.href = '/login'
                }}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Статистика */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">Всего юристов</div>
            <div className="text-3xl font-bold">{stats.totalUsers}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">Всего записей</div>
            <div className="text-3xl font-bold">{stats.totalBookings}</div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">Оплачено</div>
            <div className="text-3xl font-bold text-green-600">
              {stats.paidBookings}
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-sm text-gray-500">Ожидает оплаты</div>
            <div className="text-3xl font-bold text-yellow-600">
              {stats.pendingPayments}
            </div>
          </div>
        </div>

        {/* Список пользователей */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium">Юристы в системе</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {users.map((user) => (
              <div key={user.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium">
                      {user.name || 'Без имени'}
                    </h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Регистрация:{' '}
                      {format(new Date(user.createdAt), 'dd.MM.yyyy HH:mm', {
                        locale: ru,
                      })}
                    </p>
                  </div>
                  <div className="flex space-x-6 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">
                        {user._count.bookings}
                      </div>
                      <div className="text-xs text-gray-500">Записей</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-600">
                        {user._count.availabilities}
                      </div>
                      <div className="text-xs text-gray-500">Слотов</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center space-x-4">
                  <a
                    href={`/book/${user.bookingLink}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Открыть страницу записи →
                  </a>
                  <button
                    onClick={() =>
                      setSelectedUser(selectedUser?.id === user.id ? null : user)
                    }
                    className="text-sm text-gray-600 hover:text-gray-700"
                  >
                    {selectedUser?.id === user.id
                      ? 'Скрыть записи'
                      : 'Показать записи'}
                  </button>
                </div>

                {/* Список записей пользователя */}
                {selectedUser?.id === user.id && user.bookings.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <h4 className="text-sm font-medium text-gray-700">
                      Записи клиентов:
                    </h4>
                    {user.bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="p-3 bg-gray-50 rounded-md text-sm"
                      >
                        <div className="flex justify-between">
                          <div>
                            <span className="font-medium">
                              {booking.clientName}
                            </span>
                            {' - '}
                            <span className="text-gray-600">
                              {booking.clientEmail}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className="text-gray-600">
                              {format(
                                new Date(booking.bookingDate),
                                'dd.MM.yyyy HH:mm',
                                { locale: ru }
                              )}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs rounded ${
                                booking.paymentStatus
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}
                            >
                              {booking.paymentStatus ? 'Оплачено' : 'Не оплачено'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {users.length === 0 && (
              <div className="p-6 text-center text-gray-500">
                Пока нет зарегистрированных юристов
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
