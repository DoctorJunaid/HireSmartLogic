import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import User from '../models/User.js'; // Adjust path if needed

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.DATABASE_URI+"/HireSmart");
        console.log('Connected to MongoDB');

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'junaid.aurangzeb1@gmail.com' });

        if (existingAdmin) {
            console.log('Admin user already exists. Skipping seed.');
            process.exit(0);
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash('Khan076k@', salt);

        const adminUser = new User({
            full_name: 'System Administrator',
            email: 'junaid.aurangzeb1@gmail.com',
            password: hashedPassword,
            role: 'admin',
            isVerified: true,
            authType: 'local'
        });

        await adminUser.save();
        console.log('Admin user created successfully:');
        console.log('Email: junaid.aurangzeb1@gmail.com');
        console.log('Password: Khan076k@');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding admin user:', error);
        process.exit(1);
    }
};

seedAdmin();
