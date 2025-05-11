const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();
const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/skillswap';

const clients = [
  { name: 'Ayesha Siddiqui', email: 'ayesha.siddiqui@example.com', password: 'password1', role: 'client', phone: '03001234567' },
  { name: 'Bilal Khan', email: 'bilal.khan@example.com', password: 'password2', role: 'client', phone: '03011234567' },
  { name: 'Fatima Noor', email: 'fatima.noor@example.com', password: 'password3', role: 'client', phone: '03021234567' },
  { name: 'Imran Qureshi', email: 'imran.qureshi@example.com', password: 'password4', role: 'client', phone: '03031234567' },
  { name: 'Zainab Ali', email: 'zainab.ali@example.com', password: 'password5', role: 'client', phone: '03041234567' },
];

const freelancers = [
  { name: 'Hamza Farooq', email: 'hamza.farooq@example.com', password: 'password1', role: 'freelancer', phone: '03101234567', skills: ['Web Development', 'React'], portfolio: [], isPremium: false },
  { name: 'Maryam Javed', email: 'maryam.javed@example.com', password: 'password2', role: 'freelancer', phone: '03111234567', skills: ['Graphic Design'], portfolio: [], isPremium: false },
  { name: 'Usman Ahmed', email: 'usman.ahmed@example.com', password: 'password3', role: 'freelancer', phone: '03121234567', skills: ['Content Writing'], portfolio: [], isPremium: false },
  { name: 'Sana Malik', email: 'sana.malik@example.com', password: 'password4', role: 'freelancer', phone: '03131234567', skills: ['SEO'], portfolio: [], isPremium: false },
  { name: 'Yasir Hussain', email: 'yasir.hussain@example.com', password: 'password5', role: 'freelancer', phone: '03141234567', skills: ['Mobile Apps'], portfolio: [], isPremium: false },
];

async function seed() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  await User.deleteMany({}); // Remove all users before seeding

  const allUsers = [...clients, ...freelancers];
  for (const user of allUsers) {
    const hashedPassword = await bcrypt.hash(user.password, 10);
    let userData = {
      name: user.name,
      email: user.email,
      password: hashedPassword,
      role: user.role,
      phone: user.phone || '',
      isVerified: true,
      createdAt: new Date(),
      image: '',
      skills: user.skills || [],
      portfolio: user.portfolio || [],
      profileCompleteness: 0,
      isPremium: user.isPremium || false
    };
    if (user.role === 'freelancer') {
      userData.verificationStatus = 'pending'; // require admin approval for seeded freelancers
      userData.verified = false;
    } else {
      userData.verificationStatus = 'approved';
      userData.verified = true;
    }
    await User.create(userData);
  }

  console.log('Seeded 5 clients and 5 freelancers!');
  mongoose.disconnect();
}

seed().catch(err => {
  console.error(err);
  mongoose.disconnect();
});