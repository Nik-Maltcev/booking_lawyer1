'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, setupSupabaseAuthListener } from '@/lib/supabase'
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
  type?: string
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
  const router = useRouter()
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
  const [initialScheduleDays, setInitialScheduleDays] = useState<number[]>([])
  const [initialScheduleForm, setInitialScheduleForm] = useState({
    startTime: '09:00',
    endTime: '17:00',
    duration: 60,
  })

  const bookingLink = user.bookingLink || user.booking_link || ''
  const [bookingUrl, setBookingUrl] = useState('')

  useEffect(() => {
    setupSupabaseAuthListener()
    if (typeof window !== 'undefined') {
      setBookingUrl(`${window.location.origin}/book/${bookingLink}`)
    }
  }, [bookingLink])

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

  const todayBookingsCount = useMemo(() => {
    const today = new Date()
    return normalizedBookings.filter((b) => isSameDay(b.bookingDate, today)).length
  }, [normalizedBookings])

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

    const slots: { time: Date; duration: number; state: 'available' | 'booked' | 'blocked' }[] = []

    dayAvailabilities.forEach((availability) => {
      const [startHour, startMinute] = getStart(availability).split(':').map(Number)
      const [endHour, endMinute] = getEnd(availability).split(':').map(Number)

      let currentTime = new Date(selectedCalendarDate)
      currentTime.setHours(startHour, startMinute, 0, 0)

      const endTime = new Date(selectedCalendarDate)
      endTime.setHours(endHour, endMinute, 0, 0)

      while (currentTime < endTime) {
        const slotEnd = addMinutes(currentTime, availability.duration)

        const overlappingBooking = normalizedBookings.find((booking) => {
          const bookingStart = new Date(booking.bookingDate)
          const bookingEnd = addMinutes(bookingStart, booking.duration)
          // Check for any overlap
          return currentTime < bookingEnd && bookingStart < slotEnd
        })

        const isBlocked =
          overlappingBooking?.type === 'BLOCKED' || overlappingBooking?.status === 'BLOCKED'

        slots.push({
          time: new Date(currentTime),
          duration: availability.duration,
          state: overlappingBooking ? (isBlocked ? 'blocked' : 'booked') : 'available',
        })

        currentTime = addMinutes(currentTime, availability.duration)
      }
    })

    return slots.sort((a, b) => a.time.getTime() - b.time.getTime())
  }, [selectedCalendarDate, user.availabilities, normalizedBookings])

  const toggleInitialDay = (day: number) => {
    setInitialScheduleDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const handleCreateInitialSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!initialScheduleDays.length) return

    const payloads = initialScheduleDays.map((day) => ({
      dayOfWeek: day,
      startTime: initialScheduleForm.startTime,
      endTime: initialScheduleForm.endTime,
      duration: initialScheduleForm.duration,
    }))

    try {
      await Promise.all(
        payloads.map((p) =>
          fetch('/api/availability', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(p),
          })
        )
      )
      router.refresh()
    } catch (error) {
      console.error('Error creating schedule:', error)
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
        router.refresh()
      }
    } catch (error) {
      console.error('Error adding availability by date:', error)
    }
  }

  const handleBlockSlot = async (time: Date, duration: number) => {
    const confirmed = confirm('Отметить этот слот как занятый?')
    if (!confirmed) return

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lawyerId: user.id,
          clientName: 'Личное время',
          clientEmail: user.email,
          clientPhone: null,
          bookingDate: time.toISOString(),
          duration,
          status: 'BLOCKED',
          type: 'BLOCKED',
          paymentStatus: false,
        }),
      })

      if (response.ok) {
        router.refresh()
      } else {
        console.error('Failed to block slot', await response.text())
      }
    } catch (error) {
      console.error('Error blocking slot:', error)
    }
  }

  const copyBookingLink = () => {
    navigator.clipboard.writeText(bookingUrl)
    alert('Ссылка скопирована!')
  }

  return (
    <div className="min-h-screen bg-muted/40">
      {/* Top Navigation */}
      <nav className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex w-full items-center gap-4 md:ml-auto md:gap-2 lg:gap-4 justify-between">
          <div className="flex items-center gap-2">
             <h1 className="text-xl font-semibold tracking-tight">Кабинет юриста</h1>
          </div>
          <div className="flex items-center gap-4">
             <span className="text-sm text-muted-foreground hidden md:inline-block">{user.email}</span>
             <button
               onClick={async () => {
                 await supabase.auth.signOut()
                 window.location.href = '/login'
               }}
               className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-3"
             >
               Выйти
             </button>
          </div>
        </div>
      </nav>

      <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        {/* Stats Row */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Записи на сегодня</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M12 2v20M2 12h20" />
              </svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{todayBookingsCount}</div>
              <p className="text-xs text-muted-foreground">
                Клиентов на {format(new Date(), 'dd MMMM', { locale: ru })}
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow">
            <div className="p-6 flex flex-row items-center justify-between space-y-0 pb-2">
              <h3 className="tracking-tight text-sm font-medium">Всего записей</h3>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-muted-foreground"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="p-6 pt-0">
              <div className="text-2xl font-bold">{user.bookings.length}</div>
              <p className="text-xs text-muted-foreground">
                За все время
              </p>
            </div>
          </div>

          <div className="rounded-xl border bg-card text-card-foreground shadow sm:col-span-2 lg:col-span-1">
            <div className="p-6 pb-2">
               <h3 className="tracking-tight text-sm font-medium mb-2">Ссылка для записи</h3>
               <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={bookingUrl}
                  className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                />
                <button
                  onClick={copyBookingLink}
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2"
                >
                  Копия
                </button>
               </div>
            </div>
          </div>
        </div>

        <div className="grid gap-4 md:gap-8 lg:grid-cols-3 xl:grid-cols-3">
          <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
             {/* Initial Setup Card - Only shown if no availabilities */}
             {user.availabilities.length === 0 && (
                <div className="rounded-xl border bg-card text-card-foreground shadow">
                  <div className="flex flex-col space-y-1.5 p-6">
                    <h3 className="font-semibold leading-none tracking-tight">Настройка графика</h3>
                    <p className="text-sm text-muted-foreground">Создайте ваше начальное расписание.</p>
                  </div>
                  <div className="p-6 pt-0">
                    <form onSubmit={handleCreateInitialSchedule} className="space-y-4">
                      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                        {DAYS_OF_WEEK.map((day, idx) => (
                          <label key={idx} className="flex items-center space-x-2 text-sm p-2 border rounded hover:bg-muted cursor-pointer">
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-primary focus:ring-primary"
                              checked={initialScheduleDays.includes(idx)}
                              onChange={() => toggleInitialDay(idx)}
                            />
                            <span>{day.slice(0, 3)}</span>
                          </label>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Начало</label>
                            <input
                              type="time"
                              required
                              value={initialScheduleForm.startTime}
                              onChange={(e) => setInitialScheduleForm({ ...initialScheduleForm, startTime: e.target.value })}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                            />
                         </div>
                         <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Конец</label>
                            <input
                              type="time"
                              required
                              value={initialScheduleForm.endTime}
                              onChange={(e) => setInitialScheduleForm({ ...initialScheduleForm, endTime: e.target.value })}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                            />
                         </div>
                         <div>
                            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Длительность</label>
                            <select
                              value={initialScheduleForm.duration}
                              onChange={(e) => setInitialScheduleForm({ ...initialScheduleForm, duration: parseInt(e.target.value) })}
                              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring mt-1"
                            >
                              <option value={30}>30 минут</option>
                              <option value={60}>60 минут</option>
                            </select>
                         </div>
                      </div>
                      <button
                        type="submit"
                        disabled={!initialScheduleDays.length}
                        className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 py-2 w-full md:w-auto"
                      >
                        Сохранить график
                      </button>
                    </form>
                  </div>
                </div>
             )}

            {/* Calendar Card */}
            <div className="rounded-xl border bg-card text-card-foreground shadow">
              <div className="flex flex-col space-y-1.5 p-6">
                <h3 className="font-semibold leading-none tracking-tight">Календарь записей</h3>
                <p className="text-sm text-muted-foreground">Выберите дату для просмотра слотов.</p>
              </div>
              <div className="p-6 pt-0">
                 <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2 mb-6">
                  {calendarDates.map((date) => (
                    <button
                      key={date.toISOString()}
                      onClick={() => setSelectedCalendarDate(date)}
                      className={`p-2 rounded-md text-sm border transition-colors ${
                        selectedCalendarDate && isSameDay(selectedCalendarDate, date)
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background hover:bg-accent hover:text-accent-foreground'
                      }`}
                    >
                      <div className="font-medium">
                        {format(date, 'dd MMM', { locale: ru })}
                      </div>
                      <div className="text-xs opacity-80">
                        {format(date, 'EEEE', { locale: ru })}
                      </div>
                    </button>
                  ))}
                 </div>

                 {selectedCalendarDate && (
                    <div className="space-y-4 animate-accordion-down">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium">
                          Слоты на {format(selectedCalendarDate, 'dd MMMM', { locale: ru })}
                        </h4>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                        {calendarSlots.length === 0 ? (
                          <div className="col-span-full text-muted-foreground text-sm py-8 text-center bg-muted/20 rounded-md border border-dashed">
                            Нет открытых слотов на этот день
                          </div>
                        ) : (
                          calendarSlots.map((slot, idx) => {
                            const isAvailable = slot.state === 'available'
                            const statusLabel = isAvailable ? 'Свободно' : 'Занято'
                            const statusBadge =
                              slot.state === 'available'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            const buttonClasses = isAvailable
                              ? 'bg-background hover:bg-accent hover:text-accent-foreground border-input cursor-pointer'
                              : 'bg-red-50 border-red-200 text-red-700 cursor-not-allowed'

                            return (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => isAvailable && handleBlockSlot(slot.time, slot.duration)}
                                disabled={!isAvailable}
                                className={`flex flex-col items-start justify-center p-3 rounded-md border text-sm transition-colors ${buttonClasses}`}
                              >
                                <span className="font-medium">{format(slot.time, 'HH:mm')}</span>
                                <span className="text-xs opacity-70">{slot.duration} мин</span>
                                <span className={`mt-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${statusBadge}`}>
                                   {statusLabel}
                                </span>
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                 )}
              </div>
            </div>

            {/* Add Specific Date Slot */}
            <div className="rounded-xl border bg-card text-card-foreground shadow">
               <div className="flex flex-col space-y-1.5 p-6">
                 <h3 className="font-semibold leading-none tracking-tight">Добавить слот вручную</h3>
                 <p className="text-sm text-muted-foreground">Добавьте доступное время на конкретную дату.</p>
               </div>
               <div className="p-6 pt-0">
                  <form onSubmit={handleAddAvailabilityByDate} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid gap-2 flex-1 w-full">
                       <label className="text-sm font-medium">Дата</label>
                       <input
                          type="date"
                          required
                          value={calendarAvailabilityForm.date}
                          onChange={(e) => setCalendarAvailabilityForm({ ...calendarAvailabilityForm, date: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="grid gap-2 w-full sm:w-auto">
                       <label className="text-sm font-medium">Начало</label>
                       <input
                          type="time"
                          required
                          value={calendarAvailabilityForm.startTime}
                          onChange={(e) => setCalendarAvailabilityForm({ ...calendarAvailabilityForm, startTime: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <div className="grid gap-2 w-full sm:w-auto">
                       <label className="text-sm font-medium">Конец</label>
                       <input
                          type="time"
                          required
                          value={calendarAvailabilityForm.endTime}
                          onChange={(e) => setCalendarAvailabilityForm({ ...calendarAvailabilityForm, endTime: e.target.value })}
                          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                        />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-9 px-4 py-2 w-full sm:w-auto"
                    >
                      Добавить
                    </button>
                  </form>
               </div>
            </div>
          </div>

          <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
             {/* Recent Bookings Card */}
             <div className="rounded-xl border bg-card text-card-foreground shadow">
                <div className="flex flex-col space-y-1.5 p-6">
                  <h3 className="font-semibold leading-none tracking-tight">Последние записи</h3>
                  <p className="text-sm text-muted-foreground">Список последних бронирований.</p>
                </div>
                <div className="p-6 pt-0">
                  {user.bookings.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground text-sm">
                      Бронирований пока нет
                    </div>
                  ) : (
                    <div className="space-y-4">
                       {normalizedBookings.slice(0, 5).map((booking) => (
                         <div key={booking.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                           <div className="space-y-1">
                              <p className="text-sm font-medium leading-none">{booking.clientName}</p>
                              <p className="text-xs text-muted-foreground">{booking.clientEmail}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(booking.bookingDate), 'dd MMM, HH:mm', { locale: ru })}
                              </p>
                           </div>
                           <div className="text-right">
                              {booking.type === 'BLOCKED' || booking.status === 'BLOCKED' ? (
                                <span className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80">
                                  Личное
                                </span>
                              ) : (
                                <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent ${
                                  booking.paymentStatus
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {booking.paymentStatus ? 'Оплачено' : 'Ждет'}
                                </span>
                              )}
                           </div>
                         </div>
                       ))}
                    </div>
                  )}
                </div>
             </div>
          </div>
        </div>
      </main>
    </div>
  )
}
