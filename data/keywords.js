
const keywords = {
    // Constipation related
    'kabz': `🚽 कब्ज की समस्या:

🔹 कारण:
• गर्भावस्था के हार्मोन्स
• आयरन की दवाई
• कम पानी पीना
• कम रेशे वाला भोजन

🔹 समाधान:
• दिन में 8-10 गिलास पानी पिएं
• रेशे वाला भोजन लें (फल, सब्जियां)
• थोड़ा टहलें
• आम, पपीता, अंजीर खाएं

⚠️ कोई भी दवाई लेने से पहले डॉक्टर से पूछें।`,

    'constipation': `🚽 कब्ज की समस्या:

🔹 कारण:
• गर्भावस्था के हार्मोन्स
• आयरन की दवाई
• कम पानी पीना
• कम रेशे वाला भोजन

🔹 समाधान:
• दिन में 8-10 गिलास पानी पिएं
• रेशे वाला भोजन लें (फल, सब्जियां)
• थोड़ा टहलें
• आम, पपीता, अंजीर खाएं

⚠️ कोई भी दवाई लेने से पहले डॉक्टर से पूछें।`,

    // Vaccination related
    'tikakaran': `💉 गर्भावस्था में टीकाकरण:

🔹 जरूरी टीके:
• टिटनेस (टीटी) - 2 खुराक
• हेपेटाइटिस बी
• इन्फ्लुएंजा (फ्लू शॉट)

🔹 समय:
• टीटी पहली खुराक - 16 सप्ताह में
• टीटी दूसरी खुराक - 4 सप्ताह बाद

🔹 फायदे:
• माँ और बच्चे की सुरक्षा
• संक्रमण से बचाव

⚠️ अपने डॉक्टर से टीकाकरण चार्ट लेकर पूरा कराएं।`,

    'vaccination': `💉 गर्भावस्था में टीकाकरण:

🔹 जरूरी टीके:
• टिटनेस (टीटी) - 2 खुराक
• हेपेटाइटिस बी
• इन्फ्लुएंजा (फ्लू शॉट)

🔹 समय:
• टीटी पहली खुराक - 16 सप्ताह में
• टीटी दूसरी खुराक - 4 सप्ताह बाद

🔹 फायदे:
• माँ और बच्चे की सुरक्षा
• संक्रमण से बचाव

⚠️ अपने डॉक्टर से टीकाकरण चार्ट लेकर पूरा कराएं।`,

    // Diet related
    'aahar': `🍎 गर्भावस्था में आहार:

🔹 क्या खाएं:
• हरी पत्तेदार सब्जियां
• फल (आम, केला, सेब)
• दाल, चावल, रोटी
• दूध और दही
• ड्राई फ्रूट्स (बादाम, अखरोट)

🔹 क्या न खाएं:
• कच्चा मांस/मछली
• शराब
• ज्यादा कॉफी/चाय
• कच्चे अंडे

🔹 सुझाव:
• थोड़ा-थोड़ा करके खाएं
• दिन में 5-6 बार खाएं
• पानी ज्यादा पिएं

⚠️ संतुलित आहार लेना जरूरी है।`,

    'diet': `🍎 गर्भावस्था में आहार:

🔹 क्या खाएं:
• हरी पत्तेदार सब्जियां
• फल (आम, केला, सेब)
• दाल, चावल, रोटी
• दूध और दही
• ड्राई फ्रूट्स (बादाम, अखरोट)

🔹 क्या न खाएं:
• कच्चा मांस/मछली
• शराब
• ज्यादा कॉफी/चाय
• कच्चे अंडे

🔹 सुझाव:
• थोड़ा-थोड़ा करके खाएं
• दिन में 5-6 बार खाएं
• पानी ज्यादा पिएं

⚠️ संतुलित आहार लेना जरूरी है।`,

    // Anxiety related
    'chinta': `😟 गर्भावस्था में चिंता:

🔹 आम चिंताएं:
• बच्चे का स्वास्थ्य
• प्रसव का डर
• पैसे की चिंता
• शरीर में बदलाव

🔹 कम करने के तरीके:
• गहरी सांस लें
• ध्यान करें
• परिवार से बात करें
• अच्छी किताबें पढ़ें
• संगीत सुनें

🔹 कब डॉक्टर से मिलें:
• ज्यादा अवसाद
• खाना न खाना
• नींद न आना

⚠️ मानसिक स्वास्थ्य भी उतना ही महत्वपूर्ण है।`,

    'anxiety': `😟 गर्भावस्था में चिंता:

🔹 आम चिंताएं:
• बच्चे का स्वास्थ्य
• प्रसव का डर
• पैसे की चिंता
• शरीर में बदलाव

🔹 कम करने के तरीके:
• गहरी सांस लें
• ध्यान करें
• परिवार से बात करें
• अच्छी किताबें पढ़ें
• संगीत सुनें

🔹 कब डॉक्टर से मिलें:
• ज्यादा अवसाद
• खाना न खाना
• नींद न आना

⚠️ मानसिक स्वास्थ्य भी उतना ही महत्वपूर्ण है।`,

    // Exercise related
    'vyayam': `🤸‍♀️ गर्भावस्था में व्यायाम:

🔹 सुरक्षित व्यायाम:
• टहलना (दिन में 30 मिनट)
• तैराकी
• प्रीनेटल योग
• हल्की स्ट्रेचिंग

🔹 फायदे:
• ऊर्जा बढ़ती है
• मूड अच्छा रहता है
• प्रसव में आसानी
• वजन नियंत्रण

🔹 क्या न करें:
• भारी वजन उठाना
• संपर्क खेल
• गर्म योग
• तीव्र कसरत

⚠️ व्यायाम शुरू करने से पहले डॉक्टर से पूछें।`,

    'exercise': `🤸‍♀️ गर्भावस्था में व्यायाम:

🔹 सुरक्षित व्यायाम:
• टहलना (दिन में 30 मिनट)
• तैराकी
• प्रीनेटल योग
• हल्की स्ट्रेचिंग

🔹 फायदे:
• ऊर्जा बढ़ती है
• मूड अच्छा रहता है
• प्रसव में आसानी
• वजन नियंत्रण

🔹 क्या न करें:
• भारी वजन उठाना
• संपर्क खेल
• गर्म योग
• तीव्र कसरत

⚠️ व्यायाम शुरू करने से पहले डॉक्टर से पूछें।`,

    // Headache related
    'sirdard': `🤕 गर्भावस्था में सिरदर्द:

🔹 कारण:
• हार्मोनल बदलाव
• तनाव
• पानी की कमी
• कम खाना
• कम नींद

🔹 राहत के तरीके:
• माथे पर ठंडा कपड़ा
• गर्दन और कंधों की मालिश
• अंधेरे में आराम
• पानी ज्यादा पिएं
• नियमित खाना खाएं

🔹 कब डॉक्टर से मिलें:
• बहुत तेज दर्द
• उल्टी के साथ
• दृष्टि संबंधी समस्याएं

⚠️ गर्भावस्था में दर्द निवारक दवाएं न लें।`,

    'headache': `🤕 गर्भावस्था में सिरदर्द:

🔹 कारण:
• हार्मोनल बदलाव
• तनाव
• पानी की कमी
• कम खाना
• कम नींद

🔹 राहत के तरीके:
• माथे पर ठंडा कपड़ा
• गर्दन और कंधों की मालिश
• अंधेरे में आराम
• पानी ज्यादा पिएं
• नियमित खाना खाएं

🔹 कब डॉक्टर से मिलें:
• बहुत तेज दर्द
• उल्टी के साथ
• दृष्टि संबंधी समस्याएं

⚠️ गर्भावस्था में दर्द निवारक दवाएं न लें।`,

    // Vomiting related
    'ulti': `🤮 गर्भावस्था में उल्टी:

🔹 कारण:
• पहले 3 महीने में ज्यादा
• मॉर्निंग सिकनेस
• गंध से
• खाली पेट

🔹 कम करने के तरीके:
• सुबह उठते ही सूखा बिस्कुट खाएं
• थोड़ा-थोड़ा करके खाएं
• अदरक की चाय पिएं
• नींबू की गंध लें
• ताजी हवा में रहें

🔹 डॉक्टर से मिलें अगर:
• दिन में 3-4 बार से ज्यादा उल्टी
• पानी भी नहीं रुक रहा
• वजन कम हो रहा

⚠️ निर्जलीकरण से बचने के लिए तरल पदार्थ लेती रहें।`,

    'vomiting': `🤮 गर्भावस्था में उल्टी:

🔹 कारण:
• पहले 3 महीने में ज्यादा
• मॉर्निंग सिकनेस
• गंध से
• खाली पेट

🔹 कम करने के तरीके:
• सुबह उठते ही सूखा बिस्कुट खाएं
• थोड़ा-थोड़ा करके खाएं
• अदरक की चाय पिएं
• नींबू की गंध लें
• ताजी हवा में रहें

🔹 डॉक्टर से मिलें अगर:
• दिन में 3-4 बार से ज्यादा उल्टी
• पानी भी नहीं रुक रहा
• वजन कम हो रहा

⚠️ निर्जलीकरण से बचने के लिए तरल पदार्थ लेती रहें।`,

    // Blood pressure related
    'raktchap': `🩸 गर्भावस्था में रक्तचाप:

🔹 उच्च रक्तचाप के लक्षण:
• सिरदर्द
• दृष्टि संबंधी समस्याएं
• छाती में दर्द
• सूजन (चेहरा, हाथ)

🔹 नियंत्रण के तरीके:
• नमक कम खाएं
• नियमित टहलें
• तनाव कम करें
• वजन नियंत्रण
• नियमित जांच

🔹 निम्न रक्तचाप के लक्षण:
• चक्कर आना
• कमजोरी
• मितली

⚠️ नियमित रक्तचाप जांच कराना जरूरी है।`,

    'bp': `🩸 Garbhavastha mein Blood Pressure:

🔹 High BP ke Lakshan:
• Sirdard
• Vision problems
• Chest pain
• Swelling (face, hands)

🔹 Control ke Tarike:
• Namak kam khayen
• Regular walk
• Stress kam karen
• Weight control
• Regular checkup

🔹 Low BP ke Lakshan:
• Chakkar aana
• Weakness
• Nausea

⚠️ Regular BP check karawana zaruri hai.`,

    // Diabetes related
    'diabetes': `🍬 Garbhavastha mein Diabetes:

🔹 Gestational Diabetes ke Lakshan:
• Jyada pyaas
• Bar-bar urine
• Thakan
• Blurred vision

🔹 Control ke Tarike:
• Balanced diet
• Regular exercise
• Sugar kam khayen
• Regular monitoring
• Doctor ki medicine

🔹 Complications:
• Baby ka weight jyada
• Delivery mein problem
• Future diabetes risk

⚠️ Blood sugar regular check karwana zaruri hai.`,

    'sugar': `🍬 Garbhavastha mein Diabetes:

🔹 Gestational Diabetes ke Lakshan:
• Jyada pyaas
• Bar-bar urine
• Thakan
• Blurred vision

🔹 Control ke Tarike:
• Balanced diet
• Regular exercise
• Sugar kam khayen
• Regular monitoring
• Doctor ki medicine

🔹 Complications:
• Baby ka weight jyada
• Delivery mein problem
• Future diabetes risk

⚠️ Blood sugar regular check karwana zaruri hai.`,

    // Sleep related
    'neend': `😴 Garbhavastha mein Neend:

🔹 Neend ki Problems:
• Bar-bar bathroom jaana
• Pet mein discomfort
• Stress aur chinta
• Hormonal changes

🔹 Achhi Neend ke Tarike:
• Left side mein soyen
• Pillow use karen (pet ke niche, legs ke beech)
• Caffeine avoid karen
• Regular routine banaye
• Room thanda rakhen

🔹 Kab Doctor se Milen:
• Bilkul neend nahi aana
• Snoring bahut jyada
• Sleep apnea ke symptoms

⚠️ Achhi neend baby ke development ke liye zaroori hai.`,

    'sleep': `😴 Garbhavastha mein Neend:

🔹 Neend ki Problems:
• Bar-bar bathroom jaana
• Pet mein discomfort
• Stress aur chinta
• Hormonal changes

🔹 Achhi Neend ke Tarike:
• Left side mein soyen
• Pillow use karen (pet ke niche, legs ke beech)
• Caffeine avoid karen
• Regular routine banaye
• Room thanda rakhen

🔹 Kab Doctor se Milen:
• Bilkul neend nahi aana
• Snoring bahut jyada
• Sleep apnea ke symptoms

⚠️ Achhi neend baby ke development ke liye zaroori hai.`
};

module.exports = keywords;
