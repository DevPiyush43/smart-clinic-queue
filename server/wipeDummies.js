require('dotenv').config();
const mongoose = require('mongoose');
const Token = require('./models/Token');
const QueueSession = require('./models/QueueSession');
const Notification = require('./models/Notification');
const User = require('./models/User');
const Clinic = require('./models/Clinic');

async function wipeDummies() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('🔗 Connected to DB');
  
  await Token.deleteMany({});
  await QueueSession.deleteMany({});
  await Notification.deleteMany({});
  
  // Keep the Doctor, but remove dummy patients
  await User.deleteMany({ role: 'patient' });
  
  // We keep the main Clinic and the Doctor
  console.log('✅ Wiped all dummy patients, tokens, and sessions!');
  console.log('🏥 The Doctor account and Clinic are preserved and ready for live production.');

  process.exit();
}

wipeDummies().catch(console.error);
