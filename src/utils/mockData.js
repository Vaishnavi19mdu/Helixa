export const mockUser = {
  id: '1',
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane.doe@example.com',
  role: 'patient',
  profilePic: 'https://picsum.photos/seed/jane/200/200',
};

export const mockDoctor = {
  id: '2',
  firstName: 'Gregory',
  lastName: 'House',
  email: 'dr.house@helixa.com',
  role: 'doctor',
  profilePic: 'https://picsum.photos/seed/doctor/200/200',
};

export const mockAnalytics = [
  { name: 'Mon', value: 400 },
  { name: 'Tue', value: 300 },
  { name: 'Wed', value: 600 },
  { name: 'Thu', value: 800 },
  { name: 'Fri', value: 500 },
  { name: 'Sat', value: 900 },
  { name: 'Sun', value: 700 },
];

export const mockTasks = [
  { id: 1, text: 'Check morning vitals', completed: true },
  { id: 2, text: 'Update patient records', completed: false },
  { id: 3, text: 'Review AI symptom report', completed: false },
  { id: 4, text: 'Follow-up with Dr. Smith', completed: false },
];

export const mockSymptomResults = {
  condition: 'Common Cold',
  confidence: 85,
  description: 'A viral infection of your nose and throat (upper respiratory tract). It\'s usually harmless, although it might not feel that way.',
  recommendations: [
    'Rest and stay hydrated',
    'Over-the-counter pain relievers',
    'Gargle with salt water',
    'Use saline nasal drops',
  ],
};
