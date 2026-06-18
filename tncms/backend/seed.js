require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Ward = require('./models/Ward');

const seed = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Clear existing admin/officer accounts and wards
  await User.deleteMany({ role: { $in: ['admin', 'officer'] } });
  await Ward.deleteMany({});

  // Let the model's pre-save hook handle hashing
  const admin = new User({
    name: 'Super Admin',
    phone: '9000000000',
    email: 'admin@tncms.gov.in',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
  });
  await admin.save();

  const officer1 = new User({
    name: 'Rajan Kumar',
    phone: '9111111111',
    email: 'officer1@tncms.gov.in',
    password: 'Officer@123',
    role: 'officer',
    wardNumber: 1,
    isActive: true,
  });
  await officer1.save();

  const officer2 = new User({
    name: 'Priya Devi',
    phone: '9222222222',
    email: 'officer2@tncms.gov.in',
    password: 'Officer@123',
    role: 'officer',
    wardNumber: 2,
    isActive: true,
  });
  await officer2.save();

  // Create sample wards
  await Ward.create([
    { wardNumber: 1, wardName: 'Anna Nagar', wardNameTamil: 'அண்ணா நகர்', district: 'Chennai', officerId: officer1._id, officerName: officer1.name },
    { wardNumber: 2, wardName: 'T. Nagar', wardNameTamil: 'தி. நகர்', district: 'Chennai', officerId: officer2._id, officerName: officer2.name },
    { wardNumber: 3, wardName: 'Adyar', wardNameTamil: 'அடையாறு', district: 'Chennai' },
    { wardNumber: 4, wardName: 'Tambaram', wardNameTamil: 'தாம்பரம்', district: 'Chennai' },
    { wardNumber: 5, wardName: 'Velachery', wardNameTamil: 'வேளச்சேரி', district: 'Chennai' },
  ]);

  console.log('\n✅ Seed completed!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🔐 ADMIN LOGIN');
  console.log('   Phone    : 9000000000');
  console.log('   Password : Admin@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👮 OFFICER 1 (Ward 1 - Anna Nagar)');
  console.log('   Phone    : 9111111111');
  console.log('   Password : Officer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('👮 OFFICER 2 (Ward 2 - T. Nagar)');
  console.log('   Phone    : 9222222222');
  console.log('   Password : Officer@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  await mongoose.disconnect();
  process.exit(0);
};

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
