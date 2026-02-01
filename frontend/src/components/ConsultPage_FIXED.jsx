import React, { useState, useEffect, useContext } from 'react';
import { LanguageContext } from '../main';
import { t } from '../utils/translations';
import { playTTS, stopAllTTS } from '../utils/tts';
import './ConsultPage.css';

// Translation mapping for dropdown values (states, cities, specializations, and languages)
const translationMap = {
  english: {
    // Indian States
    'Andhra Pradesh': 'Andhra Pradesh', 'Arunachal Pradesh': 'Arunachal Pradesh', 'Assam': 'Assam', 'Bihar': 'Bihar', 'Chhattisgarh': 'Chhattisgarh', 'Goa': 'Goa', 'Gujarat': 'Gujarat', 'Haryana': 'Haryana', 'Himachal Pradesh': 'Himachal Pradesh', 'Jharkhand': 'Jharkhand', 'Karnataka': 'Karnataka', 'Kerala': 'Kerala', 'Madhya Pradesh': 'Madhya Pradesh', 'Maharashtra': 'Maharashtra', 'Manipur': 'Manipur', 'Meghalaya': 'Meghalaya', 'Mizoram': 'Mizoram', 'Nagaland': 'Nagaland', 'Odisha': 'Odisha', 'Punjab': 'Punjab', 'Rajasthan': 'Rajasthan', 'Sikkim': 'Sikkim', 'Tamil Nadu': 'Tamil Nadu', 'Telangana': 'Telangana', 'Tripura': 'Tripura', 'Uttar Pradesh': 'Uttar Pradesh', 'Uttarakhand': 'Uttarakhand', 'West Bengal': 'West Bengal', 'Bangalore': 'Bangalore', 'Delhi': 'Delhi', 'Mumbai': 'Mumbai', 'Hyderabad': 'Hyderabad', 'Chennai': 'Chennai', 'Pune': 'Pune', 'Kolkata': 'Kolkata', 'Ahmedabad': 'Ahmedabad', 'Jaipur': 'Jaipur', 'Lucknow': 'Lucknow', 'Chandigarh': 'Chandigarh', 'Kochi': 'Kochi', 'Visakhapatnam': 'Visakhapatnam', 'Surat': 'Surat', 'Indore': 'Indore', 'Nagpur': 'Nagpur', 'Bhopal': 'Bhopal', 'Thiruvananthapuram': 'Thiruvananthapuram', 'Coimbatore': 'Coimbatore', 'Vadodara': 'Vadodara', 'Cardiology': 'Cardiology', 'Ophthalmology': 'Ophthalmology', 'Psychiatry': 'Psychiatry', 'General Medicine': 'General Medicine', 'ENT': 'ENT (Ear, Nose, Throat)', 'Dermatology': 'Dermatology', 'Gynecology': 'Gynecology', 'Orthopedics': 'Orthopedics', 'Pediatrics': 'Pediatrics', 'Neurology': 'Neurology', 'Malayalam': 'Malayalam', 'Tamil': 'Tamil', 'Marathi': 'Marathi', 'Bengali': 'Bengali', 'Kannada': 'Kannada', 'Hindi': 'Hindi', 'Telugu': 'Telugu', 'English': 'English',
  },
  telugu: {
    'Andhra Pradesh': 'ఆంధ్ర ప్రదేశ్', 'Arunachal Pradesh': 'అరుణాచల్ ప్రదేశ్', 'Assam': 'అసోమ్', 'Bihar': 'బిహార్', 'Chhattisgarh': 'చత్తీస్‌గఢ్', 'Goa': 'గోవా', 'Gujarat': 'గుజరాత్', 'Haryana': 'హరియాణా', 'Himachal Pradesh': 'హిమాచల్ ప్రదేశ్', 'Jharkhand': 'ఝార్‌ఖండ్', 'Karnataka': 'కర్నాటక', 'Kerala': 'కేరళ', 'Madhya Pradesh': 'మధ్య ప్రదేశ్', 'Maharashtra': 'మహారాష్ట్ర', 'Manipur': 'మణిపూర్', 'Meghalaya': 'మేఘాలయ', 'Mizoram': 'మిజోరమ్', 'Nagaland': 'నాగాలాండ్', 'Odisha': 'ఒడిసా', 'Punjab': 'పంజాబ్', 'Rajasthan': 'రాజస్థాన్', 'Sikkim': 'సిక్కిం', 'Tamil Nadu': 'తమిళ నాడు', 'Telangana': 'తెలంగాణ', 'Tripura': 'త్రిపుర', 'Uttar Pradesh': 'ఉత్తర ప్రదేశ్', 'Uttarakhand': 'ఉత్తరాఖండ్', 'West Bengal': 'పశ్చిమ బెంగాల్', 'Bangalore': 'బెంగళూరు', 'Delhi': 'ఢిల్లీ', 'Mumbai': 'ముంబై', 'Hyderabad': 'హైదరాబాద్', 'Chennai': 'చెన్నై', 'Pune': 'పూణే', 'Kolkata': 'కోల్‌కతా', 'Ahmedabad': 'అహ్‌మదాబాద్', 'Jaipur': 'జయపూర్', 'Lucknow': 'లక్‌నో', 'Chandigarh': 'చండిగఢ్', 'Kochi': 'కోచ్', 'Visakhapatnam': 'విశాఖపట్నం', 'Surat': 'సూరత్', 'Indore': 'ఇందూర్', 'Nagpur': 'నాగపూర్', 'Bhopal': 'భోపాల్', 'Thiruvananthapuram': 'తిరువనంతపురం', 'Coimbatore': 'కోయంబటూర్', 'Vadodara': 'వడోదర', 'Cardiology': 'కార్డియోలజీ', 'Ophthalmology': 'నేత్ర చికిత్స', 'Psychiatry': 'మానసిక చికిత్స', 'General Medicine': 'సాధారణ medicine', 'ENT': 'ఇएన్టీ (చెవి, ముక్కు, గొంతు)', 'Dermatology': 'చర్మ చికిత్స', 'Gynecology': 'స్త్రీ చికిత్స', 'Orthopedics': 'ఎముక చికిత్స', 'Pediatrics': 'శిశువల చికిత్స', 'Neurology': 'నాడీ చికిత్స', 'Malayalam': 'మలయాళం', 'Tamil': 'తమిళం', 'Marathi': 'మరాఠీ', 'Bengali': 'బెంగాలీ', 'Kannada': 'కన్నడ', 'Hindi': 'హిందీ', 'Telugu': 'తెలుగు', 'English': 'ఇంగ్లీష్',
  },
  hindi: {
    'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'असम', 'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगढ़', 'Goa': 'गोवा', 'Gujarat': 'गुजरात', 'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड', 'Karnataka': 'कर्नाटक', 'Kerala': 'केरल', 'Madhya Pradesh': 'मध्य प्रदेश', 'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपुर', 'Meghalaya': 'मेघालय', 'Mizoram': 'मिजोरम', 'Nagaland': 'नागालैंड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब', 'Rajasthan': 'राजस्थान', 'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिल नाडु', 'Telangana': 'तेलंगाना', 'Tripura': 'त्रिपुरा', 'Uttar Pradesh': 'उत्तर प्रदेश', 'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल', 'Bangalore': 'बेंगलुरु', 'Delhi': 'दिल्ली', 'Mumbai': 'मुंबई', 'Hyderabad': 'हैदराबाद', 'Chennai': 'चेन्नई', 'Pune': 'पुणे', 'Kolkata': 'कोलकाता', 'Ahmedabad': 'अहमदाबाद', 'Jaipur': 'जयपुर', 'Lucknow': 'लखनऊ', 'Chandigarh': 'चंडीगढ़', 'Kochi': 'कोची', 'Visakhapatnam': 'विशाखापत्तनम', 'Surat': 'सूरत', 'Indore': 'इंदौर', 'Nagpur': 'नागपुर', 'Bhopal': 'भोपाल', 'Thiruvananthapuram': 'तिरुवनंतपुरम', 'Coimbatore': 'कोयंबटूर', 'Vadodara': 'वडोदरा', 'Cardiology': 'कार्डियोलॉजी', 'Ophthalmology': 'नेत्र विज्ञान', 'Psychiatry': 'मनोविज्ञान', 'General Medicine': 'सामान्य चिकित्सा', 'ENT': 'कान, नाक, गला', 'Dermatology': 'त्वचा विज्ञान', 'Gynecology': 'महिला चिकित्सा', 'Orthopedics': 'हड्डी चिकित्सा', 'Pediatrics': 'बाल चिकित्सा', 'Neurology': 'तंत्रिका विज्ञान', 'Malayalam': 'मलयालम', 'Tamil': 'तमिल', 'Marathi': 'मराठी', 'Bengali': 'बंगाली', 'Kannada': 'कन्नड़', 'Hindi': 'हिंदी', 'Telugu': 'तेलुगु', 'English': 'अंग्रेजी',
  },
  marathi: {
    'Andhra Pradesh': 'आंध्र प्रदेश', 'Arunachal Pradesh': 'अरुणाचल प्रदेश', 'Assam': 'असम', 'Bihar': 'बिहार', 'Chhattisgarh': 'छत्तीसगड़', 'Goa': 'गोवा', 'Gujarat': 'गुजरात', 'Haryana': 'हरियाणा', 'Himachal Pradesh': 'हिमाचल प्रदेश', 'Jharkhand': 'झारखंड', 'Karnataka': 'कर्नाटक', 'Kerala': 'केरळ', 'Madhya Pradesh': 'मध्य प्रदेश', 'Maharashtra': 'महाराष्ट्र', 'Manipur': 'मणिपूर', 'Meghalaya': 'मेघालय', 'Mizoram': 'मिजोरम', 'Nagaland': 'नागालँड', 'Odisha': 'ओडिशा', 'Punjab': 'पंजाब', 'Rajasthan': 'राजस्थान', 'Sikkim': 'सिक्किम', 'Tamil Nadu': 'तमिळनाडु', 'Telangana': 'तेलंगाना', 'Tripura': 'त्रिपुरा', 'Uttar Pradesh': 'उत्तर प्रदेश', 'Uttarakhand': 'उत्तराखंड', 'West Bengal': 'पश्चिम बंगाल', 'Bangalore': 'बेंगळुरु', 'Delhi': 'दिल्ली', 'Mumbai': 'मुंबई', 'Hyderabad': 'हैदराबाद', 'Chennai': 'चेन्नई', 'Pune': 'पुणे', 'Kolkata': 'कोलकाता', 'Ahmedabad': 'अहमदाबाद', 'Jaipur': 'जयपुर', 'Lucknow': 'लखनऊ', 'Chandigarh': 'चंडीगड़', 'Kochi': 'कोची', 'Visakhapatnam': 'विशाखापत्तनम', 'Surat': 'सूरत', 'Indore': 'इंदौर', 'Nagpur': 'नागपुर', 'Bhopal': 'भोपाल', 'Thiruvananthapuram': 'तिरुवनंतपुरम', 'Coimbatore': 'कोयंबटूर', 'Vadodara': 'वडोदरा', 'Cardiology': 'कार्डिओलॉजी', 'Ophthalmology': 'नेत्ररोग विज्ञान', 'Psychiatry': 'मानसिक रोग विज्ञान', 'General Medicine': 'सामान्य औषध', 'ENT': 'कान, नाक, घसा', 'Dermatology': 'त्वचा रोग विज्ञान', 'Gynecology': 'स्त्री रोग विज्ञान', 'Orthopedics': 'हाडपट्टी विज्ञान', 'Pediatrics': 'बाल रोग विज्ञान', 'Neurology': 'तंत्रिका रोग विज्ञान', 'Malayalam': 'मलयालम', 'Tamil': 'तमिळ', 'Marathi': 'मराठी', 'Bengali': 'बंगाली', 'Kannada': 'कन्नड', 'Hindi': 'हिंदी', 'Telugu': 'तेलुगु', 'English': 'इंग्रजी',
  },
  bengali: {
    'Andhra Pradesh': 'আন্ধ্র প্রদেশ', 'Arunachal Pradesh': 'অরুণাচল প্রদেশ', 'Assam': 'অসম', 'Bihar': 'বিহার', 'Chhattisgarh': 'ছত্তীসগড়', 'Goa': 'গোয়া', 'Gujarat': 'গুজরাট', 'Haryana': 'হরিয়ানা', 'Himachal Pradesh': 'হিমাচল প্রদেশ', 'Jharkhand': 'ঝারখন্ড', 'Karnataka': 'কর্নাটক', 'Kerala': 'কেরল', 'Madhya Pradesh': 'মধ্য প্রদেশ', 'Maharashtra': 'মহারাষ্ট্র', 'Manipur': 'মণিপুর', 'Meghalaya': 'মেঘালয়', 'Mizoram': 'মিজোরাম', 'Nagaland': 'নাগাল্যান্ড', 'Odisha': 'ওডিশা', 'Punjab': 'পাঞ্জাব', 'Rajasthan': 'রাজস্থান', 'Sikkim': 'সিকিম', 'Tamil Nadu': 'তামিল নাডু', 'Telangana': 'তেলঙ্গানা', 'Tripura': 'ত্রিপুরা', 'Uttar Pradesh': 'উত্तর প্রদেশ', 'Uttarakhand': 'উত্তরাখন্ড', 'West Bengal': 'পশ্চিম বঙ্গ', 'Bangalore': 'ব্যাঙ্গালোর', 'Delhi': 'দিল্লী', 'Mumbai': 'মুম্বই', 'Hyderabad': 'হায়দরাবাদ', 'Chennai': 'চেন্নাই', 'Pune': 'পুণে', 'Kolkata': 'কলকাতা', 'Ahmedabad': 'আহমেদাবাদ', 'Jaipur': 'জয়পুর', 'Lucknow': 'লখনৌ', 'Chandigarh': 'চণ্ডীগড়', 'Kochi': 'কোচি', 'Visakhapatnam': 'বিশাখাপত্তনম', 'Surat': 'সুরাট', 'Indore': 'ইন্দোর', 'Nagpur': 'নাগপুর', 'Bhopal': 'ভোপাল', 'Thiruvananthapuram': 'তিরুবনন্তপুরম', 'Coimbatore': 'কোয়েম্বাটোর', 'Vadodara': 'বড়োদরা', 'Cardiology': 'কার্ডিওলজি', 'Ophthalmology': 'চক্ষু বিজ্ঞান', 'Psychiatry': 'মনোরোগ বিজ্ঞান', 'General Medicine': 'সাধারণ চিকিৎসা', 'ENT': 'কান, নাক, গলা', 'Dermatology': 'চর্মরোগ বিজ্ঞান', 'Gynecology': 'নারী রোগ বিজ্ঞান', 'Orthopedics': 'অর্থোপেডিক্স', 'Pediatrics': 'শিশু চিকিৎসা', 'Neurology': 'স্নায়ুতন্ত্র বিজ্ঞান', 'Malayalam': 'মালয়ালম', 'Tamil': 'তামিল', 'Marathi': 'মারাঠি', 'Bengali': 'বাংলা', 'Kannada': 'কন্নড়', 'Hindi': 'হিন্দি', 'Telugu': 'তেলুগু', 'English': 'ইংরেজি',
  },
  tamil: {
    'Andhra Pradesh': 'ஆந்திர பிரதேசம்', 'Arunachal Pradesh': 'அருணாசல பிரதேசம்', 'Assam': 'அசாம்', 'Bihar': 'பீஹார்', 'Chhattisgarh': 'சத்தீசுகர்', 'Goa': 'கோவா', 'Gujarat': 'குஜராத்', 'Haryana': 'ஹரியாணா', 'Himachal Pradesh': 'இமாச்சல் பிரதேசம்', 'Jharkhand': 'ஜார்கண்ட்', 'Karnataka': 'கர்நாடகா', 'Kerala': 'கேரளா', 'Madhya Pradesh': 'மத்திய பிரதேசம்', 'Maharashtra': 'மகாராஷ்ட்ர', 'Manipur': 'மணிப்பூர்', 'Meghalaya': 'மேகாலயா', 'Mizoram': 'மிஜோரம்', 'Nagaland': 'நாகாலாந்து', 'Odisha': 'ஒடிசா', 'Punjab': 'பஞ்சாப்', 'Rajasthan': 'ராஜஸ்தான்', 'Sikkim': 'சிக்கிம்', 'Tamil Nadu': 'தமிழ் நாடு', 'Telangana': 'தெலங்கானா', 'Tripura': 'திரிபுரா', 'Uttar Pradesh': 'உத்தர பிரதேசம்', 'Uttarakhand': 'உத்தரகாண்ட்', 'West Bengal': 'மேற்கு வங்கம்', 'Bangalore': 'பெங்களூர்', 'Delhi': 'தில்லி', 'Mumbai': 'மும்பை', 'Hyderabad': 'ஹைதராபாத்', 'Chennai': 'சென்னை', 'Pune': 'பூனே', 'Kolkata': 'கொல்கத்தா', 'Ahmedabad': 'அஹ்மதாபாத்', 'Jaipur': 'ஜெய்ப்பூர்', 'Lucknow': 'லக்னௌ', 'Chandigarh': 'சண்டிகர்', 'Kochi': 'கோச்சி', 'Visakhapatnam': 'விசாகபட்டனம்', 'Surat': 'சூரத்', 'Indore': 'இந்தோர்', 'Nagpur': 'நாகபூர்', 'Bhopal': 'போபால்', 'Thiruvananthapuram': 'திருவனந்தபுரம்', 'Coimbatore': 'கோயம்பத்தூர்', 'Vadodara': 'வடோதரா', 'Cardiology': 'இருதய சிகிச்சை', 'Ophthalmology': 'கண் மருத்துவம்', 'Psychiatry': 'மன சிகிச்சை', 'General Medicine': 'பொது மருத்துவம்', 'ENT': 'காது, மூக்கு, தொண்டை', 'Dermatology': 'தோல் மருத்துவம்', 'Gynecology': 'பெண்ணாய உறுப்பு மருத்துவம்', 'Orthopedics': 'எலும்பு சிகிச்சை', 'Pediatrics': 'குழந்தை மருத்துவம்', 'Neurology': 'நரம்பு மருத்துவம்', 'Malayalam': 'മലയാളം', 'Tamil': 'தமிழ்', 'Marathi': 'மராठी', 'Bengali': 'வங்கபிரி', 'Kannada': 'கன்னடம்', 'Hindi': 'இந்தி', 'Telugu': 'తెలుగు', 'English': 'ஆங்கிலம்',
  },
  kannada: {
    'Andhra Pradesh': 'ಆಂಧ್ರ ಪ್ರದೇಶ', 'Arunachal Pradesh': 'ಅರುಣಾಚಲ ಪ್ರದೇಶ', 'Assam': 'ಅಸ್ಸಾಂ', 'Bihar': 'ಬಿಹಾರ', 'Chhattisgarh': 'ಛತ್ತೀಸ್ಗಢ', 'Goa': 'ಗೋವಾ', 'Gujarat': 'ಗುಜರಾತ', 'Haryana': 'ಹರಿಯಾಣ', 'Himachal Pradesh': 'ಹಿಮಾಚಲ ಪ್ರದೇಶ', 'Jharkhand': 'ಝಾರಖಂಡ', 'Karnataka': 'ಕರ್ನಾಟಕ', 'Kerala': 'ಕೇರಳ', 'Madhya Pradesh': 'ಮಧ್ಯ ಪ್ರದೇಶ', 'Maharashtra': 'ಮಹಾರಾಷ್ಟ್ರ', 'Manipur': 'ಮಣಿಪುರ', 'Meghalaya': 'ಮೇಘಾಲಯ', 'Mizoram': 'ಮಿಜೋರಾಮ', 'Nagaland': 'ನಾಗಾಲ್ಯಾಂಡ್', 'Odisha': 'ಓಡಿಶಾ', 'Punjab': 'ಪಂಜಾಬ್', 'Rajasthan': 'ರಾಜಸ್ಥಾನ', 'Sikkim': 'ಸಿಕ್ಕಿಮ್', 'Tamil Nadu': 'ತಮಿಳುನಾಡು', 'Telangana': 'ತೆಲಂಗಾಣ', 'Tripura': 'ತ್ರಿಪುರ', 'Uttar Pradesh': 'ಉತ್ತರ ಪ್ರದೇಶ', 'Uttarakhand': 'ಉತ್ತರಾಖಂಡ', 'West Bengal': 'ಪಶ್ಚಿಮ ಬಂಗಾಳ', 'Bangalore': 'ಬೆಂಗಳೂರು', 'Delhi': 'ದಿಲ್ಲಿ', 'Mumbai': 'ಮುಂಬೈ', 'Hyderabad': 'ಹೈದರಾಬಾದ್', 'Chennai': 'ಚೆನ್ನೈ', 'Pune': 'ಪುಣೆ', 'Kolkata': 'ಕೋಲ್ಕತ್ತ', 'Ahmedabad': 'ಅಹ್ಮದಾಬಾದ್', 'Jaipur': 'ಜಯಪುರ್', 'Lucknow': 'ಲಕ್ನೌ', 'Chandigarh': 'ಚಂಡೀಗಡ', 'Kochi': 'ಕೋಚ್', 'Visakhapatnam': 'ವಿಶಾಖಪಟ್ನಂ', 'Surat': 'ಸೂರತ್', 'Indore': 'ಇಂದೋರ್', 'Nagpur': 'ನಾಗಪುರ', 'Bhopal': 'ಭೋಪಾಲ್', 'Thiruvananthapuram': 'ತಿರುವನಂತಪುರಂ', 'Coimbatore': 'ಕೋಯಂಬಟೂರ್', 'Vadodara': 'ವಡೋದರ', 'Cardiology': 'ಹೃದಯ ರೋಗ ತಜ್ಞಾನ', 'Ophthalmology': 'ಕಣ್ಣಿನ ವಿಜ್ಞಾನ', 'Psychiatry': 'ಮಾನಸಿಕ ರೋಗ ವಿಜ್ಞಾನ', 'General Medicine': 'ಸಾಮಾನ್ಯ ಔಷಧ', 'ENT': 'ಕಿವಿ, ಮೂಗು, ಗಂಟು', 'Dermatology': 'ತ್ವಚೆ ರೋಗ ವಿಜ್ಞಾನ', 'Gynecology': 'ಸ್ತ್ರೀ ರೋಗ ವಿಜ್ಞಾನ', 'Orthopedics': 'ಮೆದುಳಿನ ರೋಗ ವಿಜ್ಞಾನ', 'Pediatrics': 'ಶಿಶು ರೋಗ ವಿಜ್ಞಾನ', 'Neurology': 'ನರ ರೋಗ ವಿಜ್ಞಾನ', 'Malayalam': 'മലയാളം', 'Tamil': 'தமிழ்', 'Marathi': 'मराठी', 'Bengali': 'বাংলা', 'Kannada': 'ಕನ್ನಡ', 'Hindi': 'हिंदी', 'Telugu': 'తెలుగు', 'English': 'English',
  },
  malayalam: {
    'Andhra Pradesh': 'ആന്ധ്ര പ്രദേശ്', 'Arunachal Pradesh': 'അരുണാചല പ്രദേശ്', 'Assam': 'അസ്സാം', 'Bihar': 'ബിഹാർ', 'Chhattisgarh': 'ഛത്തീസ്ഗഡ്', 'Goa': 'ഗോവ', 'Gujarat': 'ഗുജറാത്', 'Haryana': 'ഹരിയാണ', 'Himachal Pradesh': 'ഹിമാചൽ പ്രദേശ്', 'Jharkhand': 'ഝാർകണ്ഡ്', 'Karnataka': 'കർണാടക', 'Kerala': 'കേരളം', 'Madhya Pradesh': 'മധ്യ പ്രദേശ്', 'Maharashtra': 'മഹാരാഷ്ട്ര', 'Manipur': 'മണിപ്പൂർ', 'Meghalaya': 'മേഘാലയ', 'Mizoram': 'മിജോറാം', 'Nagaland': 'നാഗാലാൻഡ്', 'Odisha': 'ഒഡീഷ', 'Punjab': 'പഞ്ജാബ്', 'Rajasthan': 'രാജസ്ഥാൻ', 'Sikkim': 'സിക്കിം', 'Tamil Nadu': 'തമിഴ്നാട്', 'Telangana': 'തെലങ്കാണ', 'Tripura': 'ത്രിപുര', 'Uttar Pradesh': 'ഉത്തർ പ്രദേശ്', 'Uttarakhand': 'ഉത്തരാഖണ്ഡ്', 'West Bengal': 'പശ്ചിമ ബംഗാൾ', 'Bangalore': 'ബെംഗളൂരു', 'Delhi': 'ഡെൽഹി', 'Mumbai': 'മുംബൈ', 'Hyderabad': 'ഹൈദരാബാദ്', 'Chennai': 'ചെന്നൈ', 'Pune': 'പുണെ', 'Kolkata': 'കോൽക്കത്ത', 'Ahmedabad': 'അഹമ്മദാബാദ്', 'Jaipur': 'ജയപുർ', 'Lucknow': 'ലഖ്നൌ', 'Chandigarh': 'ചണ്ഡിഗഢ്', 'Kochi': 'കോച്ചി', 'Visakhapatnam': 'വിശാഖപട്ടണം', 'Surat': 'സൂരത്', 'Indore': 'ഇന്ദൗർ', 'Nagpur': 'നാഗപുർ', 'Bhopal': 'ഭോപാൽ', 'Thiruvananthapuram': 'തിരുവനന്തപുരം', 'Coimbatore': 'കോയംബത്തൂർ', 'Vadodara': 'വടോദര', 'Cardiology': 'ഹൃദയ രോഗ വിദ്യ', 'Ophthalmology': 'കണ്ണ് രോഗ വിദ്യ', 'Psychiatry': 'മാനസിക ആരോഗ്യ വിദ്യ', 'General Medicine': 'സാധാരണ വൈദ്യശാസ്ത്രം', 'ENT': 'ചെവി, മൂക്ക്, കഴുത്ത്', 'Dermatology': 'ചര്‍മ രോഗ വിദ്യ', 'Gynecology': 'സ്ത്രീ രോഗ വിദ്യ', 'Orthopedics': 'അസ്ഥി ശസ്ത്രം', 'Pediatrics': 'കുട്ടികളുടെ ആരോഗ്യ വിദ്യ', 'Neurology': 'നാഡീ വിദ്യ', 'Malayalam': 'മലയാളം', 'Tamil': 'തമിഴ്', 'Marathi': 'മരാഠി', 'Bengali': 'ബംഗാളി', 'Kannada': 'കന്നഡ', 'Hindi': 'ഹിന്ദി', 'Telugu': 'തെലുഗു', 'English': 'ഇംഗ്ലീഷ്',
  },
  gujarati: {
    'Andhra Pradesh': 'આંધ્ર પ્રદેશ', 'Arunachal Pradesh': 'અરુણાચલ પ્રદેશ', 'Assam': 'આસામ', 'Bihar': 'બિહાર', 'Chhattisgarh': 'છત્તીસગઢ', 'Goa': 'ગોવા', 'Gujarat': 'ગુજરાત', 'Haryana': 'હરિયાણા', 'Himachal Pradesh': 'હિમાચલ પ્રદેશ', 'Jharkhand': 'ઝારખંડ', 'Karnataka': 'કર્ણાટક', 'Kerala': 'કેરલ', 'Madhya Pradesh': 'મધ્ય પ્રદેશ', 'Maharashtra': 'મહારાષ્ટ્ર', 'Manipur': 'મણિપુર', 'Meghalaya': 'મેઘાલય', 'Mizoram': 'મિજોરમ', 'Nagaland': 'નાગાલેન્ડ', 'Odisha': 'ઓડિશા', 'Punjab': 'પંજાબ', 'Rajasthan': 'રાજસ્થાન', 'Sikkim': 'સિક્કિમ', 'Tamil Nadu': 'તમિલ નાડુ', 'Telangana': 'તેલંગાણા', 'Tripura': 'ત્રિપુરા', 'Uttar Pradesh': 'ઉત્તર પ્રદેશ', 'Uttarakhand': 'ઉત્તરાખંડ', 'West Bengal': 'પશ્ચિમ બંગાલ', 'Bangalore': 'બેંગલુરુ', 'Delhi': 'દિલ્લી', 'Mumbai': 'મુંબઈ', 'Hyderabad': 'હૈદરાબાદ', 'Chennai': 'ચેન્નઈ', 'Pune': 'પુણે', 'Kolkata': 'કોલકાતા', 'Ahmedabad': 'અમદાવાદ', 'Jaipur': 'જયપુર', 'Lucknow': 'લખનઉ', 'Chandigarh': 'ચંડીગઢ', 'Kochi': 'કોચી', 'Visakhapatnam': 'વિશાખાપટ્નમ', 'Surat': 'સુરત', 'Indore': 'ઇંદૌર', 'Nagpur': 'નાગપુર', 'Bhopal': 'ભોપાલ', 'Thiruvananthapuram': 'તિરુવનંતપુરમ', 'Coimbatore': 'કોયંબટૂર', 'Vadodara': 'વડોદરા', 'Cardiology': 'હૃદય રોગ પણ્ય', 'Ophthalmology': 'આંખ ચિકિત્સા', 'Psychiatry': 'માનસિક ચિકિત્સા', 'General Medicine': 'સામાન્ય દવા', 'ENT': 'કાન, નાક, ગળો', 'Dermatology': 'ત્વચા ચિકિત્સા', 'Gynecology': 'સ્ત્રી ચિકિત્સા', 'Orthopedics': 'હાડકાણ ચિકિત્સા', 'Pediatrics': 'બાળક ચિકિત્સા', 'Neurology': 'નર્વસ સિસ્ટમ ચિકિત્સા', 'Malayalam': 'માલયાલમ', 'Tamil': 'તમિલ', 'Marathi': 'મરાઠી', 'Bengali': 'બંગાલી', 'Kannada': 'કન્નડ', 'Hindi': 'હિંદી', 'Telugu': 'તેલુગુ', 'English': 'અંગ્રેજી',
  },
};

// Helper function to translate dropdown values
const translateValue = (value, language) => {
  const langKey = language.toLowerCase();
  return translationMap[langKey]?.[value] || value;
};

const ConsultPage = () => {
  const { language } = useContext(LanguageContext);
  const [isMuted, setIsMuted] = useState(false);
  
  // State management
  const [tab, setTab] = useState('book'); // book, history, reminders
  const [step, setStep] = useState('search'); // search, results, booking
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  
  // Search form
  const [searchOptions, setSearchOptions] = useState({
    states: [],
    cities: [],
    localities: [],
    specializations: [],
    native_languages: [],
    languages: []
  });
  
  const [searchForm, setSearchForm] = useState({
    state: '',
    city: '',
    locality: '',
    specialization: '',
    native_language: '',
    languages_known: ''
  });
  
  // Results
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  
  // Booking form
  const [bookingForm, setBookingForm] = useState({
    patient_name: '',
    patient_email: '',
    patient_phone: '',
    appointment_date: '',
    appointment_time: '',
    notes: ''
  });

  // Appointment History
  const [appointmentHistory, setAppointmentHistory] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  
  // Load search options and appointments on mount
  useEffect(() => {
    loadSearchOptions();
    loadAppointments();
  }, []);
  
  const loadSearchOptions = async () => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      console.log('📍 Fetching search options from:', `${apiBase}/api/appointments/search/options`);
      const response = await fetch(`${apiBase}/api/appointments/search/options`);
      
      console.log('📊 Response status:', response.status);
      if (!response.ok) {
        throw new Error(`Failed to load search options: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('✅ Search options loaded:', data);
      if (data.success) {
        setSearchOptions(data.options);
        console.log('✅ Search options set in state:', data.options);
      }
    } catch (err) {
      console.error('❌ Error loading search options:', err);
      setError('Failed to load doctor information');
    }
  };

  const loadAppointments = async () => {
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      
      // Fetch all appointments
      const allResponse = await fetch(`${apiBase}/api/appointments/my-appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setAppointmentHistory(allData.appointments || []);
      }
      
      // Fetch upcoming appointments
      const upcomingResponse = await fetch(`${apiBase}/api/appointments/upcoming-appointments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('access_token')}` }
      });
      
      if (upcomingResponse.ok) {
        const upcomingData = await upcomingResponse.json();
        setUpcomingAppointments(upcomingData.appointments || []);
      }
    } catch (err) {
      console.error('❌ Error loading appointments:', err);
    }
  };

  const cancelAppointment = async (appointment) => {
    if (!window.confirm(`Cancel appointment with Dr. ${appointment.doctor_name} on ${new Date(appointment.appointment_date).toLocaleDateString()}?`)) {
      return;
    }
    
    try {
      setLoading(true);
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      console.log('🗑️ Cancelling appointment:', appointment.id);
      
      const response = await fetch(`${apiBase}/api/appointments/appointment/${appointment.id}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('📤 Cancel response:', response.status, data);
      
      if (response.ok) {
        setMessage(`✅ ${data.message}`);
        if (!isMuted) playTTS(data.message, language);
        
        // Reload appointments to refresh the list
        await loadAppointments();
        
        // Clear message after 2 seconds
        setTimeout(() => setMessage(''), 2000);
      } else {
        const errorMsg = data.detail || 'Failed to cancel appointment';
        throw new Error(errorMsg);
      }
    } catch (error) {
      console.error('❌ Error cancelling appointment:', error);
      setError(`Failed to cancel: ${error.message}`);
      if (!isMuted) playTTS(`Error: ${error.message}`, language);
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearchChange = (e) => {
    const { name, value } = e.target;
    setSearchForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleSearch = async (e) => {
    e.preventDefault();
    
    // Validate at least one criterion
    if (!Object.values(searchForm).some(val => val)) {
      setError('Please select at least one search criterion');
      if (!isMuted) playTTS('Please select at least one search criterion', language);
      return;
    }
    
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const response = await fetch(`${apiBase}/api/appointments/search`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(searchForm)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.detail || 'Search failed');
      }
      
      if (data.doctors && data.doctors.length > 0) {
        setDoctors(data.doctors);
        setStep('results');
        setMessage(`Found ${data.doctors.length} matching doctors`);
        if (!isMuted) playTTS(`Found ${data.doctors.length} matching doctors`, language);
      } else {
        setError('No doctors found matching your criteria');
        if (!isMuted) playTTS('No doctors found', language);
      }
    } catch (err) {
      console.error('Search error:', err);
      setError(err.message || 'Error searching doctors');
      if (!isMuted) playTTS('Error searching doctors', language);
    } finally {
      setLoading(false);
    }
  };
  
  const handleBookAppointment = (doctor) => {
    setSelectedDoctor(doctor);
    setStep('booking');
    setBookingForm({
      patient_name: '',
      patient_email: '',
      patient_phone: '',
      appointment_date: '',
      appointment_time: '',
      notes: ''
    });
    if (!isMuted) playTTS(`Booking appointment with ${doctor.name}`, language);
  };
  
  const handleBookingChange = (e) => {
    const { name, value } = e.target;
    setBookingForm(prev => ({ ...prev, [name]: value }));
  };
  
  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!bookingForm.patient_name || !bookingForm.patient_email || !bookingForm.patient_phone ||
        !bookingForm.appointment_date || !bookingForm.appointment_time) {
      setError('Please fill all required fields');
      if (!isMuted) playTTS('Please fill all required fields', language);
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(bookingForm.patient_email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Validate phone format
    if (bookingForm.patient_phone.length < 10) {
      setError('Please enter a valid phone number');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const apiBase = window.__API_BASE__ || 'http://localhost:8000';
      const token = localStorage.getItem('access_token');
      
      const payload = {
        doctor_id: selectedDoctor.employee_id,
        patient_name: bookingForm.patient_name.trim(),
        patient_email: bookingForm.patient_email.trim(),
        patient_phone: bookingForm.patient_phone.trim(),
        appointment_date: bookingForm.appointment_date,
        appointment_time: bookingForm.appointment_time,
        notes: bookingForm.notes || null
      };
      
      console.log('📤 Sending appointment booking:', payload);
      
      const response = await fetch(`${apiBase}/api/appointments/book`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      const data = await response.json();
      console.log('📋 Booking response:', response.status, data);
      
      if (!response.ok) {
        let errorMsg = 'Booking failed';
        if (data.detail) {
          errorMsg = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
        } else if (data.message) {
          errorMsg = data.message;
        }
        throw new Error(errorMsg);
      }
      
      if (data.success) {
        setMessage(`✅ Appointment booked successfully! ID: ${data.appointment_id}`);
        if (!isMuted) playTTS('Appointment booked successfully', language);
        
        // Reload appointments
        loadAppointments();
        
        // Reset and go back to search
        setTimeout(() => {
          setStep('search');
          setSearchForm({
            state: '',
            city: '',
            locality: '',
            specialization: '',
            native_language: '',
            languages_known: ''
          });
          setDoctors([]);
          setSelectedDoctor(null);
          setError('');
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError(err.message || 'Error booking appointment');
      if (!isMuted) playTTS('Error booking appointment', language);
    } finally {
      setLoading(false);
    }
  };
  
  const handleMuteToggle = () => {
    if (!isMuted) {
      stopAllTTS();
    }
    setIsMuted(!isMuted);
    if (isMuted) {
      playTTS('Voice enabled', language);
    }
  };
  
  return (
    <div className="consult-page">
      {/* Header */}
      <div className="consult-header">
        <div className="header-content">
          <h1>{t('doctorConsultation', language)}</h1>
          <p>{t('bookAppointmentsManageConsultations', language)}</p>
        </div>
        <button
          onClick={handleMuteToggle}
          className={`mute-btn ${isMuted ? 'muted' : ''}`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? '🔇' : '🔊'}
        </button>
      </div>
      
      {/* Tabs */}
      <div className="section" style={{ marginBottom: '30px' }}>
        <div className="tabs">
          <button
            className={`tab-btn ${tab === 'book' ? 'active' : ''}`}
            onClick={() => {
              setTab('book');
              setStep('search');
              setError('');
              setMessage('');
            }}
          >
            📅 {t('bookAppointmentTab', language)}
          </button>
          <button
            className={`tab-btn ${tab === 'history' ? 'active' : ''}`}
            onClick={() => {
              setTab('history');
              setError('');
              setMessage('');
            }}
          >
            📋 {t('appointmentHistory', language)}
          </button>
          <button
            className={`tab-btn ${tab === 'reminders' ? 'active' : ''}`}
            onClick={() => {
              setTab('reminders');
              setError('');
              setMessage('');
            }}
          >
            ⏰ {t('remindersUpcoming', language)}
          </button>
        </div>
      </div>
      
      {/* Messages */}
      {message && (
        <div className="message-box success">
          {message}
        </div>
      )}
      {error && (
        <div className="message-box error">
          ⚠️ {error}
        </div>
      )}
      
      {/* BOOKING TAB */}
      {tab === 'book' && (
        <>
      
      {/* Step 1: Search */}
      {step === 'search' && (
        <div className="section search-section">
          <div className="section-content">
            <h2>{t('searchForADoctor', language)}</h2>
            <p className="section-subtitle">{t('fillPreferencesFind', language)}</p>
            
            <form onSubmit={handleSearch} className="search-form">
              <div className="form-grid">
                {/* State */}
                <div className="form-group">
                  <label>🗺️ {t('selectState', language)}</label>
                  <select
                    name="state"
                    value={searchForm.state}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectStateOption', language)}</option>
                    {searchOptions.states.map(state => (
                      <option key={state} value={state}>{translateValue(state, language)}</option>
                    ))}
                  </select>
                </div>
                
                {/* City */}
                <div className="form-group">
                  <label>🏙️ {t('selectCity', language)}</label>
                  <select
                    name="city"
                    value={searchForm.city}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectCityOption', language)}</option>
                    {searchOptions.cities.map(city => (
                      <option key={city} value={city}>{translateValue(city, language)}</option>
                    ))}
                  </select>
                </div>
                
                {/* Locality */}
                <div className="form-group">
                  <label>📍 {t('selectLocality', language)}</label>
                  <select
                    name="locality"
                    value={searchForm.locality}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectLocalityOption', language)}</option>
                    {searchOptions.localities.map(locality => (
                      <option key={locality} value={locality}>{translateValue(locality, language)}</option>
                    ))}
                  </select>
                </div>
                
                {/* Specialization */}
                <div className="form-group">
                  <label>👨‍⚕️ {t('selectSpecialization', language)}</label>
                  <select
                    name="specialization"
                    value={searchForm.specialization}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectLanguageOption', language)}</option>
                    {searchOptions.specializations.map(spec => (
                      <option key={spec} value={spec}>{translateValue(spec, language)}</option>
                    ))}
                  </select>
                </div>
                
                {/* Native Language */}
                <div className="form-group">
                  <label>🗣️ {t('doctorsNativeLanguage', language)}</label>
                  <select
                    name="native_language"
                    value={searchForm.native_language}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectLanguageOption', language)}</option>
                    {searchOptions.native_languages.map(lang => (
                      <option key={lang} value={lang}>{translateValue(lang, language)}</option>
                    ))}
                  </select>
                </div>
                
                {/* Languages Known */}
                <div className="form-group">
                  <label>💬 {t('languagesDoctorSpeaks', language)}</label>
                  <select
                    name="languages_known"
                    value={searchForm.languages_known}
                    onChange={handleSearchChange}
                    className="form-control"
                  >
                    <option value="">{t('selectLanguageOption', language)}</option>
                    {searchOptions.languages.map(lang => (
                      <option key={lang} value={lang}>{translateValue(lang, language)}</option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
              >
                {loading ? `⏳ ${t('searching', language)}...` : `🔍 ${t('searchDoctors', language)}`}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Step 2: Results */}
      {step === 'results' && (
        <div className="section results-section">
          <div className="section-content">
            <div className="results-header">
              <div>
                <h2>👨‍⚕️ {doctors.length} {t('doctorsFound', language)}</h2>
              </div>
              <button
                onClick={() => setStep('search')}
                className="btn btn-secondary"
              >
                ← {t('newSearch', language)}
              </button>
            </div>
            
            <div className="doctors-grid">
              {doctors.map((doctor, idx) => (
                <div key={doctor.employee_id} className="doctor-card">
                  <div className="doctor-rank">#{idx + 1}</div>
                  
                  <div className="doctor-header">
                    <h3>{doctor.name}</h3>
                    <span className="specialization-badge">{translateValue(doctor.specialization, language)}</span>
                  </div>
                  
                  <div className="doctor-info">
                    <div className="info-item">
                      <span className="label">🏥 {t('hospital', language)}</span>
                      <span className="value">{doctor.hospital}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📍 {t('location', language)}</span>
                      <span className="value">{doctor.locality}, {doctor.city}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🗺️ {t('selectState', language)}</span>
                      <span className="value">{doctor.state}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📞 {t('phone', language)}</span>
                      <span className="value">{doctor.phone}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">📧 {t('email', language)}</span>
                      <span className="value email">{doctor.email}</span>
                    </div>
                    <div className="info-item">
                      <span className="label">🗣️ {t('nativeLanguage', language)}</span>
                      <span className="value">{doctor.native_language}</span>
                    </div>
                  </div>
                  
                  <div className="languages">
                    <span className="label">💬 {t('languagesSpoken', language)}:</span>
                    <div className="language-badges">
                      {doctor.languages_known.map((lang, i) => (
                        <span key={i} className="badge">{lang}</span>
                      ))}
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleBookAppointment(doctor)}
                    className="btn btn-primary btn-book"
                  >
                    📅 {t('bookAppointment', language)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Step 3: Booking */}
      {step === 'booking' && selectedDoctor && (
        <div className="section booking-section">
          <div className="section-content">
            <h2>📅 {t('bookingFormTitle', language)}</h2>
            
            <div className="doctor-summary">
              <h3>{selectedDoctor.name}</h3>
              <p>{selectedDoctor.specialization} at {selectedDoctor.hospital}</p>
              <p>{selectedDoctor.locality}, {selectedDoctor.city}</p>
            </div>
            
            <form onSubmit={handleConfirmBooking} className="booking-form">
              <div className="form-grid">
                <div className="form-group">
                  <label>{t('yourName', language)} *</label>
                  <input
                    type="text"
                    name="patient_name"
                    value={bookingForm.patient_name}
                    onChange={handleBookingChange}
                    placeholder={t('enterYourFullName', language)}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('email', language)} *</label>
                  <input
                    type="email"
                    name="patient_email"
                    value={bookingForm.patient_email}
                    onChange={handleBookingChange}
                    placeholder={t('enterYourEmail', language)}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('appointmentPhone', language)} *</label>
                  <input
                    type="tel"
                    name="patient_phone"
                    value={bookingForm.patient_phone}
                    onChange={handleBookingChange}
                    placeholder={t('enterYourPhoneNumber', language)}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('appointmentDate', language)} *</label>
                  <input
                    type="date"
                    name="appointment_date"
                    value={bookingForm.appointment_date}
                    onChange={handleBookingChange}
                    className="form-control"
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label>{t('appointmentTime', language)} *</label>
                  <input
                    type="time"
                    name="appointment_time"
                    value={bookingForm.appointment_time}
                    onChange={handleBookingChange}
                    className="form-control"
                    required
                  />
                </div>
              </div>
              
              <div className="form-group full-width">
                <label>{t('additionalNotes', language)}</label>
                <textarea
                  name="notes"
                  value={bookingForm.notes}
                  onChange={handleBookingChange}
                  placeholder={t('anyAdditionalNotesOrConcerns', language)}
                  className="form-control"
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary btn-lg"
                >
                  {loading ? `⏳ ${t('booking', language)}...` : `✅ ${t('confirmAppointment', language)}`}
                </button>
                <button
                  type="button"
                  onClick={() => setStep('results')}
                  className="btn btn-secondary btn-lg"
                >
                  ← {t('backToResults', language)}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
        </>
      )}
      
      {/* HISTORY TAB */}
      {tab === 'history' && (
        <div className="section">
          <div className="section-content">
            <h2>📋 {t('yourAppointmentHistory', language)}</h2>
            <p className="section-subtitle">{t('viewAllYourPastAndCurrentAppointments', language)}</p>
            
            {appointmentHistory && appointmentHistory.length > 0 ? (
              <div className="appointment-list">
                {appointmentHistory.map(apt => {
                  const aptDate = new Date(apt.appointment_date);
                  const now = new Date();
                  const isPast = aptDate < now;
                  
                  return (
                    <div key={apt.id} className={`appointment-card ${isPast ? 'past' : 'upcoming'}`}>
                      <span className={`appointment-status ${apt.status}`}>
                        {apt.status.toUpperCase()}
                      </span>
                      <h3>Dr. {apt.doctor_name}</h3>
                      <div className="appointment-detail">
                        <span className="label">{t('selectSpecialization', language)}:</span>
                        <span className="value">{apt.specialization}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">{t('hospital', language)}:</span>
                        <span className="value">{apt.hospital}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">{t('location', language)}:</span>
                        <span className="value">{apt.city}, {apt.state}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">📅 {t('dateTime', language)}:</span>
                        <span className="value">
                          {new Date(apt.appointment_date).toLocaleDateString()} {apt.appointment_time}
                        </span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">{t('doctorPhone', language)}:</span>
                        <span className="value">{apt.doctor_phone}</span>
                      </div>
                      {apt.notes && (
                        <div className="appointment-detail">
                          <span className="label">{t('notes', language)}:</span>
                          <span className="value">{apt.notes}</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">📭</div>
                <h3>{t('noAppointmentHistory', language)}</h3>
                <p>{t('youHaventBookedAnyAppointmentsYet', language)}</p>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* REMINDERS & UPCOMING TAB */}
      {tab === 'reminders' && (
        <div className="section">
          <div className="section-content">
            <h2>⏰ {t('upcomingAppointmentsReminders', language)}</h2>
            <p className="section-subtitle">{t('yourScheduledAppointmentsComing', language)}</p>
            
            {upcomingAppointments && upcomingAppointments.length > 0 ? (
              <div className="appointment-list">
                {upcomingAppointments.map(apt => {
                  const aptDate = new Date(apt.appointment_date);
                  const daysUntil = Math.ceil((aptDate - new Date()) / (1000 * 60 * 60 * 24));
                  
                  return (
                    <div key={apt.id} className="appointment-card upcoming">
                      <span className="appointment-status scheduled">
                        {daysUntil === 0 ? t('today', language).toUpperCase() : daysUntil === 1 ? t('tomorrow', language).toUpperCase() : `${daysUntil} ${t('daysFormat', language).toUpperCase()}`}
                      </span>
                      <h3>Dr. {apt.doctor_name}</h3>
                      <div className="appointment-detail">
                        <span className="label">{t('selectSpecialization', language)}:</span>
                        <span className="value">{apt.specialization}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">{t('hospital', language)}:</span>
                        <span className="value">{apt.hospital}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">{t('location', language)}:</span>
                        <span className="value">{apt.locality}, {apt.city}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">⏰ {t('appointmentTime', language)}:</span>
                        <span className="value">{apt.appointment_time}</span>
                      </div>
                      <div className="appointment-detail">
                        <span className="label">📞 {t('contact', language)}:</span>
                        <span className="value">{apt.doctor_phone}</span>
                      </div>
                      {apt.notes && (
                        <div className="appointment-detail">
                          <span className="label">{t('notes', language)}:</span>
                          <span className="value">{apt.notes}</span>
                        </div>
                      )}
                      <div className="appointment-actions">
                        <button className="btn btn-primary" onClick={() => {
                          if (!isMuted) playTTS(`${t('yourAppointmentWithDr', language)} ${apt.doctor_name} ${t('isComingUpIn', language)} ${daysUntil} ${t('daysFormat', language)} ${t('at', language)} ${apt.appointment_time}`, language);
                        }}>
                          🔔 {t('setReminder', language)}
                        </button>
                        <button className="btn btn-secondary" onClick={() => cancelAppointment(apt)}>
                          ❌ {t('cancelAppointment', language)}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-state-icon">✅</div>
                <h3>{t('noUpcomingAppointments', language)}</h3>
                <p>{t('noUpcomingAppointmentsMessage', language)}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultPage;
