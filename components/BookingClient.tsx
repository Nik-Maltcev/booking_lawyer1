'use client'

import { useState, useMemo } from 'react'
import { format, addDays, isSameDay, addMinutes } from 'date-fns'
import { ru } from 'date-fns/locale'

interface Lawyer {
  id: string
  name: string | null
  email: string
  availabilities: Availability[]
  bookings: { bookingDate: Date; duration: number }[]
}

interface Availability {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  duration: number
}

interface TimeSlot {
  time: Date
  available: boolean
  duration: number
}

export default function BookingClient({ lawyer }: { lawyer: Lawyer }) {
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [step, setStep] = useState<'calendar' | 'details' | 'payment'>('calendar')

  const [formData, setFormData] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
  })

  // Генерируем даты на следующие 30 дней
  const availableDates = useMemo(() => {
    const dates: Date[] = []
    const today = new Date()

    for (let i = 0; i < 30; i++) {
      const date = addDays(today, i)
      const dayOfWeek = date.getDay()

      // Проверяем, есть ли доступность для этого дня недели
      const hasAvailability = lawyer.availabilities.some(
        (a) => a.dayOfWeek === dayOfWeek
      )

      if (hasAvailability) {
        dates.push(date)
      }
    }

    return dates
  }, [lawyer.availabilities])

  // Генерируем временные слоты для выбранной даты
  const availableTimeSlots = useMemo(() => {
    if (!selectedDate) return []

    const dayOfWeek = selectedDate.getDay()
    const dayAvailabilities = lawyer.availabilities.filter(
      (a) => a.dayOfWeek === dayOfWeek
    )

    const slots: TimeSlot[] = []

    dayAvailabilities.forEach((availability) => {
      const [startHour, startMinute] = availability.startTime.split(':').map(Number)
      const [endHour, endMinute] = availability.endTime.split(':').map(Number)

      let currentTime = new Date(selectedDate)
      currentTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(selectedDate)
      endTime.setHours(endHour, endMinute, 0, 0)

      while (currentTime < endTime) {
        // Проверяем, не занят ли этот слот
        const isBooked = lawyer.bookings.some((booking) => {
          const bookingDate = new Date(booking.bookingDate)
          const bookingEnd = addMinutes(bookingDate, booking.duration)
          const slotEnd = addMinutes(currentTime, availability.duration)

          return (
            (currentTime >= bookingDate && currentTime < bookingEnd) ||
            (slotEnd > bookingDate && slotEnd <= bookingEnd)
          )
        })

        // Проверяем, что слот в будущем
        const isFuture = currentTime > new Date()

        slots.push({
          time: new Date(currentTime),
          available: !isBooked && isFuture,
          duration: availability.duration,
        })

        currentTime = addMinutes(currentTime, availability.duration)
      }
    })

    return slots.sort((a, b) => a.time.getTime() - b.time.getTime())
  }, [selectedDate, lawyer.availabilities, lawyer.bookings])

  const handleBooking = async () => {
    if (!selectedSlot || !formData.clientName || !formData.clientEmail) {
      alert('Заполните все обязательные поля')
      return
    }

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lawyerId: lawyer.id,
          clientName: formData.clientName,
          clientEmail: formData.clientEmail,
          clientPhone: formData.clientPhone,
          bookingDate: selectedSlot.time.toISOString(),
          duration: selectedSlot.duration,
        }),
      })

      if (response.ok) {
        setStep('payment')
      } else {
        alert('Ошибка при создании записи')
      }
    } catch (error) {
      console.error('Booking error:', error)
      alert('Произошла ошибка')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-6">
          <h1 className="text-2xl font-bold mb-2">
            Запись на онлайн-консультацию
          </h1>
          <p className="text-gray-600 mb-6">
            Юрист: {lawyer.name || lawyer.email}
          </p>

          {step === 'calendar' && (
            <>
              <h2 className="text-lg font-medium mb-4">Выберите дату</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mb-6">
                {availableDates.slice(0, 10).map((date) => (
                  <button
                    key={date.toISOString()}
                    onClick={() => setSelectedDate(date)}
                    className={`p-3 border rounded-md text-sm ${
                      selectedDate && isSameDay(selectedDate, date)
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

              {selectedDate && (
                <>
                  <h2 className="text-lg font-medium mb-4">Выберите время</h2>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                    {availableTimeSlots.map((slot, index) => (
                      <button
                        key={index}
                        onClick={() => {
                          if (slot.available) {
                            setSelectedSlot(slot)
                            setStep('details')
                          }
                        }}
                        disabled={!slot.available}
                        className={`p-2 border rounded-md text-sm ${
                          slot.available
                            ? 'border-gray-300 hover:border-blue-500 hover:bg-blue-50'
                            : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {format(slot.time, 'HH:mm')}
                        <div className="text-xs">{slot.duration} мин</div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </>
          )}

          {step === 'details' && selectedSlot && (
            <>
              <div className="mb-6 p-4 bg-blue-50 rounded-md">
                <p className="text-sm text-gray-700">
                  <strong>Выбранная дата:</strong>{' '}
                  {format(selectedSlot.time, 'dd MMMM yyyy, HH:mm', { locale: ru })}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Длительность:</strong> {selectedSlot.duration} минут
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Тип:</strong> Онлайн-консультация
                </p>
              </div>

              <h2 className="text-lg font-medium mb-4">Ваши данные</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ваше имя *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.clientName}
                    onChange={(e) =>
                      setFormData({ ...formData, clientName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Иван Иванов"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.clientEmail}
                    onChange={(e) =>
                      setFormData({ ...formData, clientEmail: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="ivan@example.com"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Телефон
                  </label>
                  <input
                    type="tel"
                    value={formData.clientPhone}
                    onChange={(e) =>
                      setFormData({ ...formData, clientPhone: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+7 (900) 123-45-67"
                  />
                </div>
              </div>

              <div className="mt-6 flex space-x-4">
                <button
                  onClick={() => setStep('calendar')}
                  className="px-6 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Назад
                </button>
                <button
                  onClick={handleBooking}
                  className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Продолжить к оплате
                </button>
              </div>
            </>
          )}

          {step === 'payment' && (
            <div className="text-center py-8">
              <div className="mb-6">
                <svg
                  className="mx-auto h-16 w-16 text-green-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-4">Запись создана!</h2>
              <p className="text-gray-600 mb-6">
                Детали консультации отправлены на ваш email
              </p>

              {/* Кнопка оплаты (плейсхолдер) */}
              <div className="max-w-md mx-auto">
                <button
                  onClick={() => alert('Интеграция с платежной системой будет добавлена позже')}
                  className="w-full px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                >
                  Оплатить консультацию
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  Оплата будет доступна после интеграции платежной системы
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
