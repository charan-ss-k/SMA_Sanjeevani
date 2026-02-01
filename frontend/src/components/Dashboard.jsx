import React, { useState, useEffect, useContext } from 'react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { AuthContext } from '../main';
import { LanguageContext } from '../main';
import FeatureLoginPrompt from './FeatureLoginPrompt';
import { t } from '../utils/translations';
import { playTTS } from '../utils/tts';
import { translateData, translateDataBatch } from '../data/dataTranslations';
import DashboardAppointments from './DashboardAppointments';
import DashboardReminders from './DashboardReminders';

// Dashboard-specific translations for all UI elements
const dashboardTranslations = {
  english: {
    yourHealthDashboard: '📊 Your Health Dashboard',
    trackSymptomSearches: 'Track your symptom searches, health trends, and recommendations',
    totalSearches: 'Total Searches',
    mostCommonSymptom: 'Most Common Symptom',
    mostDiagnosed: 'Most Diagnosed Condition',
    medicinesRecommended: 'Medicines Recommended',
    mostCommonSymptoms: '📋 Most Common Symptoms',
    frequency: 'Frequency',
    diagnosedConditions: '🏥 Diagnosed Conditions',
    topRecommendedMedicines: '💊 Top Recommended Medicines',
    recommendations: 'Recommendations',
    recentSearches: '📜 Recent Searches',
    clearHistory: '🗑️ Clear History',
    areYouSureClear: 'Are you sure you want to clear all search history?',
    noSearchHistory: 'No search history yet. Start by checking your symptoms!',
    date: 'Date',
    symptoms: 'Symptoms',
    ageGender: 'Age/Gender',
    predictedCondition: 'Predicted Condition',
    action: 'Action',
    details: '🔊 Details',
    searchHistoryCleared: 'Search history cleared',
    yourConditionHistory: '🏥 Your Condition History',
    noConditionsRecorded: 'No conditions recorded yet',
    wellnessTips: '💡 Wellness Tips',
    stayHydratedWater: '✓ Stay hydrated and drink plenty of water',
    getQualitySleep: '✓ Get 7-8 hours of quality sleep',
    exerciseRegularly: '✓ Exercise regularly (20-30 min daily)',
    maintainBalancedDiet: '✓ Maintain a balanced diet',
    washHandsFrequently: '✓ Wash hands frequently and maintain hygiene',
    consultDoctorPersistent: '✓ Consult a doctor for persistent symptoms',
  },
  telugu: {
    yourHealthDashboard: '📊 మీ ఆరోగ్య డాష్బోర్డ్',
    trackSymptomSearches: 'మీ లక్షణ శోధనలు, ఆరోగ్య ధోరణులు మరియు సిఫార్సులను ట్రాక్ చేయండి',
    totalSearches: 'మొత్తం శోధనలు',
    mostCommonSymptom: 'అత్యంత సాధారణ లక్షణం',
    mostDiagnosed: 'అత్యంత నిర్ధారించిన పరిస్థితి',
    medicinesRecommended: 'సిఫార్సు చేసిన మందులు',
    mostCommonSymptoms: '📋 సాధారణ లక్షణాలు',
    frequency: 'ఫ్రీక్వెన్సీ',
    diagnosedConditions: '🏥 నిర్ధారించిన పరిస్థితులు',
    topRecommendedMedicines: '💊 సర్వోత్తమ సిఫార్సు చేసిన మందులు',
    recommendations: 'సిఫార్సులు',
    recentSearches: '📜 ఇటీవల శోధనలు',
    clearHistory: '🗑️ చరిత్ర క్లియర్ చేయండి',
    areYouSureClear: 'మీరు తప్పకుండా అన్ని శోధన చరిత్రను క్లియర్ చేయాలనుకుంటున్నారా?',
    noSearchHistory: 'ఇంకా శోధన చరిత్ర లేదు. మీ లక్షణాలను తనిఖీ చేయడం ద్వారా ప్రారంభించండి!',
    date: 'తేదీ',
    symptoms: 'లక్షణాలు',
    ageGender: 'వయసు/లింగం',
    predictedCondition: 'అంచనా వేసిన పరిస్థితి',
    action: 'చర్య',
    details: '🔊 వివరాలు',
    searchHistoryCleared: 'శోధన చరిత్ర క్లియర్ చేయబడింది',
    yourConditionHistory: '🏥 మీ పరిస్థితి చరిత్ర',
    noConditionsRecorded: 'ఇంకా పరిస్థితులు రికార్డ్ చేయబడలేదు',
    wellnessTips: '💡 ఆరోగ్య చిట్కాలు',
    stayHydratedWater: '✓ హైడ్రేటెడ్ ఉండండి మరియు భోజనానికి నీరు త్రాగండి',
    getQualitySleep: '✓ 7-8 గంటల నిద్ర పొందండి',
    exerciseRegularly: '✓ రోజుకు నियమితంగా వ్యాయామం చేయండి (20-30 నిమిషాలు)',
    maintainBalancedDiet: '✓ సమతుల్య ఆహారాన్ని నిర్వహించండి',
    washHandsFrequently: '✓ తరచుగా చేతులను కడగండి మరియు పరిశుద్ధతను నిర్వహించండి',
    consultDoctorPersistent: '✓ సంధ్య లక్షణాలకు వైద్యుడిని సంప్రదించండి',
  },
  hindi: {
    yourHealthDashboard: '📊 आपका स्वास्थ्य डैशबोर्ड',
    trackSymptomSearches: 'अपनी लक्षण खोजों, स्वास्थ्य प्रवृत्तियों और सिफारिशों को ट्रैक करें',
    totalSearches: 'कुल खोजें',
    mostCommonSymptom: 'सबसे आम लक्षण',
    mostDiagnosed: 'सबसे अधिक निदान की गई स्थिति',
    medicinesRecommended: 'अनुशंसित दवाएं',
    mostCommonSymptoms: '📋 सबसे आम लक्षण',
    frequency: 'आवृत्ति',
    diagnosedConditions: '🏥 निदान की गई स्थितियां',
    topRecommendedMedicines: '💊 शीर्ष अनुशंसित दवाएं',
    recommendations: 'सिफारिशें',
    recentSearches: '📜 हाल की खोजें',
    clearHistory: '🗑️ इतिहास हटाएं',
    areYouSureClear: 'क्या आप निश्चित हैं कि आप सभी खोज इतिहास को साफ़ करना चाहते हैं?',
    noSearchHistory: 'अभी तक कोई खोज इतिहास नहीं है। अपने लक्षणों की जांच करके शुरुआत करें!',
    date: 'तारीख',
    symptoms: 'लक्षण',
    ageGender: 'उम्र/लिंग',
    predictedCondition: 'अनुमानित स्थिति',
    action: 'कार्रवाई',
    details: '🔊 विवरण',
    searchHistoryCleared: 'खोज इतिहास साफ़ किया गया',
    yourConditionHistory: '🏥 आपकी स्थिति का इतिहास',
    noConditionsRecorded: 'अभी तक कोई स्थितियां दर्ज नहीं की गई हैं',
    wellnessTips: '💡 कल्याण सुझाव',
    stayHydratedWater: '✓ हाइड्रेटेड रहें और खूब पानी पिएं',
    getQualitySleep: '✓ 7-8 घंटे की गुणवत्तापूर्ण नींद लें',
    exerciseRegularly: '✓ नियमित रूप से व्यायाम करें (दैनिक 20-30 मिनट)',
    maintainBalancedDiet: '✓ संतुलित आहार बनाए रखें',
    washHandsFrequently: '✓ बार-बार हाथ धोएं और स्वच्छता बनाए रखें',
    consultDoctorPersistent: '✓ लगातार लक्षणों के लिए डॉक्टर से परामर्श लें',
  },
  marathi: {
    yourHealthDashboard: '📊 आपले आरोग्य डैशबोर्ड',
    trackSymptomSearches: 'आपल्या लक्षण शोधा, आरोग्य प्रवृत्ती आणि शिफारशींचा मागोवा घ्या',
    totalSearches: 'एकूण शोधा',
    mostCommonSymptom: 'सर्वात सामान्य लक्षण',
    mostDiagnosed: 'सर्वात अधिक निदान केलेली स्थिति',
    medicinesRecommended: 'शिफारस केलेली औषधे',
    mostCommonSymptoms: '📋 सामान्य लक्षणे',
    frequency: 'वारंवारता',
    diagnosedConditions: '🏥 निदान केलेल्या परिस्थितींनी',
    topRecommendedMedicines: '💊 शीर्ष शिफारस केलेली औषधे',
    recommendations: 'शिफारशी',
    recentSearches: '📜 अलीकडील शोधा',
    clearHistory: '🗑️ इतिहास हटवा',
    areYouSureClear: 'आप निश्चितपणे सर्व शोध इतिहास साफ करू इच्छिता?',
    noSearchHistory: 'अद्याप शोध इतिहास नाही. आपल्या लक्षणांची तपासणी करून सुरुवात करा!',
    date: 'तारीख',
    symptoms: 'लक्षणे',
    ageGender: 'वय/लिंग',
    predictedCondition: 'अंदाजित स्थिति',
    action: 'कृती',
    details: '🔊 तपशील',
    searchHistoryCleared: 'शोध इतिहास साफ केला',
    yourConditionHistory: '🏥 आपली परिस्थिती इतिहास',
    noConditionsRecorded: 'अद्याप कोणत्या परिस्थिती रेकॉर्ड केली नाही',
    wellnessTips: '💡 आरोग्य सुझाव',
    stayHydratedWater: '✓ हायड्रेटेड राहा आणि खूप पाणी प्या',
    getQualitySleep: '✓ 7-8 तासांची गुणवत्तेची झोप घ्या',
    exerciseRegularly: '✓ नियमितपणे व्यायाम करा (दैनिक 20-30 मिनिटे)',
    maintainBalancedDiet: '✓ संतुलित आहार राखा',
    washHandsFrequently: '✓ वारंवार हात धुवा आणि स्वच्छता राखा',
    consultDoctorPersistent: '✓ सतत लक्षणांसाठी डॉक्टरांचा सल्ला घ्या',
  },
  bengali: {
    yourHealthDashboard: '📊 আপনার স্বাস্থ্য ড্যাশবোর্ড',
    trackSymptomSearches: 'আপনার লক্ষণ অনুসন্ধান, স্বাস্থ্য প্রবণতা এবং সুপারিশগুলি ট্র্যাক করুন',
    totalSearches: 'মোট অনুসন্ধান',
    mostCommonSymptom: 'সবচেয়ে সাধারণ লক্ষণ',
    mostDiagnosed: 'সর্বাধিক নির্ণীত স্থিতি',
    medicinesRecommended: 'সুপারিশকৃত ওষুধ',
    mostCommonSymptoms: '📋 সাধারণ লক্ষণগুলি',
    frequency: 'ফ্রিকোয়েন্সি',
    diagnosedConditions: '🏥 নির্ণীত শর্তাবলী',
    topRecommendedMedicines: '💊 শীর্ষ সুপারিশকৃত ওষুধ',
    recommendations: 'সুপারিশ',
    recentSearches: '📜 সাম্প্রতিক অনুসন্ধান',
    clearHistory: '🗑️ ইতিহাস সাফ করুন',
    areYouSureClear: 'আপনি কি সমস্ত অনুসন্ধান ইতিহাস সাফ করতে নিশ্চিত?',
    noSearchHistory: 'এখনও কোনও অনুসন্ধান ইতিহাস নেই। আপনার লক্ষণগুলি পরীক্ষা করে শুরু করুন!',
    date: 'তারিখ',
    symptoms: 'লক্ষণ',
    ageGender: 'বয়স/লিঙ্গ',
    predictedCondition: 'পূর্বাভাস দেওয়া অবস্থা',
    action: 'কর্ম',
    details: '🔊 বিবরণ',
    searchHistoryCleared: 'অনুসন্ধান ইতিহাস সাফ করা হয়েছে',
    yourConditionHistory: '🏥 আপনার অবস্থার ইতিহাস',
    noConditionsRecorded: 'এখনও কোনও শর্তাবলী রেকর্ড করা হয়নি',
    wellnessTips: '💡 সুস্থতার টিপস',
    stayHydratedWater: '✓ হাইড্রেটেড থাকুন এবং প্রচুর জল পান',
    getQualitySleep: '✓ 7-8 ঘন্টা মানসম্মত ঘুম পান',
    exerciseRegularly: '✓ নিয়মিত ব্যায়াম করুন (দৈনিক 20-30 মিনিট)',
    maintainBalancedDiet: '✓ একটি সুষম খাদ্য বজায় রাখুন',
    washHandsFrequently: '✓ ঘন ঘন হাত ধুয়ে এবং স্বাস্থ্যবিধি বজায় রাখুন',
    consultDoctorPersistent: '✓ ক্রমাগত লক্ষণের জন্য ডাক্তারের সাথে পরামর্শ করুন',
  },
  tamil: {
    yourHealthDashboard: '📊 உங்கள் ஆரோக்கியம் டாஷ்போர்டு',
    trackSymptomSearches: 'உங்கள் அறிகுறி தேடல்கள், ஆரோக்கிய போக்குகள் மற்றும் பரிந்துரைகளைக் கண்காணிக்கவும்',
    totalSearches: 'மொத்த தேடல்கள்',
    mostCommonSymptom: 'மிகவும் பொதுவான அறிகுறி',
    mostDiagnosed: 'மிகவும் கண்டறியப்பட்ட நிலை',
    medicinesRecommended: 'பரிந்துரைக்கப்பட்ட மருந்துகள்',
    mostCommonSymptoms: '📋 பொதுவான அறிகுறிகள்',
    frequency: 'அதிர்வெண்',
    diagnosedConditions: '🏥 கண்டறியப்பட்ட நிலைகள்',
    topRecommendedMedicines: '💊 சிறந்த பரிந்துரைக்கப்பட்ட மருந்துகள்',
    recommendations: 'பரிந்துரைகள்',
    recentSearches: '📜 சமீபத்திய தேடல்கள்',
    clearHistory: '🗑️ வரலாற்றை நீக்கவும்',
    areYouSureClear: 'நீங்கள் உறுதியாக அனைத்து தேடல் வரலாற்றை நீக்க விரும்புகிறீர்களா?',
    noSearchHistory: 'இதுவரை தேடல் வரலாறு இல்லை. உங்கள் அறிகுறிகளை சரிபார்த்து தொடங்குங்கள்!',
    date: 'தேதி',
    symptoms: 'அறிகுறிகள்',
    ageGender: 'வயது/பாலினம்',
    predictedCondition: 'முன்னறிவிக்கப்பட்ட நிலை',
    action: 'நடவடிக்கை',
    details: '🔊 விவரங்கள்',
    searchHistoryCleared: 'தேடல் வரலாறு நீக்கப்பட்டது',
    yourConditionHistory: '🏥 உங்கள் நிலை வரலாறு',
    noConditionsRecorded: 'இதுவரை நிலைகள் பதிவு செய்யப்படவில்லை',
    wellnessTips: '💡 ஆரோக்கிய குறிப்புகள்',
    stayHydratedWater: '✓ நீரேற்றம் பெற்று நிறைய தண்ணீர் குடிக்கவும்',
    getQualitySleep: '✓ 7-8 மணிநேர தரமான தூக்கம் பெறவும்',
    exerciseRegularly: '✓ தொடர்ந்து உடற்பயிற்சி செய்யவும் (தினசரி 20-30 நிமிடங்கள்)',
    maintainBalancedDiet: '✓ சமன்வயப்பட்ட உணவை பராமரிக்கவும்',
    washHandsFrequently: '✓ அடிக்கடி கைகளை கழுவவும் மற்றும் சுகாதாரம் பராமரிக்கவும்',
    consultDoctorPersistent: '✓ நிலையான அறிகுறிகளுக்கு வைத்தியரை ஆலோசிக்கவும்',
  },
  kannada: {
    yourHealthDashboard: '📊 ನಿಮ್ಮ ಆರೋಗ್ಯ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    trackSymptomSearches: 'ನಿಮ್ಮ ರೋಗಲಕ್ಷಣ ಹುಡುಕಾಟ, ಆರೋಗ್ಯ ಪ್ರವೃತ್ತಿ ಮತ್ತು ಶಿಫಾರಿಸುಗಳನ್ನು ಟ್ರ್ಯಾಕ್ ಮಾಡಿ',
    totalSearches: 'ಒಟ್ಟು ಹುಡುಕಾಟ',
    mostCommonSymptom: 'ಅತ್ಯಂತ ಸಾಮಾನ್ಯ ರೋಗಲಕ್ಷಣ',
    mostDiagnosed: 'ಹೆಚ್ಚಿನ ರೋಗನಿರ್ಣಯ ಸ್ಥಿತಿ',
    medicinesRecommended: 'ಶಿಫಾರಿಸಿದ ಔಷಧಿ',
    mostCommonSymptoms: '📋 ಸಾಮಾನ್ಯ ರೋಗಲಕ್ಷಣ',
    frequency: 'ಆವರ್ತನ',
    diagnosedConditions: '🏥 ರೋಗನಿರ್ಣಯ ಮಾಡಿದ ಸ್ಥಿತಿಗಳು',
    topRecommendedMedicines: '💊 ಉನ್ನತ ಶಿಫಾರಿಸಿದ ಔಷಧಿ',
    recommendations: 'ಶಿಫಾರಿಸುಗಳು',
    recentSearches: '📜 ಇತ್ತೀಚಿನ ಹುಡುಕಾಟ',
    clearHistory: '🗑️ ಇತಿಹಾಸ ಸ್ಪಷ್ಟ ಮಾಡಿ',
    areYouSureClear: 'ನೀವು ಎಲ್ಲಾ ಹುಡುಕಾಟ ಇತಿಹಾಸವನ್ನು ಸ್ಪಷ್ಟ ಮಾಡಲು ಖಚಿತವಾಗಿದ್ದೀರಿ?',
    noSearchHistory: 'ಇನ್ನೂ ಹುಡುಕಾಟ ಇತಿಹಾಸ ಇಲ್ಲ. ನಿಮ್ಮ ರೋಗಲಕ್ಷಣಗಳನ್ನು ಪರಿಶೀಲಿಸುವ ಮೂಲಕ ಪ್ರಾರಂಭಿಸಿ!',
    date: 'ದಿನಾಂಕ',
    symptoms: 'ರೋಗಲಕ್ಷಣ',
    ageGender: 'ವಯಸ್ಸು/ಲಿಂಗ',
    predictedCondition: 'ಭವಿಷ್ಯದ್ವಾಣಿ ಸ್ಥಿತಿ',
    action: 'ಕ್ರಿಯೆ',
    details: '🔊 ವಿವರಣೆ',
    searchHistoryCleared: 'ಹುಡುಕಾಟ ಇತಿಹಾಸ ಸ್ಪಷ್ಟ ಮಾಡಲಾಗಿದೆ',
    yourConditionHistory: '🏥 ನಿಮ್ಮ ಸ್ಥಿತಿ ಇತಿಹಾಸ',
    noConditionsRecorded: 'ಇನ್ನೂ ಯಾವುದೇ ಸ್ಥಿತಿಗಳನ್ನು ರೆಕಾರ್ಡ್ ಮಾಡಲಾಗಿಲ್ಲ',
    wellnessTips: '💡 ಆರೋಗ್ಯ ಸಲಹೆ',
    stayHydratedWater: '✓ ನೀರಾಶಯವಾಗಿ ಉಳಿಯಿರಿ ಮತ್ತು ಸಾಕಷ್ಟು ನೀರು ಕುಡಿಯಿರಿ',
    getQualitySleep: '✓ 7-8 ಗಂಟೆಗಳ ನಿಜವಾದ ನಿದ್ರೆ ಪಡೆಯಿರಿ',
    exerciseRegularly: '✓ ನಿಯಮಿತವಾಗಿ ವ್ಯಾಯಾಮ ಮಾಡಿ (ದೈನಿಕ 20-30 ನಿಮಿಷ)',
    maintainBalancedDiet: '✓ ಸಮತೋಲಿತ ಆಹಾರವನ್ನು ಕಾಪಾಡಿ',
    washHandsFrequently: '✓ ಆಗಾಗ್ಗೆ ಕೈಗಳನ್ನು ತೊಳೆಯಿರಿ ಮತ್ತು ನೈರ್ಮಲ್ಯ ಕಾಪಾಡಿ',
    consultDoctorPersistent: '✓ ನಿರಂತರ ರೋಗಲಕ್ಷಣಗಳಿಗೆ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ',
  },
  malayalam: {
    yourHealthDashboard: '📊 നിങ്ങളുടെ ആരോഗ്യ ഡാഷ്ബോർഡ്',
    trackSymptomSearches: 'നിങ്ങളുടെ രോഗലക്ഷണ തിരയൽ, ആരോഗ്യ ട്രെന്റ്, ശുപാർശകൾ എന്നിവ ട്രാക്കുചെയ്യുക',
    totalSearches: 'മൊത്തം തിരയൽ',
    mostCommonSymptom: 'ഏറ്റവും സാധാരണമായ രോഗലക്ഷണം',
    mostDiagnosed: 'ഏറ്റവും കൂടുതൽ രോഗനിർണയം നടത്തിയ അവസ്ഥ',
    medicinesRecommended: 'ശുപാർശ ചെയ്ത ഔഷധങ്ങൾ',
    mostCommonSymptoms: '📋 സാധാരണമായ രോഗലക്ഷണങ്ങൾ',
    frequency: 'ആവൃത്തി',
    diagnosedConditions: '🏥 രോഗനിർണയം നടത്തിയ അവസ്ഥകൾ',
    topRecommendedMedicines: '💊 അനുത്തമ ശുപാർശിത ഔഷധങ്ങൾ',
    recommendations: 'ശുപാർശകൾ',
    recentSearches: '📜 സമീപകാല തിരയൽ',
    clearHistory: '🗑️ ചരിത്രം മായ്ച്ചുകളയുക',
    areYouSureClear: 'നിങ്ങൾ എല്ലാ തിരയൽ ചരിത്രവും മായ്ച്ചുകളയാൻ ഉറപ്പാണോ?',
    noSearchHistory: 'ഇതുവരെ തിരയൽ ചരിത്രം ഇല്ല. നിങ്ങളുടെ രോഗലക്ഷണങ്ങൾ പരിശോധിച്ച് ആരംഭിക്കുക!',
    date: 'തീയതി',
    symptoms: 'രോഗലക്ഷണങ്ങൾ',
    ageGender: 'പ്രായം/ലിംഗം',
    predictedCondition: 'പ്രവചിച്ച അവസ്ഥ',
    action: 'പ്രവർത്തനം',
    details: '🔊 വിശദാംശങ്ങൾ',
    searchHistoryCleared: 'തിരയൽ ചരിത്രം മായ്ച്ചുകളഞ്ഞു',
    yourConditionHistory: '🏥 നിങ്ങളുടെ അവസ്ഥ ചരിത്രം',
    noConditionsRecorded: 'ഇതുവരെ അവസ്ഥകൾ രേഖപ്പെടുത്തിയിട്ടില്ല',
    wellnessTips: '💡 ആരോഗ്യ നുറുങ്ങുകൾ',
    stayHydratedWater: '✓ നനഞ്ഞ് നിൽക്കുക കൂടാതെ ധാരാളം വെള്ളം കുടിക്കുക',
    getQualitySleep: '✓ 7-8 മണിക്കൂർ നല്ല നിദ്ര നേടുക',
    exerciseRegularly: '✓ പതിവായി വ്യായാമം ചെയ്യുക (ദൈനിക 20-30 മിനിറ്റ്)',
    maintainBalancedDiet: '✓ സന്തുലിത ഭക്ഷണാഭ്യാസം പരിപാലിക്കുക',
    washHandsFrequently: '✓ പതിവായി കൈ കഴുകുക കൂടാതെ ശുചിത്വം പരിപാലിക്കുക',
    consultDoctorPersistent: '✓ സ്ഥിരമായ രോഗലക്ഷണങ്ങൾക്കായി ഡോക്ടറെ കണ്ടുപരിശോധിക്കുക',
  },
  gujarati: {
    yourHealthDashboard: '📊 તમારું આરોગ્ય ડેશબોર્ડ',
    trackSymptomSearches: 'તમારા લક્ષણ શોધ, આરોગ્ય ટ્રેન્ડ્સ અને ભલામણોને ટ્રૅક કરો',
    totalSearches: 'કુલ શોધ',
    mostCommonSymptom: 'સૌથી સામાન્ય લક્ષણ',
    mostDiagnosed: 'સૌથી વધુ નિદાન થયેલ સ્થિતિ',
    medicinesRecommended: 'ભલામણ કરેલી દવાઓ',
    mostCommonSymptoms: '📋 સામાન્ય લક્ષણો',
    frequency: 'આવર્તન',
    diagnosedConditions: '🏥 નિદાન થયેલ સ્થિતિઓ',
    topRecommendedMedicines: '💊 ટોપ ભલામણ કરેલી દવાઓ',
    recommendations: 'ભલામણો',
    recentSearches: '📜 તાજેતરના શોધ',
    clearHistory: '🗑️ ઇતિહાસ સાફ કરો',
    areYouSureClear: 'શું તમે ખરેખર બધા શોધ ઇતિહાસ સાફ કરવા માંગો છો?',
    noSearchHistory: 'ઇતિહાસ હજી શોધ નથી. તમારા લક્ષણો તપાસીને શરૂ કરો!',
    date: 'તારીખ',
    symptoms: 'લક્ષણો',
    ageGender: 'વય/લિંગ',
    predictedCondition: 'અનુમાનિત સ્થિતિ',
    action: 'પગલું',
    details: '🔊 વિગતો',
    searchHistoryCleared: 'શોધ ઇતિહાસ સાફ કરવામાં આવ્યો',
    yourConditionHistory: '🏥 તમારી સ્થિતિ ઇતિહાસ',
    noConditionsRecorded: 'હજી કોણ સ્થિતિઓ નોંધાયેલ નથી',
    wellnessTips: '💡 સુખ નુસખા',
    stayHydratedWater: '✓ હાઈડ્રેટેડ રહો અને ખૂબ પાણી પીઓ',
    getQualitySleep: '✓ 7-8 કલાક ગુણવત્તાવાળી ઊંઘ લો',
    exerciseRegularly: '✓ નિયમિત વ્યાયામ કરો (દૈનિક 20-30 મિનિટ)',
    maintainBalancedDiet: '✓ સંતુલિત આહાર જાળવી રાખો',
    washHandsFrequently: '✓ વારંવાર હાથ ધોઓ અને સ્વચ્છતા જાળવી રાખો',
    consultDoctorPersistent: '✓ પતરાત લક્ષણો માટે ડોક્ટર સાથે સલાહ કરો',
  },
};

const getTranslation = (key, language) => {
  const langKey = language.toLowerCase();
  return dashboardTranslations[langKey]?.[key] || dashboardTranslations.english[key] || key;
};

function speak(text, language) {
  if (!window.speechSynthesis) return;
  const ut = new SpeechSynthesisUtterance(text);
  const langMap = {
    english: 'en-US', telugu: 'te-IN', hindi: 'hi-IN', marathi: 'mr-IN',
    bengali: 'bn-IN', tamil: 'ta-IN', kannada: 'kn-IN', malayalam: 'ml-IN', gujarati: 'gu-IN',
  };
  ut.lang = langMap[language] || 'en-US';
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(ut);
}

const Dashboard = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const { language } = useContext(LanguageContext);
  const [searchHistory, setSearchHistory] = useState([]);
  const [stats, setStats] = useState({
    totalSearches: 0,
    mostCommonSymptoms: [],
    mostCommonConditions: [],
    recommendedMedicines: [],
    conditionFrequency: [],
  });

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem('symptomSearchHistory');
    const history = saved ? JSON.parse(saved) : [];
    setSearchHistory(history);
    calculateStats(history);
  }, []);

  const calculateStats = (history) => {
    if (history.length === 0) {
      setStats({
        totalSearches: 0,
        mostCommonSymptoms: [],
        mostCommonConditions: [],
        recommendedMedicines: [],
        conditionFrequency: [],
      });
      return;
    }

    // Count symptoms
    const symptomCount = {};
    const conditionCount = {};
    const medicineCount = {};
    const conditionsData = {};

    history.forEach(entry => {
      // Count symptoms
      if (entry.input?.symptoms) {
        entry.input.symptoms.forEach(symptom => {
          symptomCount[symptom] = (symptomCount[symptom] || 0) + 1;
        });
      }

      // Count conditions
      if (entry.input?.existing_conditions) {
        entry.input.existing_conditions.forEach(condition => {
          conditionCount[condition] = (conditionCount[condition] || 0) + 1;
        });
      }

      // Count medicines and track condition frequency
      if (entry.result?.recommended_medicines) {
        entry.result.recommended_medicines.forEach(med => {
          medicineCount[med.name] = (medicineCount[med.name] || 0) + 1;
        });
      }

      if (entry.result?.predicted_condition) {
        const cond = entry.result.predicted_condition;
        conditionsData[cond] = (conditionsData[cond] || 0) + 1;
      }
    });

    // Convert to arrays and sort
    const topSymptoms = Object.entries(symptomCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }));

    const topConditions = Object.entries(conditionCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    const topMedicines = Object.entries(medicineCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    const conditionFreq = Object.entries(conditionsData)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, value]) => ({ name, value }));

    setStats({
      totalSearches: history.length,
      mostCommonSymptoms: topSymptoms,
      mostCommonConditions: topConditions,
      recommendedMedicines: topMedicines,
      conditionFrequency: conditionFreq,
    });
  };

  const clearHistory = () => {
    if (confirm(getTranslation('areYouSureClear', language))) {
      localStorage.removeItem('symptomSearchHistory');
      setSearchHistory([]);
      setStats({
        totalSearches: 0,
        mostCommonSymptoms: [],
        mostCommonConditions: [],
        recommendedMedicines: [],
        conditionFrequency: [],
      });
      speak(getTranslation('searchHistoryCleared', language), language);
    }
  };

  const colors = ['#10b981', '#f59e0b', '#3b82f6', '#8b5cf6', '#ec4899', '#ef4444'];

  // Transform chart data to include translated names
  const translateChartData = (data, category) => {
    return data.map(item => ({
      ...item,
      displayName: translateData(item.name, category, language)
    }));
  };

  return (
    <>
      {!isAuthenticated && <FeatureLoginPrompt featureName="the dashboard" />}
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50 pt-24 pb-10">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-green-800 mb-2">{getTranslation('yourHealthDashboard', language)}</h1>
          <p className="text-xl text-gray-700">{getTranslation('trackSymptomSearches', language)}</p>
        </div>

        {/* Quick Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{getTranslation('totalSearches', language)}</h3>
            <p className="text-4xl font-bold mt-2">{stats.totalSearches}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{getTranslation('mostCommonSymptom', language)}</h3>
            <p className="text-2xl font-bold mt-2 capitalize">
              {stats.mostCommonSymptoms.length > 0 ? translateData(stats.mostCommonSymptoms[0].name, 'symptom', language) : '—'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-amber-500 to-amber-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{getTranslation('mostDiagnosed', language)}</h3>
            <p className="text-2xl font-bold mt-2 capitalize">
              {stats.conditionFrequency.length > 0 ? translateData(stats.conditionFrequency[0].name, 'condition', language) : '—'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-lg p-6 shadow-lg">
            <h3 className="text-sm font-semibold opacity-90">{getTranslation('medicinesRecommended', language)}</h3>
            <p className="text-3xl font-bold mt-2">{stats.recommendedMedicines.length}</p>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Symptom Frequency */}
          {stats.mostCommonSymptoms.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{getTranslation('mostCommonSymptoms', language)}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={translateChartData(stats.mostCommonSymptoms, 'symptom')}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayName" angle={-45} textAnchor="end" height={100} />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="count" fill="#10b981" name={getTranslation('frequency', language)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Condition Frequency - Pie Chart */}
          {stats.conditionFrequency.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{getTranslation('diagnosedConditions', language)}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={translateChartData(stats.conditionFrequency, 'condition')}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ displayName, value }) => `${displayName}: ${value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {stats.conditionFrequency.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Medicines */}
          {stats.recommendedMedicines.length > 0 && (
            <div className="bg-white rounded-lg shadow-lg p-6 lg:col-span-2">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">{getTranslation('topRecommendedMedicines', language)}</h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={translateChartData(stats.recommendedMedicines, 'medicine')}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 250, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="displayName" type="category" width={240} fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#3b82f6" name={getTranslation('recommendations', language)} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        {/* Search History */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">{getTranslation('recentSearches', language)}</h2>
            <button
              onClick={clearHistory}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold"
            >
              {getTranslation('clearHistory', language)}
            </button>
          </div>

          {searchHistory.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-600 text-lg">{getTranslation('noSearchHistory', language)}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-100 border-b-2 border-gray-300">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">{getTranslation('date', language)}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">{getTranslation('symptoms', language)}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">{getTranslation('ageGender', language)}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">{getTranslation('predictedCondition', language)}</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">{getTranslation('action', language)}</th>
                  </tr>
                </thead>
                <tbody>
                  {searchHistory.map((entry, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {entry.input?.symptoms?.slice(0, 3).map((s, i) => (
                            <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs font-medium">
                              {translateData(s, 'symptom', language)}
                            </span>
                          ))}
                          {entry.input?.symptoms?.length > 3 && (
                            <span className="text-gray-600 text-xs">+{entry.input.symptoms.length - 3} more</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-700">
                        {entry.input?.age}/{entry.input?.gender?.substring(0, 1).toUpperCase()}
                      </td>
                      <td className="px-4 py-3 text-gray-700 capitalize font-medium">
                        {translateData(entry.result?.predicted_condition, 'condition', language) || 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => speak(`${entry.result?.predicted_condition}: ${entry.result?.home_care_advice?.join(', ')}`, language)}
                          className="text-amber-600 hover:text-amber-800 font-semibold text-sm"
                        >
                          {getTranslation('details', language)}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Health Insights */}
        {searchHistory.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Common Conditions */}
            <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg shadow-lg p-6 border-l-4 border-orange-500">
              <h3 className="text-xl font-bold text-orange-900 mb-4">{getTranslation('yourConditionHistory', language)}</h3>
              {stats.mostCommonConditions.length > 0 ? (
                <ul className="space-y-2">
                  {stats.mostCommonConditions.map((cond, i) => (
                    <li key={i} className="flex items-center justify-between">
                      <span className="text-gray-800 capitalize">{translateData(cond.name, 'condition', language)}</span>
                      <span className="bg-orange-200 text-orange-900 px-3 py-1 rounded-full text-sm font-semibold">
                        {cond.count}x
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-700">{getTranslation('noConditionsRecorded', language)}</p>
              )}
            </div>

            {/* Health Tips */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow-lg p-6 border-l-4 border-green-500">
              <h3 className="text-xl font-bold text-green-900 mb-4">{getTranslation('wellnessTips', language)}</h3>
              <ul className="space-y-2 text-gray-800">
                <li>{getTranslation('stayHydratedWater', language)}</li>
                <li>{getTranslation('getQualitySleep', language)}</li>
                <li>{getTranslation('exerciseRegularly', language)}</li>
                <li>{getTranslation('maintainBalancedDiet', language)}</li>
                <li>{getTranslation('washHandsFrequently', language)}</li>
                <li>{getTranslation('consultDoctorPersistent', language)}</li>
              </ul>
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  );
};

export default Dashboard;
