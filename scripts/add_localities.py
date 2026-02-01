# Script to add locality translations to ConsultPage.jsx
import re

file_path = r"d:\GitHub 2\SMA_Sanjeevani\frontend\src\components\ConsultPage.jsx"

# Read the file
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Localities to add with translations
localities = {
    'hindi': {
        'Ansari Nagar': 'अंसारी नगर',
        'Bannerghatta Road': 'बैनरघाट्टा रोड',
        'Begumpet': 'बेगमपेट',
        'Cheranalloor': 'चेरानल्लूर',
        'Jubilee Hills': 'जुबली हिल्स',
        'Katpadi Road': 'कटपाड़ी रोड',
        'Old Airport Road': 'ओल्ड एयरपोर्ट रोड',
        'Parel': 'परेल',
        'Salt Lake': 'साल्ट लेक',
        'Somajiguda': 'सोमाजीगुडा'
    },
    'marathi': {
        'Ansari Nagar': 'अंसारी नगर',
        'Bannerghatta Road': 'बॅनरघट्टा रोड',
        'Begumpet': 'बेगमपेट',
        'Cheranalloor': 'चेरानल्लूर',
        'Jubilee Hills': 'जुबली हिल्स',
        'Katpadi Road': 'कटपाडी रोड',
        'Old Airport Road': 'ओल्ड एअरपोर्ट रोड',
        'Parel': 'परेल',
        'Salt Lake': 'सॉल्ट लेक',
        'Somajiguda': 'सोमाजीगुडा'
    },
    'bengali': {
        'Ansari Nagar': 'আনসারি নগর',
        'Bannerghatta Road': 'ব্যানারঘাট্টা রোড',
        'Begumpet': 'বেগমপেট',
        'Cheranalloor': 'চেরানাল্লুর',
        'Jubilee Hills': 'জুবিলি হিলস',
        'Katpadi Road': 'কাটপাডি রোড',
        'Old Airport Road': 'ওল্ড এয়ারপোর্ট রোড',
        'Parel': 'পারেল',
        'Salt Lake': 'সল্ট লেক',
        'Somajiguda': 'সোমাজিগুডা'
    },
    'tamil': {
        'Ansari Nagar': 'அன்சாரி நகர்',
        'Bannerghatta Road': 'பன்னேர்கட்டா ரோடு',
        'Begumpet': 'பேகம்பேட்',
        'Cheranalloor': 'செரனல்லூர்',
        'Jubilee Hills': 'ஜூபிலி ஹில்ஸ்',
        'Katpadi Road': 'கட்பாடி ரோடு',
        'Old Airport Road': 'ஓல்ட் ஏர்போர்ட் ரோடு',
        'Parel': 'பரேல்',
        'Salt Lake': 'சால்ட் லேக்',
        'Somajiguda': 'சோமாஜிகுடா'
    },
    'kannada': {
        'Ansari Nagar': 'ಅನ್ಸಾರಿ ನಗರ್',
        'Bannerghatta Road': 'ಬನ್ನೇರ್ಘಟ್ಟ ರೋಡ್',
        'Begumpet': 'ಬೇಗಂಪೇಟ್',
        'Cheranalloor': 'ಚೆರನಲ್ಲೂರ್',
        'Jubilee Hills': 'ಜೂಬಿಲಿ ಹಿಲ್ಸ್',
        'Katpadi Road': 'ಕಟ್ಪಾಡಿ ರೋಡ್',
        'Old Airport Road': 'ಓಲ್ಡ್ ಏರ್‌ಪೋರ್ಟ್ ರೋಡ್',
        'Parel': 'ಪರೇಲ್',
        'Salt Lake': 'ಸಾಲ್ಟ್ ಲೇಕ್',
        'Somajiguda': 'ಸೋಮಾಜಿಗೂಡ'
    },
    'malayalam': {
        'Ansari Nagar': 'അൻസാരി നഗർ',
        'Bannerghatta Road': 'ബന്നേർഘട്ട റോഡ്',
        'Begumpet': 'ബേഗംപേട്',
        'Cheranalloor': 'ചേരനല്ലൂർ',
        'Jubilee Hills': 'ജൂബിലി ഹിൽസ്',
        'Katpadi Road': 'കാട്ട്‌പാടി റോഡ്',
        'Old Airport Road': 'ഓൾഡ് എയർപോർട്ട് റോഡ്',
        'Parel': 'പരേൽ',
        'Salt Lake': 'സാൾട്ട് ലേക്ക്',
        'Somajiguda': 'സോമാജിగുഡ'
    },
    'gujarati': {
        'Ansari Nagar': 'અંસારી નગર',
        'Bannerghatta Road': 'બેનરઘાટ્ટા રોડ',
        'Begumpet': 'બેગમપેટ',
        'Cheranalloor': 'ચેરનાલ્લૂર',
        'Jubilee Hills': 'જુબ્લી હિલ્સ',
        'Katpadi Road': 'કટપાડી રોડ',
        'Old Airport Road': 'ઓલ્ડ એરપોર્ટ રોડ',
        'Parel': 'પારેલ',
        'Salt Lake': 'સોલ્ટ લેક',
        'Somajiguda': 'સોમાજિગુડા'
    }
}

# For each language, find and replace
for lang, translations in localities.items():
    # Find the section for this language
    pattern = f"{lang}: {{([^}}]+)'Cardiology':"
    match = re.search(pattern, content)
    
    if match:
        # Get the position right before 'Cardiology'
        insert_pos = match.end() - len("'Cardiology':")
        
        # Build the locality string
        locality_str = ", ".join([f"'{k}': '{v}'" for k, v in translations.items()])
        locality_str += ", "
        
        # Insert the localities
        content = content[:insert_pos] + locality_str + content[insert_pos:]
        print(f"✓ Added localities for {lang}")
    else:
        print(f"✗ Could not find {lang} section")

# Write back
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("\n✅ All locality translations added successfully!")
