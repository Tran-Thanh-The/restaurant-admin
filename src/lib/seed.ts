import { connectToDatabase } from './mongodb';
import bcrypt from 'bcryptjs';
import { User } from '@/types/database';

export async function seedDatabase() {
  try {
    const { db } = await connectToDatabase();
    
    // Check if users already exist
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      // Create default users
      const defaultUsers: Omit<User, '_id'>[] = [
        {
          username: 'admin',
          password: await bcrypt.hash('admin123', 10),
          role: 'admin',
          fullName: 'Administrator',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: 'manager',
          password: await bcrypt.hash('manager123', 10),
          role: 'manager',
          fullName: 'Manager',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          username: 'staff',
          password: await bcrypt.hash('staff123', 10),
          role: 'staff',
          fullName: 'Staff Member',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      await db.collection('users').insertMany(defaultUsers);
      console.log('✅ Default users created successfully');
    } else {
      console.log('ℹ️ Users already exist, skipping seed');
    }

    // Create indexes
    await db.collection('users').createIndex({ username: 1 }, { unique: true });
    await db.collection('products').createIndex({ name: 1 });
    await db.collection('orders').createIndex({ createdBy: 1 });
    await db.collection('orders').createIndex({ orderAt: -1 });
    await db.collection('order_items').createIndex({ orderId: 1 });
    await db.collection('order_items').createIndex({ productId: 1 });
    
    console.log('✅ Database indexes created successfully');
    
    return { success: true, message: 'Database seeded successfully' };
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}
