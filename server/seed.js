/**
 * Seed script — run with: node seed.js
 * Creates demo clinic, doctor, 5 patients, and a rich queue session for today.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const connectDB = require('./config/db');
const User = require('./models/User');
const Clinic = require('./models/Clinic');
const Token = require('./models/Token');
const QueueSession = require('./models/QueueSession');

const seed = async () => {
  await connectDB();

  console.log('\n🌱 Seeding database...\n');

  // ── Clean existing data ─────────────────────────────────────────────────
  await Promise.all([
    User.deleteMany({}),
    Clinic.deleteMany({}),
    Token.deleteMany({}),
    QueueSession.deleteMany({}),
  ]);
  console.log('🗑️  Cleared existing data');

  // ── Create Clinic ───────────────────────────────────────────────────────
  const clinic = await Clinic.create({
    name: 'Dr Sharma Clinic',
    doctorName: 'Dr. R. Sharma',
    city: 'Nashik',
    address: '123 MG Road, Nashik, Maharashtra 422001',
    phone: '9000000000',
    workingHours: { start: '09:00', end: '18:00' },
    workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    avgTimePerPatient: 5,
    maxQueueSize: 100,
    isOpen: true,
    isAcceptingBookings: true,
    headUpCount: 2,
    notifEnabled: true,
    queuePublic: true,
  });
  console.log(`✅ Clinic created: ${clinic.name} (${clinic._id})`);

  // ── Create Doctor ───────────────────────────────────────────────────────
  const doctorPassword = await bcrypt.hash('doctor123', 12);
  const doctor = await User.create({
    name: 'Dr. Rajesh Sharma',
    phone: '9000000001',
    role: 'doctor',
    password: doctorPassword,
    clinic: clinic._id,
    avatar: 'DS',
  });
  console.log(`✅ Doctor created: ${doctor.name} — phone: 9000000001, password: doctor123`);

  // ── Create Patients ─────────────────────────────────────────────────────
  const patientsData = [
    { name: 'Rahul Deshmukh', phone: '9876543210', avatar: 'RD' },
    { name: 'Priya Patil', phone: '9876543211', avatar: 'PP' },
    { name: 'Amit Kumar', phone: '9876543212', avatar: 'AK' },
    { name: 'Sneha Joshi', phone: '9876543213', avatar: 'SJ' },
    { name: 'Vikram Singh', phone: '9876543214', avatar: 'VS' },
  ];

  const patients = await User.insertMany(patientsData.map((p) => ({ ...p, role: 'patient' })));
  console.log(`✅ Created ${patients.length} patients`);

  // ── Create Today's Queue Session ────────────────────────────────────────
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const session = await QueueSession.create({
    clinic: clinic._id,
    date: today,
    currentToken: 3,
    currentTokenName: 'Amit',
    nextTokenNumber: 9,
    doneCount: 2,
    totalBooked: 8,
    isActive: true,
    isAcceptingNew: true,
    openedAt: new Date(today.getTime() + 9 * 60 * 60 * 1000), // 9AM
  });

  // ── Create Tokens ───────────────────────────────────────────────────────
  const tokenDefs = [
    { num: 1, patient: 0, status: 'done', pos: 0 },
    { num: 2, patient: 1, status: 'done', pos: 0 },
    { num: 3, patient: 2, status: 'serving', pos: 0 },   // Currently serving Amit
    { num: 4, patient: 3, status: 'waiting', pos: 1 },
    { num: 5, patient: 0, status: 'waiting', pos: 2 },   // Rahul at position 2
    { num: 6, patient: 1, status: 'waiting', pos: 3 },
    { num: 7, patient: 4, status: 'waiting', pos: 4 },
    { num: 8, patient: 3, status: 'waiting', pos: 5 },
  ];

  const createdTokens = [];
  for (const td of tokenDefs) {
    const patient = patients[td.patient];
    const token = await Token.create({
      tokenNumber: td.num,
      displayToken: `#${td.num}`,
      patient: patient._id,
      clinic: clinic._id,
      session: session._id,
      status: td.status,
      position: td.pos,
      estimatedWait: td.pos * 5,
      bookedAt: new Date(today.getTime() + (8 + td.num) * 10 * 60 * 1000),
      qrData: JSON.stringify({
        displayToken: `#${td.num}`,
        clinicName: clinic.name,
        date: today.toLocaleDateString('en-IN'),
        patientName: patient.name,
      }),
      ...(td.status === 'done' || td.status === 'serving' ? { calledAt: new Date() } : {}),
      ...(td.status === 'done' ? { completedAt: new Date() } : {}),
    });
    createdTokens.push(token);
  }

  // Add waiting tokens to session queue (positions 1+)
  const waitingTokens = createdTokens.filter((t) => t.status === 'waiting');
  session.queue = waitingTokens.map((t) => t._id);
  await session.save();

  console.log(`✅ Created ${createdTokens.length} tokens (2 done, 1 serving, 5 waiting)`);
  console.log(`✅ Queue session created — ${waitingTokens.length} in queue\n`);

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('═══════════════════════════════════════════════');
  console.log('🏥  SEED COMPLETE — Demo Credentials');
  console.log('═══════════════════════════════════════════════');
  console.log('Doctor Login:');
  console.log('  Phone:    9000000001');
  console.log('  Password: doctor123');
  console.log('');
  console.log('Patient OTP Login (any of these):');
  patientsData.forEach((p) => console.log(`  ${p.phone} → ${p.name}`));
  console.log('  (OTP logged to console in dev mode)');
  console.log('');
  console.log(`Clinic ID: ${clinic._id}`);
  console.log('═══════════════════════════════════════════════\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
