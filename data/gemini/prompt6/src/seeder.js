const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');

// Load env vars
dotenv.config();

// Connect to DB
mongoose.connect(process.env.MONGODB_URI);

const seedData = async () => {
  try {
    // Clear existing users
    await User.deleteMany();

    // Create admin user
    await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'adminpassword',
      role: 'admin',
    });

    // Create editor user
    await User.create({
      name: 'Editor User',
      email: 'editor@example.com',
      password: 'editorpassword',
      role: 'editor',
    });

    // Create viewer user
    await User.create({
      name: 'Viewer User',
      email: 'viewer@example.com',
      password: 'viewerpassword',
      role: 'user',
    });

    console.log('Data seeded successfully');
    process.exit();
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedData();
