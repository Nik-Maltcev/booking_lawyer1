import bcrypt from 'bcryptjs'

export const USERS = [
  {
    id: 'admin-id',
    email: 'admin@example.com',
    name: 'Super Admin',
    password: '', // hashed 'admin123'
    role: 'ADMIN',
    bookingLink: 'admin-link',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lawyer1-id',
    email: 'lawyer1@example.com',
    name: 'Lawyer One',
    password: '', // hashed 'lawyer123'
    role: 'USER',
    bookingLink: 'lawyer1',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'lawyer2-id',
    email: 'lawyer2@example.com',
    name: 'Lawyer Two',
    password: '', // hashed 'lawyer123'
    role: 'USER',
    bookingLink: 'lawyer2',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const AVAILABILITIES = [
  {
    id: 'avail1',
    userId: 'lawyer1-id',
    dayOfWeek: 1, // Monday
    startTime: '09:00',
    endTime: '17:00',
    duration: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
   {
    id: 'avail2',
    userId: 'lawyer2-id',
    dayOfWeek: 2, // Tuesday
    startTime: '10:00',
    endTime: '16:00',
    duration: 30,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export const BOOKINGS: any[] = [];

// Initialize passwords
(async () => {
  USERS[0].password = await bcrypt.hash('admin123', 10);
  USERS[1].password = await bcrypt.hash('lawyer123', 10);
  USERS[2].password = await bcrypt.hash('lawyer123', 10);
})();

export const db = {
  users: USERS,
  availabilities: AVAILABILITIES,
  bookings: BOOKINGS,
};
