// src/components/HelixaBot.jsx
// Landing page assistant bot — uses a KB first, falls back to Groq
// Offline-aware: KB works fully offline, Groq gracefully skipped when no network

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Send, Zap, WifiOff } from 'lucide-react';

// ── Knowledge Base (works fully offline) ─────────────────────────────────────
const KB = [

  // ── General / About ────────────────────────────────────────────────────────
  {
    q: ['what is helixa', 'what does helixa do', 'about helixa', 'tell me about helixa', 'overview', 'introduce'],
    a: "Helixa is an AI-powered healthcare platform combining symptom analysis, real-time doctor-patient communication, offline-first functionality, and multilingual support — designed to work even in low-connectivity and underserved regions."
  },
  {
    q: ['goal', 'objective', 'purpose', 'why helixa', 'mission'],
    a: "Helixa's goal is to let patients seek medical guidance and communicate with doctors even without reliable internet, while giving doctors structured, actionable insights to respond efficiently."
  },
  {
    q: ['hello', 'hi', 'hey', 'help', 'support', 'start'],
    a: "Hi there! 👋 I'm the Helixa assistant. Ask me about features, appointments, offline mode, messaging, and more!"
  },
  {
    q: ['thank', 'thanks', 'thank you', 'great', 'awesome'],
    a: "You're welcome! Feel free to ask anything else about Helixa. 😊"
  },

  // ── Auth & Roles ───────────────────────────────────────────────────────────
  {
    q: ['sign up', 'create account', 'register', 'get started', 'join', 'login', 'log in', 'signup'],
    a: "You can sign up as a Patient or a Doctor. Sessions persist automatically so you stay logged in across visits."
  },
  {
    q: ['roles', 'patient role', 'doctor role', 'role based', 'who can use', 'types of users'],
    a: "Helixa has two roles — Patient and Doctor. Each gets a tailored dashboard, features, and UI based on their role."
  },
  {
    q: ['patient', 'patient dashboard', 'patient features', 'patient side'],
    a: "The Patient Dashboard includes an AI Symptom Checker, upcoming appointments, symptom history, a health summary, daily tips, and quick actions to book appointments or message a doctor."
  },
  {
    q: ['doctor', 'doctor dashboard', 'doctor features', 'doctor side', 'healthcare provider', 'for doctors'],
    a: "The Doctor Dashboard includes an AI Summary Card, alert control center, patient list, analytics graph, real-time notifications, and a priority-based task management system."
  },

  // ── Symptom Checker ────────────────────────────────────────────────────────
  {
    q: ['symptom checker', 'check symptoms', 'symptom', 'ai symptom', 'symptom analysis', 'symptom check'],
    a: "The AI Symptom Checker analyzes your symptoms and gives a preliminary assessment. Results are saved to your history for doctors to review. Always consult a real doctor for serious concerns."
  },

  // ── Messaging & Communication ──────────────────────────────────────────────
  {
    q: ['messaging', 'chat', 'message doctor', 'contact doctor', 'real time chat', 'send message'],
    a: "Helixa has real-time messaging. You can send text messages, voice messages, and join video or voice calls — all from within the app."
  },
  {
    q: ['voice message', 'voice note', 'audio message', 'record message', 'voice'],
    a: "You can record and send voice messages directly in the chat — great for low-literacy users or when typing is inconvenient. Voice messages work offline too."
  },
  {
    q: ['video call', 'voice call', 'call doctor', 'google meet', 'consultation call'],
    a: "Doctors can initiate video or voice calls by generating a Google Meet link from the chat. Patients receive the link and can join instantly — no extra software needed."
  },

  // ── Offline Mode ───────────────────────────────────────────────────────────
  {
    q: ['offline', 'no internet', 'low bandwidth', 'no connection', 'without internet', 'offline mode', 'offline first'],
    a: "Helixa is built offline-first. Messages and symptom checks are queued locally and auto-synced when you reconnect. Core features work fully without internet."
  },
  {
    q: ['offline queue', 'queue', 'local queue', 'queued messages'],
    a: "Helixa's offline queue stores messages and symptom checks locally when there's no internet. Urgent items sync first when connection is restored."
  },
  {
    q: ['sync', 'auto sync', 'reconnect', 'connection restored'],
    a: "When your connection is restored, Helixa automatically syncs all queued items with a notification: 'Connection restored… All messages delivered ✅'."
  },
  {
    q: ['message status', 'sent status', 'seen', 'delivered', 'queued status'],
    a: "Helixa shows real-time message status: ☁️ Queued → ⏳ Sending → ✅ Sent → 👀 Seen — so you always know the state of your messages."
  },

  // ── Tasks ──────────────────────────────────────────────────────────────────
  {
    q: ['task', 'tasks', 'task management', 'to do', 'todo', 'doctor tasks'],
    a: "Doctors have a priority-based task panel (High / Medium / Low) accessible from the topbar. Add, complete, or delete tasks — a badge shows pending count in the navbar."
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  {
    q: ['notification', 'notifications', 'alerts', 'bell', 'unread'],
    a: "Helixa has real-time notifications. You can mark them as read, delete individual ones, or clear all. A badge count appears in the topbar."
  },

  // ── Multilingual ───────────────────────────────────────────────────────────
  {
    q: ['languages', 'multilingual', 'language support', 'i18n', 'change language', 'switch language'],
    a: "Helixa supports English, हिन्दी, ಕನ್ನಡ, தமிழ், and తెలుగు. Change the language from the topbar or Settings — the UI updates instantly and your preference is saved."
  },

  // ── Translate Widget ───────────────────────────────────────────────────────
  {
    q: ['translate', 'translation', 'translate widget', 'translator', 'medical translation'],
    a: "The Translate Widget lets you translate text between English, Tamil, Hindi, Telugu, Kannada, and Malayalam. It auto-detects your input language and includes a copy-to-clipboard button."
  },

  // ── Appointments ───────────────────────────────────────────────────────────
  {
    q: ['appointment', 'book appointment', 'booking', 'availability', 'slot', 'schedule'],
    a: "Doctors publish availability slots (video or voice call). Patients browse and book directly. Appointments are stored and managed in real time."
  },

  // ── Profile ────────────────────────────────────────────────────────────────
  {
    q: ['profile', 'edit profile', 'user profile', 'my profile', 'account details', 'medication', 'drug', 'vitals', 'allergies'],
    a: "Your profile includes name, age, gender, vitals, medications (with autocomplete), and allergies — giving doctors full context before a consultation."
  },

  // ── Settings ───────────────────────────────────────────────────────────────
  {
    q: ['settings', 'dark mode', 'low data mode', 'theme', 'preferences', 'configuration'],
    a: "Settings includes dark mode, Low Data Mode (disables animations for slow connections), language preferences, and connectivity controls like queue status and sync."
  },

  // ── Privacy & Security ─────────────────────────────────────────────────────
  {
    q: ['privacy', 'data', 'secure', 'safe', 'security', 'hipaa', 'delete account'],
    a: "Your health data is encrypted at rest and in transit. We never sell your data. You can delete your account and all associated data at any time from Settings."
  },

  // ── Pricing ────────────────────────────────────────────────────────────────
  {
    q: ['is it free', 'cost', 'pricing', 'how much', 'free', 'paid', 'subscription'],
    a: "Helixa is currently free to use during our early access period. Sign up now to get full access to all features at no cost."
  },

  // ── Impact ────────────────────────────────────────────────────────────────
  {
    q: ['impact', 'real world', 'who is it for', 'target users', 'use case', 'underserved', 'rural', 'unique', 'special', 'usp', 'innovation'],
    a: "Helixa is designed for regions with limited healthcare access, poor internet, and language barriers — ensuring no data is lost offline and everyone can communicate with their doctor."
  },

  // ── Features summary ───────────────────────────────────────────────────────
  {
    q: ['features', 'what can i do', 'capabilities', 'what does it offer', 'all features', 'list features'],
    a: "Helixa offers: AI Symptom Checker, patient & doctor dashboards, real-time messaging with voice notes, video/voice appointments, offline-first mode, multilingual UI, translate widget, task management, notifications, and profile management."
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ── TAMIL (தமிழ்) ──────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    q: ['ஹெலிக்சா என்ன', 'helixa என்ன', 'இது என்ன', 'பற்றி சொல்'],
    a: "Helixa என்பது AI-ஆல் இயங்கும் ஒரு மருத்துவ தளம். நோயாளிகள் அறிகுறிகளை சரிபார்க்கலாம், மருத்துவர்களுடன் தொடர்பு கொள்ளலாம், மேலும் இணைய இணைப்பு இல்லாமலும் பயன்படுத்தலாம்."
  },
  {
    q: ['பதிவு', 'உள்நுழைவு', 'கணக்கு உருவாக்கு', 'சைன் அப்'],
    a: "நோயாளி அல்லது மருத்துவர் என இரு வகையில் பதிவு செய்யலாம். உங்கள் அமர்வு தானாகவே நினைவில் வைக்கப்படும்."
  },
  {
    q: ['அறிகுறி', 'சோதனை', 'symptom தமிழ்'],
    a: "AI அறிகுறி சோதனை உங்கள் உடல் நிலையை பகுப்பாய்வு செய்து ஆரம்ப மதிப்பீடு வழங்கும். தீவிர பிரச்சினைகளுக்கு மருத்துவரை அணுகவும்."
  },
  {
    q: ['சேதி', 'செய்தி', 'மருத்துவர் தொடர்பு', 'chat தமிழ்'],
    a: "Helixa-வில் நேரடி chat, குரல் செய்திகள், மற்றும் video/voice அழைப்புகள் மூலம் மருத்துவரை தொடர்பு கொள்ளலாம்."
  },
  {
    q: ['இணைய இணைப்பு இல்லை', 'offline தமிழ்', 'நெட் இல்லை'],
    a: "Helixa இணைய இணைப்பு இல்லாமலும் வேலை செய்யும். செய்திகள் மற்றும் அறிகுறி தரவு உள்ளூரில் சேமிக்கப்பட்டு, இணைப்பு கிடைக்கும்போது தானாகவே ஒத்திசைக்கப்படும்."
  },
  {
    q: ['சந்திப்பு', 'appointment தமிழ்', 'முன்பதிவு'],
    a: "மருத்துவர்கள் கிடைக்கும் நேரங்களை (video/voice) வெளியிடுவார்கள். நோயாளிகள் நேரடியாக முன்பதிவு செய்யலாம்."
  },
  {
    q: ['இலவசம்', 'கட்டணம்', 'free தமிழ்'],
    a: "Helixa தற்போது முழுவதும் இலவசமாக கிடைக்கிறது. இப்போதே பதிவு செய்யுங்கள்!"
  },
  {
    q: ['மொழி', 'தமிழ் ஆதரவு', 'மொழி மாற்றம்'],
    a: "Helixa தமிழ், English, हिन्दी, ಕನ್ನಡ, మరియు తెలుగు ஆகிய மொழிகளை ஆதரிக்கிறது. மேல் பட்டியில் மொழியை மாற்றலாம்."
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ── HINDI (हिन्दी) ─────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    q: ['helixa क्या है', 'हेलिक्सा क्या है', 'यह क्या है', 'बताओ'],
    a: "Helixa एक AI-संचालित स्वास्थ्य सेवा मंच है। मरीज़ लक्षणों की जाँच कर सकते हैं, डॉक्टरों से जुड़ सकते हैं, और बिना इंटरनेट के भी इसका उपयोग कर सकते हैं।"
  },
  {
    q: ['साइन अप', 'लॉगिन', 'खाता बनाएं', 'पंजीकरण'],
    a: "आप मरीज़ या डॉक्टर के रूप में साइन अप कर सकते हैं। आपका सत्र स्वचालित रूप से याद रखा जाता है।"
  },
  {
    q: ['लक्षण', 'जाँच', 'symptom हिंदी'],
    a: "AI लक्षण जाँच आपके लक्षणों का विश्लेषण करके प्रारंभिक मूल्यांकन देती है। गंभीर समस्याओं के लिए हमेशा डॉक्टर से मिलें।"
  },
  {
    q: ['संदेश', 'चैट', 'डॉक्टर से बात', 'मैसेज'],
    a: "Helixa में रियल-टाइम चैट, वॉइस मैसेज, और वीडियो/वॉइस कॉल के ज़रिए डॉक्टर से जुड़ें — सब एक ही जगह।"
  },
  {
    q: ['इंटरनेट नहीं', 'ऑफलाइन हिंदी', 'बिना नेट'],
    a: "Helixa बिना इंटरनेट के भी काम करता है। संदेश और डेटा स्थानीय रूप से संग्रहीत होते हैं और कनेक्शन आने पर स्वचालित रूप से सिंक होते हैं।"
  },
  {
    q: ['अपॉइंटमेंट', 'मुलाकात', 'बुकिंग हिंदी'],
    a: "डॉक्टर उपलब्धता स्लॉट (वीडियो/वॉइस) प्रकाशित करते हैं। मरीज़ सीधे बुकिंग कर सकते हैं।"
  },
  {
    q: ['मुफ्त', 'कीमत', 'शुल्क', 'free हिंदी'],
    a: "Helixa अभी पूरी तरह मुफ्त है। अभी साइन अप करें और सभी सुविधाओं का उपयोग करें!"
  },
  {
    q: ['भाषा', 'हिंदी सहायता', 'भाषा बदलें'],
    a: "Helixa हिन्दी, English, தமிழ், ಕನ್ನಡ, और తెలుగు का समर्थन करता है। टॉपबार से भाषा बदलें।"
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ── TELUGU (తెలుగు) ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    q: ['helixa ఏమిటి', 'హెలిక్సా ఏమిటి', 'ఇది ఏమిటి', 'గురించి చెప్పు'],
    a: "Helixa ఒక AI-ఆధారిత ఆరోగ్య సేవా వేదిక. రోగులు లక్షణాలను తనిఖీ చేయవచ్చు, వైద్యులతో కమ్యూనికేట్ చేయవచ్చు, మరియు ఇంటర్నెట్ లేకుండా కూడా ఉపయోగించవచ్చు."
  },
  {
    q: ['సైన్ అప్', 'లాగిన్', 'ఖాతా సృష్టించు', 'నమోదు తెలుగు'],
    a: "మీరు రోగి లేదా వైద్యుడిగా సైన్ అప్ చేయవచ్చు. మీ సెషన్ స్వయంచాలకంగా గుర్తుంచుకోబడుతుంది."
  },
  {
    q: ['లక్షణాలు', 'తనిఖీ తెలుగు', 'symptom తెలుగు'],
    a: "AI లక్షణ తనిఖీ మీ లక్షణాలను విశ్లేషించి ప్రారంభిక అంచనా ఇస్తుంది. తీవ్రమైన సమస్యలకు వైద్యుడిని సంప్రదించండి."
  },
  {
    q: ['సందేశం', 'చాట్ తెలుగు', 'వైద్యుడు సంప్రదించు'],
    a: "Helixa లో రియల్-టైమ్ చాట్, వాయిస్ మెసేజ్‌లు, మరియు వీడియో/వాయిస్ కాల్‌ల ద్వారా వైద్యుడిని సంప్రదించవచ్చు."
  },
  {
    q: ['ఇంటర్నెట్ లేదు', 'ఆఫ్‌లైన్ తెలుగు', 'నెట్ లేదు'],
    a: "Helixa ఇంటర్నెట్ లేకుండా కూడా పని చేస్తుంది. సందేశాలు స్థానికంగా నిల్వ చేయబడతాయి మరియు కనెక్షన్ వచ్చినప్పుడు స్వయంచాలకంగా సమకాలీకరించబడతాయి."
  },
  {
    q: ['అపాయింట్‌మెంట్ తెలుగు', 'బుకింగ్ తెలుగు', 'సమయం నిర్ణయించు'],
    a: "వైద్యులు అందుబాటు స్లాట్‌లను (వీడియో/వాయిస్) ప్రచురిస్తారు. రోగులు నేరుగా బుక్ చేయవచ్చు."
  },
  {
    q: ['ఉచితం తెలుగు', 'రుసుము తెలుగు', 'free తెలుగు'],
    a: "Helixa ప్రస్తుతం పూర్తిగా ఉచితంగా అందుబాటులో ఉంది. ఇప్పుడే సైన్ అప్ చేయండి!"
  },
  {
    q: ['భాష తెలుగు', 'తెలుగు మద్దతు', 'భాష మార్చు తెలుగు'],
    a: "Helixa తెలుగు, English, हिन्दी, ಕನ್ನಡ, మరియు தமிழ் భాషలకు మద్దతు ఇస్తుంది. టాప్‌బార్ నుండి భాషను మార్చవచ్చు."
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ── KANNADA (ಕನ್ನಡ) ────────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    q: ['helixa ಏನು', 'ಹೆಲಿಕ್ಸಾ ಏನು', 'ಇದು ಏನು', 'ಬಗ್ಗೆ ಹೇಳಿ'],
    a: "Helixa ಒಂದು AI-ಚಾಲಿತ ಆರೋಗ್ಯ ವೇದಿಕೆ. ರೋಗಿಗಳು ರೋಗಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸಬಹುದು, ವೈದ್ಯರೊಂದಿಗೆ ಸಂಪರ್ಕಿಸಬಹುದು, ಮತ್ತು ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ ಬಳಸಬಹುದು."
  },
  {
    q: ['ಸೈನ್ ಅಪ್', 'ಲಾಗಿನ್', 'ಖಾತೆ ರಚಿಸಿ', 'ನೋಂದಣಿ ಕನ್ನಡ'],
    a: "ನೀವು ರೋಗಿ ಅಥವಾ ವೈದ್ಯರಾಗಿ ಸೈನ್ ಅಪ್ ಮಾಡಬಹುದು. ನಿಮ್ಮ ಅಧಿವೇಶನ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಉಳಿಸಲ್ಪಡುತ್ತದೆ."
  },
  {
    q: ['ರೋಗಲಕ್ಷಣ', 'ಪರಿಶೀಲನೆ ಕನ್ನಡ', 'symptom ಕನ್ನಡ'],
    a: "AI ರೋಗಲಕ್ಷಣ ಪರಿಶೀಲಕ ನಿಮ್ಮ ಲಕ್ಷಣಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಆರಂಭಿಕ ಮೌಲ್ಯಮಾಪನ ನೀಡುತ್ತದೆ. ಗಂಭೀರ ಸಮಸ್ಯೆಗಳಿಗೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  {
    q: ['ಸಂದೇಶ', 'ಚಾಟ್ ಕನ್ನಡ', 'ವೈದ್ಯರ ಸಂಪರ್ಕ'],
    a: "Helixa ನಲ್ಲಿ ರಿಯಲ್-ಟೈಮ್ ಚಾಟ್, ವಾಯ್ಸ್ ಮೆಸೇಜ್‌ಗಳು ಮತ್ತು ವೀಡಿಯೊ/ವಾಯ್ಸ್ ಕರೆಗಳ ಮೂಲಕ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ."
  },
  {
    q: ['ಇಂಟರ್ನೆಟ್ ಇಲ್ಲ', 'ಆಫ್‌ಲೈನ್ ಕನ್ನಡ', 'ನೆಟ್ ಇಲ್ಲ'],
    a: "Helixa ಇಂಟರ್ನೆಟ್ ಇಲ್ಲದೆಯೂ ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತದೆ. ಸಂದೇಶಗಳು ಸ್ಥಳೀಯವಾಗಿ ಸಂಗ್ರಹಿಸಲ್ಪಡುತ್ತವೆ ಮತ್ತು ಸಂಪರ್ಕ ಬಂದಾಗ ಸ್ವಯಂಚಾಲಿತವಾಗಿ ಸಿಂಕ್ ಆಗುತ್ತವೆ."
  },
  {
    q: ['ಅಪಾಯಿಂಟ್‌ಮೆಂಟ್ ಕನ್ನಡ', 'ಬುಕಿಂಗ್ ಕನ್ನಡ', 'ಸಮಯ ನಿಗದಿ'],
    a: "ವೈದ್ಯರು ಲಭ್ಯತಾ ಸ್ಲಾಟ್‌ಗಳನ್ನು (ವೀಡಿಯೊ/ವಾಯ್ಸ್) ಪ್ರಕಟಿಸುತ್ತಾರೆ. ರೋಗಿಗಳು ನೇರವಾಗಿ ಬುಕ್ ಮಾಡಬಹುದು."
  },
  {
    q: ['ಉಚಿತ ಕನ್ನಡ', 'ಶುಲ್ಕ ಕನ್ನಡ', 'free ಕನ್ನಡ'],
    a: "Helixa ಪ್ರಸ್ತುತ ಸಂಪೂರ್ಣ ಉಚಿತವಾಗಿ ಲಭ್ಯವಿದೆ. ಈಗಲೇ ಸೈನ್ ಅಪ್ ಮಾಡಿ!"
  },
  {
    q: ['ಭಾಷೆ ಕನ್ನಡ', 'ಕನ್ನಡ ಬೆಂಬಲ', 'ಭಾಷೆ ಬದಲಾಯಿಸಿ'],
    a: "Helixa ಕನ್ನಡ, English, हिन्दी, தமிழ், మరియు తెలుగు ಭಾಷೆಗಳನ್ನು ಬೆಂಬಲಿಸುತ್ತದೆ. ಟಾಪ್‌ಬಾರ್‌ನಿಂದ ಭಾಷೆ ಬದಲಾಯಿಸಿ."
  },

  // ════════════════════════════════════════════════════════════════════════════
  // ── MALAYALAM (മലയാളം) ─────────────────────────────────────────────────────
  // ════════════════════════════════════════════════════════════════════════════
  {
    q: ['helixa എന്താണ്', 'ഹെലിക്സ എന്ത്', 'ഇത് എന്താണ്', 'പറഞ്ഞുതരൂ'],
    a: "Helixa ഒരു AI-ചാലിത ആരോഗ്യ സേവന പ്ലാറ്റ്‌ഫോമാണ്. രോഗികൾക്ക് ലക്ഷണങ്ങൾ പരിശോധിക്കാനും ഡോക്ടർമാരുമായി ബന്ധപ്പെടാനും ഇന്റർനെറ്റ് ഇല്ലാതെ പോലും ഉപയോഗിക്കാനും കഴിയും."
  },
  {
    q: ['സൈൻ അപ്', 'ലോഗിൻ', 'അക്കൗണ്ട് ഉണ്ടാക്കുക', 'രജിസ്ട്രേഷൻ മലയാളം'],
    a: "നിങ്ങൾക്ക് രോഗി അല്ലെങ്കിൽ ഡോക്ടർ ആയി സൈൻ അപ്പ് ചെയ്യാം. നിങ്ങളുടെ സെഷൻ സ്വയം ഓർത്തുവയ്ക്കപ്പെടുന്നു."
  },
  {
    q: ['ലക്ഷണങ്ങൾ', 'പരിശോധന മലയാളം', 'symptom മലയാളം'],
    a: "AI ലക്ഷണ പരിശോധക നിങ്ങളുടെ ലക്ഷണങ്ങൾ വിശകലനം ചെയ്ത് ഒരു പ്രാഥമിക വിലയിരുത്തൽ നൽകുന്നു. ഗുരുതരമായ പ്രശ്നങ്ങൾക്ക് ഡോക്ടറെ സമീപിക്കുക."
  },
  {
    q: ['സന്ദേശം', 'ചാറ്റ് മലയാളം', 'ഡോക്ടർ ബന്ധപ്പെടുക'],
    a: "Helixa-ൽ റിയൽ-ടൈം ചാറ്റ്, വോയ്‌സ് മെസേജുകൾ, വീഡിയോ/വോയ്‌സ് കോളുകൾ വഴി ഡോക്ടറെ ബന്ധപ്പെടാം."
  },
  {
    q: ['ഇന്റർനെറ്റ് ഇല്ല', 'ഓഫ്‌ലൈൻ മലയാളം', 'നെറ്റ് ഇല്ല'],
    a: "Helixa ഇന്റർനെറ്റ് ഇല്ലാതെയും പ്രവർത്തിക്കുന്നു. സന്ദേശങ്ങൾ പ്രാദേശികമായി സംഭരിക്കപ്പെടുകയും കണക്ഷൻ ലഭിക്കുമ്പോൾ സ്വയം സമന്വയിപ്പിക്കുകയും ചെയ്യുന്നു."
  },
  {
    q: ['അപ്പോയിന്റ്മെന്റ് മലയാളം', 'ബുക്കിംഗ് മലയാളം', 'സമയം ഫിക്സ് ചെയ്യുക'],
    a: "ഡോക്ടർമാർ ലഭ്യതാ സ്ലോട്ടുകൾ (വീഡിയോ/വോയ്‌സ്) പ്രസിദ്ധീകരിക്കുന്നു. രോഗികൾക്ക് നേരിട്ട് ബുക്ക് ചെയ്യാം."
  },
  {
    q: ['സൗജന്യം', 'നിരക്ക് മലയാളം', 'free മലയാളം'],
    a: "Helixa ഇപ്പോൾ പൂർണ്ണമായും സൗജന്യമാണ്. ഇപ്പോൾ തന്നെ സൈൻ അപ്പ് ചെയ്യൂ!"
  },
  {
    q: ['ഭാഷ മലയാളം', 'മലയാളം പിന്തുണ', 'ഭാഷ മാറ്റുക'],
    a: "Helixa മലയാളം, English, हिन्दी, தமிழ், ಕನ್ನಡ, తెలుగు ഭാഷകൾ പിന്തുണയ്ക്കുന്നു. ടോപ്പ്ബാറിൽ നിന്ന് ഭാഷ മാറ്റാം."
  },
];

// ── Offline fallbacks for unknown questions ───────────────────────────────────
const OFFLINE_FALLBACKS = [
  "I can answer questions about Helixa's features, offline mode, appointments, messaging, and more — even without internet! Try asking in Tamil, Hindi, Telugu, Kannada, or Malayalam too.",
  "You're offline, but I know a lot! Ask about the symptom checker, doctor dashboard, offline queue, tasks, notifications, multilingual support, or any feature.",
  "No internet right now, but I'm still here. Ask me about any Helixa feature — in English or any of the 5 supported languages!",
];
let fallbackIndex = 0;
const getOfflineFallback = () => {
  const msg = OFFLINE_FALLBACKS[fallbackIndex % OFFLINE_FALLBACKS.length];
  fallbackIndex++;
  return msg;
};

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_API_KEY = typeof window !== 'undefined' ? import.meta.env?.VITE_GROQ_API_KEY : '';

const SYSTEM_PROMPT = `You are Helixa, a friendly AI assistant for the Helixa healthcare platform.
Helixa is an AI-powered healthcare web app with:
- AI Symptom Checker (Groq / LLaMA 3.1)
- Patient & Doctor dashboards
- Real-time messaging with voice notes
- Appointment booking (video/voice call via Google Meet)
- Offline-first mode with local queue and auto-sync
- Multilingual support (English, Hindi, Kannada, Tamil, Telugu, Malayalam)
- Translate Widget
- Task management for doctors
- Firestore-based notifications
- Profile management with drug autocomplete
- Settings: dark mode, low data mode, language

Answer questions about Helixa concisely and helpfully. Keep responses under 3 sentences.
If asked about medical advice, always say to consult a real doctor.
Be warm, friendly, and conversational. Respond in the same language the user writes in.`;

// ── KB lookup ─────────────────────────────────────────────────────────────────
const searchKB = (input) => {
  const lower = input.toLowerCase();
  for (const entry of KB) {
    if (entry.q.some(kw => lower.includes(kw))) return entry.a;
  }
  return null;
};

// ── Groq fallback (only called when online) ───────────────────────────────────
const askGroq = async (messages) => {
  if (!GROQ_API_KEY) return "I'm having trouble connecting right now. Try asking again or explore the site!";
  try {
    const res = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${GROQ_API_KEY}` },
      body: JSON.stringify({
        model: 'llama-3.1-8b-instant',
        max_tokens: 150,
        temperature: 0.7,
        messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...messages],
      }),
    });
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() || "I'm not sure about that — try exploring the platform!";
  } catch {
    return "I'm having trouble connecting right now. Explore the site or sign up to get started!";
  }
};

// ── Helixa Logo (inline) ──────────────────────────────────────────────────────
const HelixaLogoIcon = ({ size = 28 }) => (
  <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
    <svg viewBox="0 0 24 24" fill="none" stroke="#7BBA91" strokeWidth="2.5"
      strokeLinecap="round" strokeLinejoin="round" style={{ width: size, height: size }}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </svg>
    <div className="absolute inset-0 flex items-center justify-center">
      <Zap size={size * 0.45} className="text-helixa-teal fill-helixa-teal" strokeWidth={1} style={{ transform: 'translateY(-1px)' }} />
    </div>
  </div>
);

const SUGGESTIONS = [
  "What is Helixa?",
  "How does offline mode work?",
  "How does the symptom checker work?",
  "Can I message my doctor?",
];

// ── Main Bot Component ────────────────────────────────────────────────────────
export const HelixaBot = ({ shiftLeft = false }) => {
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', text: "Hi! I'm the Helixa assistant 👋 Ask me anything — in English, தமிழ், हिन्दी, తెలుగు, ಕನ್ನಡ, or മലയാളം!" }
  ]);
  const [input,    setInput]    = useState('');
  const [typing,   setTyping]   = useState(false);
  const [history,  setHistory]  = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const bottomRef = useRef(null);

  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const send = async (text) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput('');

    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setTyping(true);

    // 1. Always try KB first — works fully offline
    const kbAnswer = searchKB(msg);
    if (kbAnswer) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: kbAnswer }]);
        setTyping(false);
      }, 500);
      return;
    }

    // 2. If offline, return friendly offline fallback
    if (!isOnline) {
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', text: getOfflineFallback() }]);
        setTyping(false);
      }, 400);
      return;
    }

    // 3. Online — ask Groq
    const newHistory = [...history, { role: 'user', content: msg }];
    const answer = await askGroq(newHistory);
    setHistory([...newHistory, { role: 'assistant', content: answer }]);
    setMessages(prev => [...prev, { role: 'assistant', text: answer }]);
    setTyping(false);
  };

  return (
    <>
      {/* Floating button */}
      <motion.button
        onClick={() => setOpen(v => !v)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        animate={{ right: shiftLeft ? 408 : 24 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="fixed bottom-6 z-50 w-14 h-14 bg-white border-2 border-helixa-green/30 rounded-2xl shadow-xl flex items-center justify-center hover:shadow-2xl transition-shadow"
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} className="text-helixa-teal" />
            </motion.div>
          ) : (
            <motion.div key="logo" initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.8, opacity: 0 }}>
              <HelixaLogoIcon size={30} />
            </motion.div>
          )}
        </AnimatePresence>
        {!open && (
          <motion.div className="absolute inset-0 rounded-2xl border-2 border-helixa-green/30"
            animate={{ scale: [1, 1.3, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ duration: 2.5, repeat: Infinity }} />
        )}
        {!isOnline && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-amber-400 rounded-full border-2 border-white" />
        )}
      </motion.button>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1,    y: 0  }}
            exit={{   opacity: 0, scale: 0.92, y: 20  }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="fixed bottom-24 z-50 w-80 bg-white rounded-3xl shadow-2xl border border-helixa-teal/10 flex flex-col overflow-hidden"
            style={{ right: shiftLeft ? 416 : 24, maxHeight: '480px' }}
          >
            {/* Header */}
            <div className="bg-helixa-teal px-5 py-4 flex items-center gap-3">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0">
                <HelixaLogoIcon size={22} />
              </div>
              <div className="flex-grow">
                <p className="text-sm font-black text-white">Helixa Assistant</p>
                <p className="text-[10px] text-white/60 font-bold flex items-center gap-1">
                  {isOnline
                    ? <><span className="w-1.5 h-1.5 bg-green-400 rounded-full" /> Always here</>
                    : <><WifiOff size={9} className="text-amber-300" />Offline</>
                  }
                </p>
              </div>
            </div>

            {/* Offline banner */}
            <AnimatePresence>
              {!isOnline && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 overflow-hidden"
                >
                  <WifiOff size={12} className="text-amber-500 flex-shrink-0" />
                  <p className="text-[11px] font-bold text-amber-700">
                    You're offline. I can still answer most questions!
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3 bg-[#f9f7f4]">
              {messages.map((msg, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  {msg.role === 'assistant' && (
                    <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-helixa-green/20 mt-0.5">
                      <HelixaLogoIcon size={16} />
                    </div>
                  )}
                  <div className={`px-3.5 py-2.5 rounded-2xl text-sm font-medium leading-relaxed max-w-[80%] ${
                    msg.role === 'user'
                      ? 'bg-helixa-teal text-white rounded-br-sm'
                      : 'bg-white text-gray-800 border border-helixa-teal/10 rounded-bl-sm shadow-sm'
                  }`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              {typing && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 bg-white rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-helixa-green/20">
                    <HelixaLogoIcon size={16} />
                  </div>
                  <div className="px-3.5 py-3 bg-white rounded-2xl rounded-bl-sm border border-helixa-teal/10 shadow-sm flex items-center gap-1">
                    {[0, 1, 2].map(i => (
                      <motion.div key={i} className="w-1.5 h-1.5 bg-helixa-teal/40 rounded-full"
                        animate={{ y: [0, -4, 0] }} transition={{ duration: 0.6, delay: i * 0.15, repeat: Infinity }} />
                    ))}
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Suggestions */}
            {messages.length === 1 && (
              <div className="px-4 pb-2 bg-[#f9f7f4] flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => send(s)}
                    className="text-[11px] font-bold px-3 py-1.5 bg-white border border-helixa-teal/20 text-helixa-teal rounded-full hover:bg-helixa-teal hover:text-white transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="px-3 pb-3 pt-2 bg-white border-t border-helixa-teal/10 flex gap-2">
              <input
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && send()}
                placeholder={isOnline ? "Ask in any language..." : "Ask about any feature..."}
                className="flex-grow bg-[#f9f7f4] border border-helixa-teal/10 rounded-xl px-3 py-2 text-sm text-gray-800 focus:outline-none focus:border-helixa-green placeholder:text-gray-400"
              />
              <button onClick={() => send()}
                className="w-9 h-9 bg-helixa-green rounded-xl flex items-center justify-center hover:bg-helixa-green/80 transition-colors flex-shrink-0">
                <Send size={15} className="text-white" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};