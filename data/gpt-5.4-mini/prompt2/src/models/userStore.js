const bcrypt = require('bcryptjs');

const users = [];

async function seedUsers() {
  if (users.length > 0) {
    return;
  }

  users.push({
    id: '1',
    name: 'Demo User',
    email: 'demo@example.com',
    password: await bcrypt.hash('Password123!', 10),
    createdAt: new Date().toISOString(),
  });
}

module.exports = {
  users,
  seedUsers,
};
