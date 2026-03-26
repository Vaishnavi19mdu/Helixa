// seedUsers.js
// Run with: node seedUsers.js
// Requires: npm install firebase-admin
// Place your Firebase service account JSON at ./serviceAccount.json
//
// Creates 5 doctors + 5 patients with full profile & settings data.
// Passwords are hashed by Firebase Auth — this script uses Admin SDK
// to create Auth users AND Firestore documents in one go.

import { readFileSync } from 'fs';
import admin from 'firebase-admin';

const serviceAccount = JSON.parse(readFileSync('./serviceAccount.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db   = admin.firestore();
const auth = admin.auth();

// ── Seed Data ────────────────────────────────────────────────────────────────

const DOCTORS = [
  {
    firstName:    'Priya',
    lastName:     'Ramesh',
    email:        'priya.ramesh@helixa.dev',
    password:     'Helixa@123',
    role:         'doctor',
    doctorStatus: 'approved',
    profilePic:   'https://ui-avatars.com/api/?name=Priya+Ramesh&background=007099&color=fff&size=200',
    profile: {
      phone:      '+91 98401 12345',
      location:   'Chennai, Tamil Nadu',
      specialty:  'Cardiologist',
      experience: '14',
      bio:        'Senior cardiologist with 14 years of experience at Apollo Hospitals. Specialising in interventional cardiology and heart failure management.',
      licenseNumber: 'TN-MED-20456',
      hospital:   'Apollo Hospitals, Chennai',
      gender:     'female',
      dob:        '1985-03-12',
    },
    settings: {
      darkMode:    false,
      lowDataMode: false,
      language:    'en',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Arjun',
    lastName:     'Mehta',
    email:        'arjun.mehta@helixa.dev',
    password:     'Helixa@123',
    role:         'doctor',
    doctorStatus: 'approved',
    profilePic:   'https://ui-avatars.com/api/?name=Arjun+Mehta&background=007099&color=fff&size=200',
    profile: {
      phone:      '+91 99870 54321',
      location:   'Mumbai, Maharashtra',
      specialty:  'Neurologist',
      experience: '11',
      bio:        'Consultant neurologist at Kokilaben Hospital with a focus on epilepsy, stroke rehabilitation, and neurodiagnostics.',
      licenseNumber: 'MH-MED-18732',
      hospital:   'Kokilaben Dhirubhai Ambani Hospital, Mumbai',
      gender:     'male',
      dob:        '1988-07-24',
    },
    settings: {
      darkMode:    true,
      lowDataMode: false,
      language:    'en',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       false,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Deepa',
    lastName:     'Krishnan',
    email:        'deepa.krishnan@helixa.dev',
    password:     'Helixa@123',
    role:         'doctor',
    doctorStatus: 'approved',
    profilePic:   'https://ui-avatars.com/api/?name=Deepa+Krishnan&background=007099&color=fff&size=200',
    profile: {
      phone:      '+91 94450 67890',
      location:   'Bengaluru, Karnataka',
      specialty:  'Pediatrician',
      experience: '9',
      bio:        'Paediatrician at Manipal Hospital with special interest in childhood nutrition, immunisation schedules, and developmental disorders.',
      licenseNumber: 'KA-MED-22101',
      hospital:   'Manipal Hospital, Bengaluru',
      gender:     'female',
      dob:        '1990-11-05',
    },
    settings: {
      darkMode:    false,
      lowDataMode: true,
      language:    'kn',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         false,
      },
    },
  },
  {
    firstName:    'Vikram',
    lastName:     'Nair',
    email:        'vikram.nair@helixa.dev',
    password:     'Helixa@123',
    role:         'doctor',
    doctorStatus: 'pending',
    profilePic:   'https://ui-avatars.com/api/?name=Vikram+Nair&background=007099&color=fff&size=200',
    profile: {
      phone:      '+91 97890 33210',
      location:   'Kochi, Kerala',
      specialty:  'Orthopedic Surgeon',
      experience: '7',
      bio:        'Orthopaedic surgeon with expertise in sports injuries, joint replacement, and minimally invasive procedures at KIMS Hospital.',
      licenseNumber: 'KL-MED-15998',
      hospital:   'KIMS Hospital, Kochi',
      gender:     'male',
      dob:        '1992-01-18',
    },
    settings: {
      darkMode:    false,
      lowDataMode: false,
      language:    'ml',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Rajasri',
    lastName:     'V',
    email:        'rajasri@gmail.com',
    password:     '1234567',
    role:         'doctor',
    doctorStatus: 'approved',
    profilePic:   'https://ui-avatars.com/api/?name=Rajasri+V&background=007099&color=fff&size=200',
    profile: {
      phone:      '+91 94400 11223',
      location:   'Chennai, Tamil Nadu',
      specialty:  'Dermatologist',
      experience: '8',
      bio:        'Consultant dermatologist specialising in skin disorders, cosmetic dermatology, and trichology. Passionate about accessible skincare for all.',
      licenseNumber: 'TN-MED-31045',
      hospital:   'Skin & Care Clinic, Chennai',
      gender:     'female',
      dob:        '1991-08-20',
    },
    settings: {
      darkMode:    false,
      lowDataMode: false,
      language:    'ta',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
];

const PATIENTS = [
  {
    firstName:    'Ananya',
    lastName:     'Sharma',
    email:        'ananya.sharma@helixa.dev',
    password:     'Helixa@123',
    role:         'patient',
    profilePic:   'https://ui-avatars.com/api/?name=Ananya+Sharma&background=7BBA91&color=fff&size=200',
    profile: {
      phone:      '+91 96321 78901',
      location:   'Delhi, India',
      dob:        '1998-06-15',
      gender:     'female',
      bio:        'Looking to manage my chronic migraine and improve overall wellness. Prefer teleconsultations due to busy work schedule.',
      vitals: {
        bloodGroup:  'B+',
        height:      '162 cm',
        weight:      '58 kg',
        bloodPressure: '110/70 mmHg',
      },
      medications: ['Sumatriptan 50mg', 'Vitamin D3 1000IU'],
      allergies:   ['Penicillin', 'Dust'],
    },
    settings: {
      darkMode:    false,
      lowDataMode: false,
      language:    'hi',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Rohan',
    lastName:     'Patel',
    email:        'rohan.patel@helixa.dev',
    password:     'Helixa@123',
    role:         'patient',
    profilePic:   'https://ui-avatars.com/api/?name=Rohan+Patel&background=7BBA91&color=fff&size=200',
    profile: {
      phone:      '+91 93456 21098',
      location:   'Ahmedabad, Gujarat',
      dob:        '1995-09-22',
      gender:     'male',
      bio:        'Type 2 diabetic managing blood sugar levels. Interested in diet guidance and regular check-ins with an endocrinologist.',
      vitals: {
        bloodGroup:  'O+',
        height:      '175 cm',
        weight:      '82 kg',
        bloodPressure: '128/84 mmHg',
      },
      medications: ['Metformin 500mg', 'Glipizide 5mg'],
      allergies:   ['Sulfa drugs'],
    },
    settings: {
      darkMode:    true,
      lowDataMode: false,
      language:    'en',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         false,
      },
    },
  },
  {
    firstName:    'Meena',
    lastName:     'Subramanian',
    email:        'meena.subramanian@helixa.dev',
    password:     'Helixa@123',
    role:         'patient',
    profilePic:   'https://ui-avatars.com/api/?name=Meena+Subramanian&background=7BBA91&color=fff&size=200',
    profile: {
      phone:      '+91 98765 43210',
      location:   'Coimbatore, Tamil Nadu',
      dob:        '2001-03-30',
      gender:     'female',
      bio:        'College student dealing with anxiety and sleep issues. Looking for mental health support and lifestyle advice.',
      vitals: {
        bloodGroup:  'A+',
        height:      '155 cm',
        weight:      '50 kg',
        bloodPressure: '105/68 mmHg',
      },
      medications: ['Melatonin 3mg'],
      allergies:   [],
    },
    settings: {
      darkMode:    false,
      lowDataMode: true,
      language:    'ta',
      notifications: {
        newMessages:          true,
        appointmentReminders: false,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Suresh',
    lastName:     'Reddy',
    email:        'suresh.reddy@helixa.dev',
    password:     'Helixa@123',
    role:         'patient',
    profilePic:   'https://ui-avatars.com/api/?name=Suresh+Reddy&background=7BBA91&color=fff&size=200',
    profile: {
      phone:      '+91 91234 56789',
      location:   'Hyderabad, Telangana',
      dob:        '1978-12-08',
      gender:     'male',
      bio:        'Retired government employee with hypertension and mild arthritis. Looking for regular monitoring and specialist consultations.',
      vitals: {
        bloodGroup:  'AB+',
        height:      '168 cm',
        weight:      '76 kg',
        bloodPressure: '145/92 mmHg',
      },
      medications: ['Amlodipine 5mg', 'Telmisartan 40mg', 'Diclofenac 50mg'],
      allergies:   ['Aspirin', 'Ibuprofen'],
    },
    settings: {
      darkMode:    false,
      lowDataMode: true,
      language:    'te',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       false,
        systemAlerts:         true,
      },
    },
  },
  {
    firstName:    'Karthik',
    lastName:     'S',
    email:        'karthik@gmail.com',
    password:     '1234567',
    role:         'patient',
    profilePic:   'https://ui-avatars.com/api/?name=Karthik+S&background=7BBA91&color=fff&size=200',
    profile: {
      phone:      '+91 98843 67890',
      location:   'Chennai, Tamil Nadu',
      dob:        '1999-04-11',
      gender:     'male',
      bio:        'Software engineering student dealing with frequent headaches and back pain from long screen hours. Looking for lifestyle and ergonomics advice.',
      vitals: {
        bloodGroup:  'O+',
        height:      '172 cm',
        weight:      '68 kg',
        bloodPressure: '118/76 mmHg',
      },
      medications: ['Paracetamol 500mg (as needed)'],
      allergies:   ['Pollen'],
    },
    settings: {
      darkMode:    true,
      lowDataMode: false,
      language:    'ta',
      notifications: {
        newMessages:          true,
        appointmentReminders: true,
        symptomUpdates:       true,
        systemAlerts:         true,
      },
    },
  },
];

// ── Seeder ───────────────────────────────────────────────────────────────────

const seedUser = async (userData) => {
  const { email, password, firstName, lastName, role, profilePic, profile, settings, doctorStatus } = userData;

  try {
    // 1. Create Firebase Auth user
    let authUser;
    try {
      authUser = await auth.createUser({
        email,
        password,
        displayName: `${firstName} ${lastName}`,
        photoURL:    profilePic,
      });
      console.log(`✅ Auth created: ${email}`);
    } catch (err) {
      if (err.code === 'auth/email-already-exists') {
        authUser = await auth.getUserByEmail(email);
        console.log(`⚠️  Auth exists, reusing: ${email}`);
      } else {
        throw err;
      }
    }

    // 2. Write Firestore document
    const docData = {
      id:           authUser.uid,
      firstName,
      lastName,
      email,
      role,
      profilePic,
      profile,
      settings,
      createdAt:    admin.firestore.FieldValue.serverTimestamp(),
      banned:       false,
      ...(role === 'doctor' && { doctorStatus: doctorStatus || 'pending' }),
    };

    await db.collection('users').doc(authUser.uid).set(docData, { merge: true });
    console.log(`📄 Firestore doc written: ${firstName} ${lastName} (${role})`);

    // 3. Seed a welcome notification
    await db
      .collection('notifications')
      .doc(authUser.uid)
      .collection('items')
      .add({
        title:     '👋 Welcome to Helixa!',
        message:   `Hi ${firstName}, your account is all set. ${role === 'doctor' ? 'Complete your profile to start accepting patients.' : 'Try the AI Symptom Checker to get started.'}`,
        type:      'info',
        read:      false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

    return authUser.uid;
  } catch (err) {
    console.error(`❌ Failed for ${email}:`, err.message);
    return null;
  }
};

const run = async () => {
  console.log('\n🌱 Helixa Seed Script Starting...\n');
  console.log('── Seeding Doctors ──────────────────────────────');
  for (const d of DOCTORS)  await seedUser(d);

  console.log('\n── Seeding Patients ─────────────────────────────');
  for (const p of PATIENTS) await seedUser(p);

  console.log('\n✅ All done! Check your Firebase console.\n');
  process.exit(0);
};

run();