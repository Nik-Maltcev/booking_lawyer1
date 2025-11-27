'use client'

import { useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { format, addDays, addMinutes, isSameDay } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Availability {
  id: string
  dayOfWeek?: number
  day_of_week?: number
  startTime?: string
  start_time?: string
  endTime?: string
  end_time?: string
  duration: number
}

interface Booking {
  id: string
  clientName: string
  clientEmail: string
  clientPhone: string | null
  bookingDate: string | Date
  booking_date?: string
  duration: number
  status: string
  paymentStatus: boolean
}

interface User {
  id: string
  email: string
  name: string | null
  bookingLink?: string
  booking_link?: string
  availabilities: Availability[]
  bookings: Booking[]
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

const getDayOfWeek = (a: Availability) => a.dayOfWeek ?? a.day_of_week ?? 0
const getStart = (a: Availability) => a.startTime ?? a.start_time ?? '00:00'
const getEnd = (a: Availability) => a.endTime ?? a.end_time ?? '00:00'

export default function DashboardClient({ user }: { user: User }) {
  const [showAvailabilityForm, setShowAvailabilityForm] = useState(false)
  const [availabilityForm, setAvailabilityForm] = useState({
    dayOfWeek: 1,
    startTime: '09:00',
    endTime: '18:00',
    duration: 60,
  })
  const [calendarAvailabilityForm, setCalendarAvailabilityForm] = useState({
    date: '',
    startTime: '09:00',
    endTime: '18:00',
    duration: 60,
  })
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(null)

  const bookingLink = user.bookingLink || user.booking_link || ''
  const bookingUrl = `${window.location.origin}/book/${bookingLink}`

  const normalizedBookings = useMemo(
    () =>
      (user.bookings || []).map((b) => ({
        ...b,
        bookingDate:
          typeof b.bookingDate === 'string'
            ? new Date(b.bookingDate)
            : b.bookingDate ?? (b.booking_date ? new Date(b.booking_date) : new Date()),
      })),
    [user.bookings]
  )

  const calendarDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()
    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      const dayOfWeek = date.getDay()
      const hasAvailability = user.availabilities.some(
        (a) => getDayOfWeek(a) === dayOfWeek
      )
      if (hasAvailability) dates.push(date)
    }
    return dates
  }, [user.availabilities])

  const calendarSlots = useMemo(() => {
    if (!selectedCalendarDate) return []

    const dayOfWeek = selectedCalendarDate.getDay()
    const dayAvailabilities = user.availabilities.filter(
      (a) => getDayOfWeek(a) === dayOfWeek
    )

    const slots: { time: Date; duration: number; available: boolean }[] = []

    dayAvailabilities.forEach((availability) => {
      const [startHour, startMinute] = getStart(availability).split(':').map(Number)
      const [endHour, endMinute] = getEnd(availability).split(':').map(Number)

      let currentTime = new Date(selectedCalendarDate)
      currentTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(selectedCalendarDate)
      endTime.setHours(endHour, endMinute, 0, 0)

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, availability.duration)

        const isBooked = normalizedBookings.some((booking) => {
          const bookingStart = new Date(booking.bookingDate)
          const bookingEnd = addMinutes(bookingStart, booking.duration)
          return (
            (currentTime >= bookingStart && currentTime < bookingEnd) ||
            (slotEnd > bookingStart && slotEnd <= bookingEnd)
          )
        })

        slots.push({
          time: new Date(currentTime),
          duration: availability.duration,
          available: !isBooked,
        })

        currentTime = addMinutes(currentTime, availability.duration)
      }
    })

    return slots.sort((a, b) => a.time.getTime() - b.time.getTime())
  }, [selectedCalendarDate, user.availabilities, normalizedBookings])

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

  const handleAddAvailabilityByDate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!calendarAvailabilityForm.date) return

    const dayOfWeek = new Date(calendarAvailabilityForm.date).getDay()

    try {
      const response = await fetch('/api/availability', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dayOfWeek,
          startTime: calendarAvailabilityForm.startTime,
          endTime: calendarAvailabilityForm.endTime,
          duration: calendarAvailabilityForm.duration,
        }),
      })

      if (response.ok) {
        window.location.reload()
      }
    } catch (error) {
      console.error('Error adding availability by date:', error)
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
              <h1 className="text-xl font-bold">Кабинет юриста</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">{user.email}</span>
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
        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Ссылка для записи</h2>
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
              Скопировать
            </button>
          </div>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Календарь слотов (30 дней)</h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-4">
            {calendarDates.map((date) => (
              <button
                key={date.toISOString()}
                onClick={() => setSelectedCalendarDate(date)}
                className={`p-3 border rounded-md text-sm ${
                  selectedCalendarDate && isSameDay(selectedCalendarDate, date)
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'border-gray-300 hover:border-blue-500'
                }`}
              >
                <div className="font-medium">
                  {format(date, 'dd MMM', { locale: ru })}
                </div>
                <div className="text-xs">
                  {format(date, 'EEEE', { locale: ru })}
                </div>
              </button>
            ))}
          </div>

          {selectedCalendarDate && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-gray-700">
                Слоты на {format(selectedCalendarDate, 'dd MMMM, EEEE', { locale: ru })}
              </h3>
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                {calendarSlots.length === 0 ? (
                  <div className="col-span-3 text-gray-500 text-sm">
                    Нет открытых слотов на этот день
                  </div>
                ) : (
                  calendarSlots.map((slot, idx) => (
                    <div
                      key={idx}
                      className={`p-2 border rounded-md text-sm ${
                        slot.available
                          ? 'border-green-300 bg-green-50'
                          : 'border-red-200 bg-red-50 text-red-700'
                      }`}
                    >
                      {format(slot.time, 'HH:mm')} · {slot.duration} мин
                      <div className="text-xs">
                        {slot.available ? 'Свободно' : 'Занято'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium mb-4">Добавить слот в календарь</h2>
          <form
            onSubmit={handleAddAvailabilityByDate}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата
              </label>
              <input
                type="date"
                required
                value={calendarAvailabilityForm.date}
                onChange={(e) =>
                  setCalendarAvailabilityForm({
                    ...calendarAvailabilityForm,
                    date: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начало
              </label>
              <input
                type="time"
                required
                value={calendarAvailabilityForm.startTime}
                onChange={(e) =>
                  setCalendarAvailabilityForm({
                    ...calendarAvailabilityForm,
                    startTime: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Конец
              </label>
              <input
                type="time"
                required
                value={calendarAvailabilityForm.endTime}
                onChange={(e) =>
                  setCalendarAvailabilityForm({
                    ...calendarAvailabilityForm,
                    endTime: e.target.value,
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Длительность слота
              </label>
              <select
                value={calendarAvailabilityForm.duration}
                onChange={(e) =>
                  setCalendarAvailabilityForm({
                    ...calendarAvailabilityForm,
                    duration: parseInt(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value={30}>30 минут</option>
                <option value={60}>60 минут</option>
              </select>
            </div>
            <div className="md:col-span-4">
              <button
                type="submit"
                className="w-full md:w-auto px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Добавить слот
              </button>
            </div>
          </form>
        </div>

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium">Ваши регулярные слоты</h2>
            <button
              onClick={() => setShowAvailabilityForm(!showAvailabilityForm)}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              {showAvailabilityForm ? 'Скрыть' : 'Добавить расписание'}
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
                    Начало
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
                    Конец
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
                Пока нет открытых слотов по расписанию.
              </p>
            ) : (
              user.availabilities.map((availability) => (
                <div
                  key={availability.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <span className="font-medium">
                      {DAYS_OF_WEEK[getDayOfWeek(availability)]}
                    </span>
                    {' - '}
                    <span>
                      {getStart(availability)} - {getEnd(availability)}
                    </span>
                    {' '}
                    <span className="text-sm text-gray-600">
                      (длительность {availability.duration} мин)
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

        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium mb-4">Последние бронирования</h2>
          {user.bookings.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              У вас пока нет бронирований.
            </p>
          ) : (
            <div className="space-y-2">
              {normalizedBookings.map((booking) => (
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
