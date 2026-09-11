import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/canlua';
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[MongoDB] Connected successfully to ${uri}`);
    await ensureDefaultUsers();
  } catch (error) {
    console.error(`[MongoDB] Connection error:`, error);
    console.warn(`[MongoDB] Operating in local memory fallback or waiting for database connection.`);
  }
};

const ensureDefaultUsers = async () => {
  try {
    const { User } = await import('../models/User');
    const bcrypt = (await import('bcryptjs')).default;
    const adminExists = await User.findOne({ username: 'admin' });
    if (!adminExists) {
      const salt = await bcrypt.genSalt(10);
      const defaultPasswordHash = await bcrypt.hash('123456', salt);
      await User.create({
        username: 'admin',
        passwordHash: defaultPasswordHash,
        fullName: 'Quản Trị Viên Hệ Thống',
        role: 'admin',
        phone: '0901000001',
        isActive: true,
      });
      console.log('🌾 [Auto-Seed] Created default admin account (admin / 123456)');
    }
  } catch (err) {
    console.error('Error ensuring default admin user:', err);
  }
};
