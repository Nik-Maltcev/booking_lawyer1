import { db } from './mock-db';
import { nanoid } from 'nanoid';

const mockPrismaClient = {
  $disconnect: async () => {},
  user: {
    findUnique: async ({ where }: any) => {
      if (where.email) {
        return db.users.find(u => u.email === where.email) || null;
      }
      if (where.bookingLink) {
        // Must emulate "include" for BookingPage
        const user = db.users.find(u => u.bookingLink === where.bookingLink);
        if (!user) return null;

        // Basic join emulation
        const availabilities = db.availabilities.filter(a => a.userId === user.id);
        const bookings = db.bookings.filter(b => b.lawyerId === user.id);

        return {
          ...user,
          availabilities,
          bookings
        };
      }
      if (where.id) {
          return db.users.find(u => u.id === where.id) || null;
      }
      return null;
    },
    findMany: async ({ where }: any = {}) => {
      // For Admin Page: findMany({ where: { role: 'USER' }, include: { bookings: ..., _count: ... } })
      let users = db.users;
      if (where?.role) {
        users = users.filter(u => u.role === where.role);
      }

      // Emulate include/joins for admin dashboard
      return users.map(user => {
        const bookings = db.bookings.filter(b => b.lawyerId === user.id);
        const availabilities = db.availabilities.filter(a => a.userId === user.id);
        return {
          ...user,
          bookings,
          availabilities,
          _count: {
            bookings: bookings.length,
            availabilities: availabilities.length
          }
        };
      });
    },
    create: async ({ data }: any) => {
        const newUser = {
            id: nanoid(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...data
        };
        db.users.push(newUser);
        return newUser;
    },
    upsert: async ({ where, update, create }: any) => {
        const existing = db.users.find(u => u.email === where.email);
        if (existing) {
            // emulate update
            Object.assign(existing, update);
            return existing;
        }
        const newUser = {
            id: nanoid(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create
        };
        db.users.push(newUser);
        return newUser;
    }
  },
  availability: {
    findMany: async ({ where }: any) => {
      if (where?.userId) {
        return db.availabilities.filter(a => a.userId === where.userId);
      }
      return db.availabilities;
    },
    create: async ({ data }: any) => {
      const newAvail = {
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        ...data
      };
      db.availabilities.push(newAvail);
      return newAvail;
    },
    createMany: async ({ data }: any) => {
        if (Array.isArray(data)) {
            data.forEach(d => {
                 db.availabilities.push({
                    id: nanoid(),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    ...d
                });
            });
        }
        return { count: data.length };
    },
    delete: async ({ where }: any) => {
      const index = db.availabilities.findIndex(a => a.id === where.id);
      if (index > -1) {
        const deleted = db.availabilities[index];
        db.availabilities.splice(index, 1);
        return deleted;
      }
      throw new Error('Availability not found');
    }
  },
  booking: {
    findMany: async ({ where }: any = {}) => {
      let bookings = db.bookings;
      if (where?.lawyerId) {
        bookings = bookings.filter(b => b.lawyerId === where.lawyerId);
      }
      // OrderBy emulation is skipped for now, but admin page expects it.
      // Arrays are naturally ordered by insertion in this mock.
      return bookings;
    },
    create: async ({ data }: any) => {
      const newBooking = {
        id: nanoid(),
        createdAt: new Date(),
        updatedAt: new Date(),
        status: 'PENDING',
        paymentStatus: false,
        type: 'онлайн-консультация',
        ...data
      };
      db.bookings.push(newBooking);
      return newBooking;
    },
    count: async ({ where }: any = {}) => {
      let bookings = db.bookings;
      if (where?.paymentStatus !== undefined) {
        bookings = bookings.filter(b => b.paymentStatus === where.paymentStatus);
      }
      return bookings.length;
    }
  }
};

// Exporting as 'prisma' to match the existing import in other files
export const prisma = mockPrismaClient;
