/**
 * Translated symptom, allergy, and condition lists for all languages
 * Returns English keys for backend compatibility, but can be used for display mapping
 */

// English keys (for backend)
const SYMPTOMS_EN = [
  'fever', 'headache', 'body pain', 'cough', 'cold', 'sore throat', 'fatigue',
  'nausea', 'vomiting', 'diarrhea', 'constipation', 'stomach pain', 'rash',
  'itching', 'dizziness', 'back pain', 'joint pain', 'muscle pain', 'weakness',
  'chills', 'sweating', 'loss of appetite', 'insomnia', 'anxiety', 'dry cough',
  'runny nose', 'eye irritation', 'chest pain', 'shortness of breath'
];

const ALLERGIES_EN = [
  'penicillin', 'amoxicillin', 'aspirin', 'ibuprofen', 'paracetamol', 'dairy',
  'peanuts', 'shellfish', 'eggs', 'gluten', 'soy', 'nuts', 'fish', 'sesame'
];

const CONDITIONS_EN = [
  'diabetes', 'hypertension', 'asthma', 'heart disease', 'kidney disease',
  'liver disease', 'thyroid', 'arthritis', 'migraine', 'anxiety', 'depression',
  'epilepsy', 'cancer', 'tuberculosis', 'covid-19', 'hiv', 'hepatitis'
];

// Translation mappings: English key -> Translated text
const SYMPTOM_TRANSLATIONS = {
  english: {},
  telugu: {
    'fever': 'జ్వరం', 'headache': 'తలనొప్పి', 'body pain': 'శరీర నొప్పి', 'cough': 'దగ్గు', 'cold': 'జలుబు',
    'sore throat': 'గొంతు నొప్పి', 'fatigue': 'అలసట', 'nausea': 'వికారం', 'vomiting': 'వాంతి',
    'diarrhea': 'అతిసారం', 'constipation': 'మలబద్ధకం', 'stomach pain': 'కడుపు నొప్పి', 'rash': 'చర్మం మచ్చ',
    'itching': 'దురద', 'dizziness': 'తలతిరుగుడు', 'back pain': 'వెన్నెముక నొప్పి', 'joint pain': 'కీళ్ళ నొప్పి',
    'muscle pain': 'కండరాల నొప్పి', 'weakness': 'బలహీనత', 'chills': 'చలి', 'sweating': 'చెమట',
    'loss of appetite': 'ఆకలి లేకపోవడం', 'insomnia': 'నిద్ర లేకపోవడం', 'anxiety': 'ఆందోళన', 'dry cough': 'ఎండు దగ్గు',
    'runny nose': 'నాసికా కారడం', 'eye irritation': 'కన్ను చికాకు', 'chest pain': 'ఛాతీ నొప్పి',
    'shortness of breath': 'ఊపిరి తీసుకోవడంలో ఇబ్బంది'
  },
  hindi: {
    'fever': 'बुखार', 'headache': 'सिरदर्द', 'body pain': 'शरीर दर्द', 'cough': 'खांसी', 'cold': 'सर्दी',
    'sore throat': 'गले में खराश', 'fatigue': 'थकान', 'nausea': 'मतली', 'vomiting': 'उल्टी',
    'diarrhea': 'दस्त', 'constipation': 'कब्ज', 'stomach pain': 'पेट दर्द', 'rash': 'चकत्ते',
    'itching': 'खुजली', 'dizziness': 'चक्कर', 'back pain': 'पीठ दर्द', 'joint pain': 'जोड़ों का दर्द',
    'muscle pain': 'मांसपेशियों में दर्द', 'weakness': 'कमजोरी', 'chills': 'ठंड लगना', 'sweating': 'पसीना',
    'loss of appetite': 'भूख न लगना', 'insomnia': 'अनिद्रा', 'anxiety': 'चिंता', 'dry cough': 'सूखी खांसी',
    'runny nose': 'नाक बहना', 'eye irritation': 'आंख में जलन', 'chest pain': 'सीने में दर्द',
    'shortness of breath': 'सांस लेने में तकलीफ'
  },
  marathi: {
    'fever': 'ताप', 'headache': 'डोकेदुखी', 'body pain': 'शरीरात वेदना', 'cough': 'खोकला', 'cold': 'सर्दी',
    'sore throat': 'घश्यात खवखव', 'fatigue': 'थकवा', 'nausea': 'मळमळ', 'vomiting': 'उलटी',
    'diarrhea': 'अतिसार', 'constipation': 'मलबद्धता', 'stomach pain': 'पोटात वेदना', 'rash': 'पुरळ',
    'itching': 'खाज', 'dizziness': 'चक्कर', 'back pain': 'पाठीचा दुखणे', 'joint pain': 'सांधेदुखी',
    'muscle pain': 'स्नायूंमध्ये वेदना', 'weakness': 'कमकुवतपणा', 'chills': 'थंडी वाटणे', 'sweating': 'घाम',
    'loss of appetite': 'क्षुधा न लागणे', 'insomnia': 'अनिद्रा', 'anxiety': 'चिंता', 'dry cough': 'कोरडा खोकला',
    'runny nose': 'नाक वाहणे', 'eye irritation': 'डोळ्यात जळजळ', 'chest pain': 'छातीत वेदना',
    'shortness of breath': 'श्वास घेण्यात अडचण'
  },
  bengali: {
    'fever': 'জ্বর', 'headache': 'মাথাব্যথা', 'body pain': 'শরীরে ব্যথা', 'cough': 'কাশি', 'cold': 'সর্দি',
    'sore throat': 'গলাব্যথা', 'fatigue': 'ক্লান্তি', 'nausea': 'বমি বমি ভাব', 'vomiting': 'বমি',
    'diarrhea': 'ডায়রিয়া', 'constipation': 'কোষ্ঠকাঠিন্য', 'stomach pain': 'পেটে ব্যথা', 'rash': 'ফুসকুড়ি',
    'itching': 'চুলকানি', 'dizziness': 'মাথা ঘোরা', 'back pain': 'পিঠে ব্যথা', 'joint pain': 'জয়েন্টে ব্যথা',
    'muscle pain': 'পেশীতে ব্যথা', 'weakness': 'দুর্বলতা', 'chills': 'ঠান্ডা লাগা', 'sweating': 'ঘাম',
    'loss of appetite': 'ক্ষুধা না থাকা', 'insomnia': 'অনিদ্রা', 'anxiety': 'উদ্বেগ', 'dry cough': 'শুকনো কাশি',
    'runny nose': 'নাক দিয়ে পানি পড়া', 'eye irritation': 'চোখে জ্বালা', 'chest pain': 'বুকের ব্যথা',
    'shortness of breath': 'শ্বাসকষ্ট'
  },
  tamil: {
    'fever': 'காய்ச்சல்', 'headache': 'தலைவலி', 'body pain': 'உடல் வலி', 'cough': 'இருமல்', 'cold': 'சளி',
    'sore throat': 'தொண்டை வலி', 'fatigue': 'சோர்வு', 'nausea': 'வாந்தி எண்ணம்', 'vomiting': 'வாந்தி',
    'diarrhea': 'வயிற்றுப்போக்கு', 'constipation': 'மலச்சிக்கல்', 'stomach pain': 'வயிற்று வலி', 'rash': 'சொறி',
    'itching': 'அரிப்பு', 'dizziness': 'தலைச்சுற்றல்', 'back pain': 'முதுகு வலி', 'joint pain': 'மூட்டு வலி',
    'muscle pain': 'தசை வலி', 'weakness': 'பலவீனம்', 'chills': 'குளிர்', 'sweating': 'வியர்வை',
    'loss of appetite': 'பசியின்மை', 'insomnia': 'தூக்கமின்மை', 'anxiety': 'கவலை', 'dry cough': 'உலர் இருமல்',
    'runny nose': 'மூக்கு ஒழுக்கு', 'eye irritation': 'கண் எரிச்சல்', 'chest pain': 'மார்பு வலி',
    'shortness of breath': 'மூச்சுத் திணறல்'
  },
  kannada: {
    'fever': 'ಜ್ವರ', 'headache': 'ತಲೆನೋವು', 'body pain': 'ದೇಹ ನೋವು', 'cough': 'ಕೆಮ್ಮು', 'cold': 'ಸೀತಲು',
    'sore throat': 'ಗಂಟಲು ನೋವು', 'fatigue': 'ಅಲಸಿಕೆ', 'nausea': 'ವಾಕರಿಕೆ', 'vomiting': 'ವಾಂತಿ',
    'diarrhea': 'ಅತಿಸಾರ', 'constipation': 'ಮಲಬದ್ಧತೆ', 'stomach pain': 'ಹೊಟ್ಟೆ ನೋವು', 'rash': 'ಚರ್ಮದ ಮಚ್ಚೆ',
    'itching': 'ಅರಿವೆ', 'dizziness': 'ತಲೆತಿರುಗುವಿಕೆ', 'back pain': 'ಬೆನ್ನಿನ ನೋವು', 'joint pain': 'ಮೂಳೆ ನೋವು',
    'muscle pain': 'ಸ್ನಾಯು ನೋವು', 'weakness': 'ದೌರ್ಬಲ್ಯ', 'chills': 'ಚಳಿ', 'sweating': 'ಸ್ವೇದ',
    'loss of appetite': 'ಹಸಿವಿಲ್ಲದಿರುವಿಕೆ', 'insomnia': 'ನಿದ್ರೆಯಿಲ್ಲದಿರುವಿಕೆ', 'anxiety': 'ಆತಂಕ', 'dry cough': 'ಒಣ ಕೆಮ್ಮು',
    'runny nose': 'ಮೂಗು ಒಸರುವಿಕೆ', 'eye irritation': 'ಕಣ್ಣು ಕಿರಿಕಿರಿ', 'chest pain': 'ಎದೆ ನೋವು',
    'shortness of breath': 'ಉಸಿರಾಟದ ತೊಂದರೆ'
  },
  malayalam: {
    'fever': 'പനി', 'headache': 'തലവേദന', 'body pain': 'ശരീരവേദന', 'cough': 'ചുമ', 'cold': 'പനി',
    'sore throat': 'തൊണ്ടവേദന', 'fatigue': 'ക്ഷീണം', 'nausea': 'ഓക്കാനം', 'vomiting': 'ഛർദ്ദി',
    'diarrhea': 'വയറിളക്കം', 'constipation': 'മലബന്ധം', 'stomach pain': 'വയറുവേദന', 'rash': 'ചർമ്മത്തിലെ പൊള്ള',
    'itching': 'ചൊറിച്ചിൽ', 'dizziness': 'തലചുറ്റൽ', 'back pain': 'മുതുകുവേദന', 'joint pain': 'സന്ധിവേദന',
    'muscle pain': 'പേശിവേദന', 'weakness': 'ദൗർബല്യം', 'chills': 'തണുപ്പ്', 'sweating': 'വിയർപ്പ്',
    'loss of appetite': 'പക്ഷാശനം', 'insomnia': 'ഉറക്കമില്ലായ്മ', 'anxiety': 'ആശങ്ക', 'dry cough': 'ഉണങ്ങിയ ചുമ',
    'runny nose': 'മൂക്കൊലിപ്പ്', 'eye irritation': 'കണ്ണിലെ എരിച്ചിൽ', 'chest pain': 'നെഞ്ചുവേദന',
    'shortness of breath': 'ശ്വാസം മുട്ടൽ'
  },
  gujarati: {
    'fever': 'તાવ', 'headache': 'માથાનો દુખાવો', 'body pain': 'શરીરમાં દુખાવો', 'cough': 'ખાંસી', 'cold': 'સરદી',
    'sore throat': 'ગળામાં દુખાવો', 'fatigue': 'થાક', 'nausea': 'મચકોડ', 'vomiting': 'ઉલટી',
    'diarrhea': 'ઝાડા', 'constipation': 'કબજિયાત', 'stomach pain': 'પેટમાં દુખાવો', 'rash': 'ચામડી પર ફોલ્લા',
    'itching': 'ખંજવાળ', 'dizziness': 'ચક્કર', 'back pain': 'પીઠમાં દુખાવો', 'joint pain': 'સાંધામાં દુખાવો',
    'muscle pain': 'સ્નાયુમાં દુખાવો', 'weakness': 'દુર્બળતા', 'chills': 'ઠંડી લાગવી', 'sweating': 'પરસેવો',
    'loss of appetite': 'ભૂખ ન લાગવી', 'insomnia': 'ઊંઘ ન આવવી', 'anxiety': 'ચિંતા', 'dry cough': 'સૂકી ખાંસી',
    'runny nose': 'નાક વહેવું', 'eye irritation': 'આંખમાં દાઝ', 'chest pain': 'છાતીમાં દુખાવો',
    'shortness of breath': 'શ્વાસ લેવામાં તકલીફ'
  },
};

const ALLERGY_TRANSLATIONS = {
  english: {},
  telugu: {
    'penicillin': 'పెన్సిలిన్', 'amoxicillin': 'అమాక్సిసిలిన్', 'aspirin': 'ఆస్పిరిన్', 'ibuprofen': 'ఐబుప్రోఫెన్',
    'paracetamol': 'పారాసిటమోల్', 'dairy': 'పాల ఉత్పత్తులు', 'peanuts': 'వేరుశనగ', 'shellfish': 'సముద్ర ఆహారం',
    'eggs': 'గుడ్లు', 'gluten': 'గ్లూటెన్', 'soy': 'సోయా', 'nuts': 'గింజలు', 'fish': 'చేప', 'sesame': 'ఎల్ల'
  },
  hindi: {
    'penicillin': 'पेनिसिलिन', 'amoxicillin': 'अमोक्सिसिलिन', 'aspirin': 'एस्पिरिन', 'ibuprofen': 'आइबुप्रोफेन',
    'paracetamol': 'पैरासिटामोल', 'dairy': 'डेयरी', 'peanuts': 'मूंगफली', 'shellfish': 'समुद्री भोजन',
    'eggs': 'अंडे', 'gluten': 'ग्लूटेन', 'soy': 'सोया', 'nuts': 'नट्स', 'fish': 'मछली', 'sesame': 'तिल'
  },
  marathi: {
    'penicillin': 'पेनिसिलिन', 'amoxicillin': 'अमोक्सिसिलिन', 'aspirin': 'एस्पिरिन', 'ibuprofen': 'आयबुप्रोफेन',
    'paracetamol': 'पॅरासिटामोल', 'dairy': 'दुग्धजन्य', 'peanuts': 'शेंगदाणे', 'shellfish': 'समुद्री खाद्य',
    'eggs': 'अंडी', 'gluten': 'ग्लुटेन', 'soy': 'सोया', 'nuts': 'काजू', 'fish': 'मासे', 'sesame': 'तिळ'
  },
  bengali: {
    'penicillin': 'পেনিসিলিন', 'amoxicillin': 'অ্যামোক্সিসিলিন', 'aspirin': 'অ্যাসপিরিন', 'ibuprofen': 'আইবুপ্রোফেন',
    'paracetamol': 'প্যারাসিটামল', 'dairy': 'দুগ্ধজাত', 'peanuts': 'চিনাবাদাম', 'shellfish': 'শেলফিশ',
    'eggs': 'ডিম', 'gluten': 'গ্লুটেন', 'soy': 'সয়াবিন', 'nuts': 'বাদাম', 'fish': 'মাছ', 'sesame': 'তিল'
  },
  tamil: {
    'penicillin': 'பெனிசிலின்', 'amoxicillin': 'அமோக்சிசிலின்', 'aspirin': 'அஸ்பிரின்', 'ibuprofen': 'ஐபுப்புரோஃபென்',
    'paracetamol': 'பாராசிட்டமால்', 'dairy': 'பால் பொருட்கள்', 'peanuts': 'நிலக்கடலை', 'shellfish': 'கடல் உணவு',
    'eggs': 'முட்டை', 'gluten': 'குளுட்டன்', 'soy': 'சோயா', 'nuts': 'கொட்டைகள்', 'fish': 'மீன்', 'sesame': 'எள்ளு'
  },
  kannada: {
    'penicillin': 'ಪೆನಿಸಿಲಿನ್', 'amoxicillin': 'ಅಮೊಕ್ಸಿಸಿಲಿನ್', 'aspirin': 'ಆಸ್ಪಿರಿನ್', 'ibuprofen': 'ಐಬುಪ್ರೊಫೆನ್',
    'paracetamol': 'ಪ್ಯಾರಾಸಿಟಮಾಲ್', 'dairy': 'ಹಾಲಿನ ಉತ್ಪನ್ನಗಳು', 'peanuts': 'ಕಡಲೆಕಾಯಿ', 'shellfish': 'ಸಮುದ್ರ ಆಹಾರ',
    'eggs': 'ಮೊಟ್ಟೆ', 'gluten': 'ಗ್ಲೂಟೆನ್', 'soy': 'ಸೋಯಾ', 'nuts': 'ಕಾಯಿಗಳು', 'fish': 'ಮೀನು', 'sesame': 'ಎಳ್ಳು'
  },
  malayalam: {
    'penicillin': 'പെനിസിലിൻ', 'amoxicillin': 'അമോക്സിസിലിൻ', 'aspirin': 'ആസ്പിരിൻ', 'ibuprofen': 'ഐബുപ്രോഫെൻ',
    'paracetamol': 'പാരാസിറ്റമോൾ', 'dairy': 'പാലുൽപ്പന്നങ്ങൾ', 'peanuts': 'നിലക്കടല', 'shellfish': 'കടൽ ഭക്ഷണം',
    'eggs': 'മുട്ട', 'gluten': 'ഗ്ലൂട്ടൻ', 'soy': 'സോയ', 'nuts': 'കായ്കൾ', 'fish': 'മത്സ്യം', 'sesame': 'എള്ള്'
  },
  gujarati: {
    'penicillin': 'પેનિસિલિન', 'amoxicillin': 'એમોક્સિસિલિન', 'aspirin': 'એસ્પિરિન', 'ibuprofen': 'આઇબુપ્રોફેન',
    'paracetamol': 'પેરાસિટામોલ', 'dairy': 'ડેરી', 'peanuts': 'મગફળી', 'shellfish': 'સમુદ્રી ખોરાક',
    'eggs': 'ઇંડા', 'gluten': 'ગ્લુટેન', 'soy': 'સોયા', 'nuts': 'નટ્સ', 'fish': 'માછલી', 'sesame': 'તલ'
  },
};

const CONDITION_TRANSLATIONS = {
  english: {},
  telugu: {
    'diabetes': 'డయాబెటిస్', 'hypertension': 'అధిక రక్తపోటు', 'asthma': 'ఆస్తమా', 'heart disease': 'హృదయ వ్యాధి',
    'kidney disease': 'మూత్రపిండ వ్యాధి', 'liver disease': 'కాలేయ వ్యాధి', 'thyroid': 'థైరాయిడ్', 'arthritis': 'సంధివాతం',
    'migraine': 'మైగ్రేన్', 'anxiety': 'ఆందోళన', 'depression': 'ఖిన్నత', 'epilepsy': 'మూర్ఛ',
    'cancer': 'క్యాన్సర్', 'tuberculosis': 'క్షయ', 'covid-19': 'కోవిడ్-19', 'hiv': 'ఎచ్ఐవి', 'hepatitis': 'హెపటైటిస్'
  },
  hindi: {
    'diabetes': 'मधुमेह', 'hypertension': 'उच्च रक्तचाप', 'asthma': 'दमा', 'heart disease': 'हृदय रोग',
    'kidney disease': 'किडनी रोग', 'liver disease': 'लीवर रोग', 'thyroid': 'थायरॉइड', 'arthritis': 'गठिया',
    'migraine': 'माइग्रेन', 'anxiety': 'चिंता', 'depression': 'अवसाद', 'epilepsy': 'मिर्गी',
    'cancer': 'कैंसर', 'tuberculosis': 'तपेदिक', 'covid-19': 'कोविड-19', 'hiv': 'एचआईवी', 'hepatitis': 'हेपेटाइटिस'
  },
  marathi: {
    'diabetes': 'मधुमेह', 'hypertension': 'उच्च रक्तदाब', 'asthma': 'दमा', 'heart disease': 'हृदयरोग',
    'kidney disease': 'मूत्रपिंड रोग', 'liver disease': 'यकृत रोग', 'thyroid': 'थायरॉइड', 'arthritis': 'संधिवात',
    'migraine': 'मायग्रेन', 'anxiety': 'चिंता', 'depression': 'नैराश्य', 'epilepsy': 'अपस्मार',
    'cancer': 'कर्करोग', 'tuberculosis': 'क्षयरोग', 'covid-19': 'कोविड-19', 'hiv': 'एचआयव्ही', 'hepatitis': 'यकृतदाह'
  },
  bengali: {
    'diabetes': 'ডায়াবেটিস', 'hypertension': 'উচ্চ রক্তচাপ', 'asthma': 'হাঁপানি', 'heart disease': 'হৃদরোগ',
    'kidney disease': 'কিডনি রোগ', 'liver disease': 'লিভার রোগ', 'thyroid': 'থাইরয়েড', 'arthritis': 'বাত',
    'migraine': 'মাইগ্রেন', 'anxiety': 'উদ্বেগ', 'depression': 'হতাশা', 'epilepsy': 'মৃগীরোগ',
    'cancer': 'ক্যান্সার', 'tuberculosis': 'যক্ষ্মা', 'covid-19': 'কোভিড-১৯', 'hiv': 'এইচআইভি', 'hepatitis': 'হেপাটাইটিস'
  },
  tamil: {
    'diabetes': 'நீரிழிவு', 'hypertension': 'உயர் இரத்த அழுத்தம்', 'asthma': 'ஆஸ்துமா', 'heart disease': 'இதய நோய்',
    'kidney disease': 'சிறுநீரக நோய்', 'liver disease': 'கல்லீரல் நோய்', 'thyroid': 'தைராய்டு', 'arthritis': 'மூட்டு வலி',
    'migraine': 'மைக்ரேன்', 'anxiety': 'கவலை', 'depression': 'மனச்சோர்வு', 'epilepsy': 'வலிப்பு',
    'cancer': 'புற்றுநோய்', 'tuberculosis': 'காசநோய்', 'covid-19': 'கோவிட்-19', 'hiv': 'எச்ஐவி', 'hepatitis': 'ஹெபடைட்டிஸ்'
  },
  kannada: {
    'diabetes': 'ಮಧುಮೇಹ', 'hypertension': 'ಅಧಿಕ ರಕ್ತದೊತ್ತಡ', 'asthma': 'ಆಸ್ತಮಾ', 'heart disease': 'ಹೃದಯ ರೋಗ',
    'kidney disease': 'ಮೂತ್ರಪಿಂಡ ರೋಗ', 'liver disease': 'ಯಕೃತ್ತಿನ ರೋಗ', 'thyroid': 'ಥೈರಾಯ್ಡ್', 'arthritis': 'ಸಂಧಿವಾತ',
    'migraine': 'ಮೈಗ್ರೇನ್', 'anxiety': 'ಆತಂಕ', 'depression': 'ಖಿನ್ನತೆ', 'epilepsy': 'ಮೂರ್ಛೆ',
    'cancer': 'ಕ್ಯಾನ್ಸರ್', 'tuberculosis': 'ಕ್ಷಯ', 'covid-19': 'ಕೋವಿಡ್-19', 'hiv': 'ಎಚ್ಐವಿ', 'hepatitis': 'ಹೆಪಟೈಟಿಸ್'
  },
  malayalam: {
    'diabetes': 'പ്രമേഹം', 'hypertension': 'ഉയർന്ന രക്തസമ്മർദ്ദം', 'asthma': 'ആസ്തമ', 'heart disease': 'ഹൃദയരോഗം',
    'kidney disease': 'വൃക്കരോഗം', 'liver disease': 'കരൾ രോഗം', 'thyroid': 'തൈറോയ്ഡ്', 'arthritis': 'വാതം',
    'migraine': 'മൈഗ്രെയ്ൻ', 'anxiety': 'ആശങ്ക', 'depression': 'വിഷാദം', 'epilepsy': 'അപസ്മാരം',
    'cancer': 'ക്യാൻസർ', 'tuberculosis': 'ക്ഷയം', 'covid-19': 'കോവിഡ്-19', 'hiv': 'എച്ച്ഐവി', 'hepatitis': 'ഹെപ്പറ്റൈറ്റിസ്'
  },
  gujarati: {
    'diabetes': 'મધુમેહ', 'hypertension': 'ઉચ્ચ રક્તચાપ', 'asthma': 'દમ', 'heart disease': 'હૃદય રોગ',
    'kidney disease': 'કિડની રોગ', 'liver disease': 'લીવર રોગ', 'thyroid': 'થાયરોઇડ', 'arthritis': 'સંધિવાત',
    'migraine': 'માઇગ્રેન', 'anxiety': 'ચિંતા', 'depression': 'હતાશા', 'epilepsy': 'મૂર્છા',
    'cancer': 'કેન્સર', 'tuberculosis': 'ક્ષય', 'covid-19': 'કોવિડ-19', 'hiv': 'એચઆઇવી', 'hepatitis': 'હેપેટાઇટિસ'
  },
};

// Helper to get translated display text
export const getSymptomDisplay = (englishKey, language = 'english') => {
  if (language === 'english') return englishKey;
  return SYMPTOM_TRANSLATIONS[language]?.[englishKey] || englishKey;
};

export const getAllergyDisplay = (englishKey, language = 'english') => {
  if (language === 'english') return englishKey;
  return ALLERGY_TRANSLATIONS[language]?.[englishKey] || englishKey;
};

export const getConditionDisplay = (englishKey, language = 'english') => {
  if (language === 'english') return englishKey;
  return CONDITION_TRANSLATIONS[language]?.[englishKey] || englishKey;
};

// Get list of English keys (for backend) - always return English keys
export const getSymptomsList = (language = 'english') => {
  return SYMPTOMS_EN;
};

export const getAllergiesList = (language = 'english') => {
  return ALLERGIES_EN;
};

export const getConditionsList = (language = 'english') => {
  return CONDITIONS_EN;
};
