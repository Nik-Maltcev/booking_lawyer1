'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

interface User {
  id: string
  email: string
  name: string | null
  bookingLink: string
  availabilities: Availability[]
  bookings: Booking[]
}

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  duration: number
}

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  bookingDate: Date
  duration: number
  status: string
  paymentStatus: boolean
}

const DAYS_OF_WEEK = [
  'Воскресенье',
  'Понедельник',
  'Вторник',
  'Среда',
  'Четверг',
  'Пятница',
  'Суббота',
]

export default function DashboardClient({ user }: { user: User }) {
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
    duration: 60,
  })

  const bookingUrl = `${window.location.origin}/book/${user.bookingLink}`

  const handleAddAvailability = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(availabilityForm),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding availability:', error)
    }
  }

  const handleDeleteAvailability = async (id: string) => {
    try {
      const response = await fetch(`/api/availability?id=${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting availability:', error)
    }
  }

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    alert('Ссылка скопирована!')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Личный кабинет</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
              <button
                onClick={() => signOut({ callbackUrl: '/login' })}
                className="text-sm text-red-600 hover:text-red-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Ссылка для записи */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Ваша ссылка для записи</h2>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={bookingUrl}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
            />
            <button
              onClick={copyBookingLink}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Копировать
            </button>
          </div>
        </div>

        {/* Управление доступностью */}
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Ваше расписание</h2>
            <button
              onClick={() => setShowAvailabilityForm(!showAvailabilityForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {showAvailabilityForm ? 'Отмена' : 'Добавить слот'}
            </button>
          </div>

          {showAvailabilityForm && (
            <form onSubmit={handleAddAvailability} className="mb-6 p-4 bg-gray-50 rounded-md">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    День недели
                  </label>
                  <select
                    value={availabilityForm.dayOfWeek}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        dayOfWeek: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    {DAYS_OF_WEEK.map((day, index) => (
                      <option key={index} value={index}>
                        {day}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Длительность слота
                  </label>
                  <select
                    value={availabilityForm.duration}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        duration: parseInt(e.target.value),
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value={30}>30 минут</option>
                    <option value={60}>60 минут</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время начала
                  </label>
                  <input
                    type="time"
                    value={availabilityForm.startTime}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        startTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Время окончания
                  </label>
                  <input
                    type="time"
                    value={availabilityForm.endTime}
                    onChange={(e) =>
                      setAvailabilityForm({
                        ...availabilityForm,
                        endTime: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Добавить
              </button>
            </form>
          )}

          <div className="space-y-2">
            {user.availabilities.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Вы еще не добавили ни одного слота доступности
              </p>
            ) : (
              user.availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <span className="font-medium">
                      {DAYS_OF_WEEK[availability.dayOfWeek]}
                    </span>
                    {' - '}
                    <span>
                      {availability.startTime} - {availability.endTime}
                    </span>
                    {' '}
                    <span className="text-sm text-gray-600">
                      (слоты по {availability.duration} мин)
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAvailability(availability.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    Удалить
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Список записей */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Записи на консультации</h2>
          {user.bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              У вас пока нет записей
            </p>
          ) : (
            <div className="space-y-2">
              {user.bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 border border-gray-200 rounded-md"
                >
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{booking.clientName}</p>
                      <p className="text-sm text-gray-600">{booking.clientEmail}</p>
                      {booking.clientPhone && (
                        <p className="text-sm text-gray-600">{booking.clientPhone}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        {format(new Date(booking.bookingDate), 'dd MMMM yyyy, HH:mm', {
                          locale: ru,
                        })}
                      </p>
                      <p className="text-sm text-gray-600">
                        {booking.duration} минут
                      </p>
                      <span
                        className={`inline-block mt-1 px-2 py-1 text-xs rounded ${
                          booking.paymentStatus
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {booking.paymentStatus ? 'Оплачено' : 'Ожидает оплаты'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
