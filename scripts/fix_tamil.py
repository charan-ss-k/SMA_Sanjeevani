#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import re

# Fix Tamil translations with mixed scripts

filepath = r'frontend\src\utils\translations.js'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Fix all the mixed script issues in Tamil section
replacements = [
    # Line by line fixes for Tamil section
    ("easyBookingDesc: 'நிமிடங்களில் அப்பாய்ன்டमेंट்ஐ திட்டமிடுங்கள்',", 
     "easyBookingDesc: 'நிமிடங்களில் சந்திப்பை திட்டமிடுங்கள்',"),
    
    ("healthTrack: 'ஆரோக்கிய ట్ర్యాకిং்',", 
     "healthTrack: 'ஆரோக்கிய கண்காணிப்பு',"),
    
    # Long whatWeDoDesc - replace everything between the quotes
    ("'சஞ்சீவனி உங்களின் ஆளுனியான", "'சஞ்சீவனி உங்களின் தனிப்பட்ட"),
    
    ("step1Title: 'லாகிన்/साइन अप्',", "step1Title: 'உள்நுழைவு அல்லது பதிவு',"),
]

for old, new in replacements:
    if old in content:
        content = content.replace(old, new)
        print(f"Fixed: {old[:50]}...")

# Special fix for the long whatWeDoDesc
if "ஆளுனியான ஆரோக்கிய சாதி" in content:
    # Find and replace the entire whatWeDoDesc line
    import re
    pattern = r"whatWeDoDesc: 'சஞ்சீவனி உங்களின் ஆளுனியான.*?हैं।',"
    replacement = "whatWeDoDesc: 'சஞ்சீவனி உங்களின் தனிப்பட்ட ஆரோக்கிய துணை. நாம் செயற்கை நுண்ணறிவு அடிப்படையிலான அறிகுறி பகுப்பாய்வு, நிபுணத்துவ மருத்துவ ஆலோசனை, ஆன்லைன் மருத்துவர் சந்திப்பு, ஸ்மார்ட் மருந்து மேலாண்மை மற்றும் தனிப்பட்ட ஆரோக்கிய கண்காணிப்பு வழங்குகிறோம்.',"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)
    print("Fixed whatWeDoDesc")

# Fix remaining step descriptions
if "खोजें" in content:
    content = content.replace("step3Desc: 'சரிபார்க்கப்பட்ட மருத்துவர்களுடன் அப்பாய்ன்டमेंট् खोजें मற்றum बुक करें',", 
                             "step3Desc: 'சரிபார்க்கப்பட்ட மருத்துவர்களுடன் சந்திப்பை கண்டுபிடித்து முன்பதிவு செய்யவும்',")
    print("Fixed step3Desc")

if "मॉनिटर" in content:
    pattern2 = r"step4Desc: 'மருந்துகள்.*?करें',"
    replacement2 = "step4Desc: 'மருந்துகள், நினைவூட்டல்கள் மற்றும் ஆரோக்கிய பதிவுகளை கண்காணிக்கவும்',"
    content = re.sub(pattern2, replacement2, content)
    print("Fixed step4Desc")

if "डेशबोर्ड" in content:
    pattern3 = r"getStartedDesc: 'உங்கள் நபர்வாத.*?करें',"
    replacement3 = "getStartedDesc: 'உங்கள் தனிப்பட்ட ஆரோக்கிய டாஷ்போர்டை அணுக உள்நுழையவும்',"
    content = re.sub(pattern3, replacement3, content)
    print("Fixed getStartedDesc")

if "लாগिन্ করें" in content or "లాగిన్ করें" in content:
    pattern4 = r"loginToContinue: 'தொடர.*?',"
    replacement4 = "loginToContinue: 'தொடர உள்நுழையவும்',"
    content = re.sub(pattern4, replacement4, content)
    print("Fixed loginToContinue")

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ All Tamil translations fixed!")
