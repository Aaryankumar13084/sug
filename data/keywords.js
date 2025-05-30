
const keywords = {
    // Constipation related
    'kabz': `🚽 Kabz ki Samasya:

🔹 Karan:
• Garbhavastha ke hormones
• Iron ki dawai
• Kam pani peena
• Kam fiber

🔹 Samadhan:
• Din mein 8-10 glass pani piyen
• Fiber wala khana len (fruits, vegetables)
• Thoda walk karen
• Aam, papaya, anjeer khayen

⚠️ Koi bhi dawai lene se pehle doctor se pooche.`,

    'constipation': `🚽 Kabz ki Samasya:

🔹 Karan:
• Garbhavastha ke hormones
• Iron ki dawai
• Kam pani peena
• Kam fiber

🔹 Samadhan:
• Din mein 8-10 glass pani piyen
• Fiber wala khana len (fruits, vegetables)
• Thoda walk karen
• Aam, papaya, anjeer khayen

⚠️ Koi bhi dawai lene se pehle doctor se pooche.`,

    // Vaccination related
    'tikakaran': `💉 Garbhavastha mein Tikakaran:

🔹 Zaruri Tike:
• Tetanus (TT) - 2 dose
• Hepatitis B
• Influenza (flu shot)

🔹 Samay:
• TT 1st dose - 16 weeks
• TT 2nd dose - 4 weeks baad

🔹 Fayde:
• Maa aur bacche ki suraksha
• Infection se bachav

⚠️ Apne doctor se tikakaran chart le kar poora karwayen.`,

    'vaccination': `💉 Garbhavastha mein Tikakaran:

🔹 Zaruri Tike:
• Tetanus (TT) - 2 dose
• Hepatitis B
• Influenza (flu shot)

🔹 Samay:
• TT 1st dose - 16 weeks
• TT 2nd dose - 4 weeks baad

🔹 Fayde:
• Maa aur bacche ki suraksha
• Infection se bachav

⚠️ Apne doctor se tikakaran chart le kar poora karwayen.`,

    // Diet related
    'aahar': `🍎 Garbhavastha mein Aahar:

🔹 Kya Khayen:
• Hara patta vegetables
• Fruits (aam, kela, seb)
• Dal, chawal, roti
• Doodh aur dahi
• Dry fruits (badam, akhrot)

🔹 Kya Na Khayen:
• Raw meat/fish
• Alcohol
• Jyada coffee/tea
• Raw eggs

🔹 Tips:
• Thoda-thoda kar ke khayen
• Din mein 5-6 baar khayen
• Pani jyada piyen

⚠️ Balanced diet lena zaroori hai.`,

    'diet': `🍎 Garbhavastha mein Aahar:

🔹 Kya Khayen:
• Hara patta vegetables
• Fruits (aam, kela, seb)
• Dal, chawal, roti
• Doodh aur dahi
• Dry fruits (badam, akhrot)

🔹 Kya Na Khayen:
• Raw meat/fish
• Alcohol
• Jyada coffee/tea
• Raw eggs

🔹 Tips:
• Thoda-thoda kar ke khayen
• Din mein 5-6 baar khayen
• Pani jyada piyen

⚠️ Balanced diet lena zaroori hai.`,

    // Anxiety related
    'chinta': `😟 Garbhavastha mein Chinta:

🔹 Aam Chintayen:
• Bacche ka health
• Delivery ki dar
• Paisa ki tension
• Body changes

🔹 Kam Karne ke Tarike:
• Deep breathing karen
• Meditation
• Family se baat karen
• Achhi kitaben padhen
• Music sunen

🔹 Kab Doctor se Milen:
• Jyada depression
• Khana na khana
• Neend na aana

⚠️ Mental health bhi utna hi important hai.`,

    'anxiety': `😟 Garbhavastha mein Chinta:

🔹 Aam Chintayen:
• Bacche ka health
• Delivery ki dar
• Paisa ki tension
• Body changes

🔹 Kam Karne ke Tarike:
• Deep breathing karen
• Meditation
• Family se baat karen
• Achhi kitaben padhen
• Music sunen

🔹 Kab Doctor se Milen:
• Jyada depression
• Khana na khana
• Neend na aana

⚠️ Mental health bhi utna hi important hai.`,

    // Exercise related
    'vyayam': `🤸‍♀️ Garbhavastha mein Vyayam:

🔹 Safe Exercise:
• Walking (din mein 30 min)
• Swimming
• Prenatal yoga
• Light stretching

🔹 Fayde:
• Energy badhti hai
• Mood achha rehta hai
• Delivery mein aasan
• Weight control

🔹 Kya Na Karen:
• Heavy lifting
• Contact sports
• Hot yoga
• High intensity workout

⚠️ Exercise shuru karne se pehle doctor se pooche.`,

    'exercise': `🤸‍♀️ Garbhavastha mein Vyayam:

🔹 Safe Exercise:
• Walking (din mein 30 min)
• Swimming
• Prenatal yoga
• Light stretching

🔹 Fayde:
• Energy badhti hai
• Mood achha rehta hai
• Delivery mein aasan
• Weight control

🔹 Kya Na Karen:
• Heavy lifting
• Contact sports
• Hot yoga
• High intensity workout

⚠️ Exercise shuru karne se pehle doctor se pooche.`,

    // Headache related
    'sirdard': `🤕 Garbhavastha mein Sirdard:

🔹 Karan:
• Hormonal changes
• Stress
• Dehydration
• Kam khana
• Kam neend

🔹 Rahat ke Tarike:
• Forehead par thanda kapda
• Neck aur shoulders massage
• Andhere mein rest
• Pani jyada piyen
• Regular khana khayen

🔹 Kab Doctor se Milen:
• Bahut tez dard
• Ulti ke saath
• Vision problems

⚠️ Pregnancy mein painkillers avoid karen.`,

    'headache': `🤕 Garbhavastha mein Sirdard:

🔹 Karan:
• Hormonal changes
• Stress
• Dehydration
• Kam khana
• Kam neend

🔹 Rahat ke Tarike:
• Forehead par thanda kapda
• Neck aur shoulders massage
• Andhere mein rest
• Pani jyada piyen
• Regular khana khayen

🔹 Kab Doctor se Milen:
• Bahut tez dard
• Ulti ke saath
• Vision problems

⚠️ Pregnancy mein painkillers avoid karen.`,

    // Nausea/Vomiting related
    'ulti': `🤢 Garbhavastha mein Ulti:

🔹 Kab Hoti Hai:
• Pehle 3 mahine mein jyada
• Morning sickness
• Smell se
• Khali pet

🔹 Kam Karne ke Tarike:
• Subah uthte hi dry biscuit khayen
• Thoda-thoda kar ke khayen
• Ginger tea piyen
• Lemon smell karen
• Fresh air mein rahen

🔹 Doctor se Mile Agar:
• Din mein 3-4 baar se jyada ulti
• Pani bhi nahi ruk raha
• Weight kam ho raha

⚠️ Dehydration se bachne ke liye fluids leti rahen.`,

    'vomiting': `🤢 Garbhavastha mein Ulti:

🔹 Kab Hoti Hai:
• Pehle 3 mahine mein jyada
• Morning sickness
• Smell se
• Khali pet

🔹 Kam Karne ke Tarike:
• Subah uthte hi dry biscuit khayen
• Thoda-thoda kar ke khayen
• Ginger tea piyen
• Lemon smell karen
• Fresh air mein rahen

🔹 Doctor se Mile Agar:
• Din mein 3-4 baar se jyada ulti
• Pani bhi nahi ruk raha
• Weight kam ho raha

⚠️ Dehydration se bachne ke liye fluids leti rahen.`,

    'nausea': `🤢 Garbhavastha mein Ulti:

🔹 Kab Hoti Hai:
• Pehle 3 mahine mein jyada
• Morning sickness
• Smell se
• Khali pet

🔹 Kam Karne ke Tarike:
• Subah uthte hi dry biscuit khayen
• Thoda-thoda kar ke khayen
• Ginger tea piyen
• Lemon smell karen
• Fresh air mein rahen

🔹 Doctor se Mile Agar:
• Din mein 3-4 baar se jyada ulti
• Pani bhi nahi ruk raha
• Weight kam ho raha

⚠️ Dehydration se bachne ke liye fluids leti rahen.`,

    // Blood pressure related
    'raktchap': `🩸 Garbhavastha mein Blood Pressure:

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
• Bar-bar bathroom jana
• Back pain
• Heartburn
• Baby ki movement

🔹 Achhi Neend ke Tarike:
• Left side mein soyen
• Pillow support len
• Caffeine avoid karen
• Room thanda rakhen
• Relaxing routine banaye

🔹 Comfortable Position:
• Left side best hai
• Legs ke beech pillow
• Back support

⚠️ 7-8 ghante neend lena zaruri hai.`,

    'sleep': `😴 Garbhavastha mein Neend:

🔹 Neend ki Problems:
• Bar-bar bathroom jana
• Back pain
• Heartburn
• Baby ki movement

🔹 Achhi Neend ke Tarike:
• Left side mein soyen
• Pillow support len
• Caffeine avoid karen
• Room thanda rakhen
• Relaxing routine banaye

🔹 Comfortable Position:
• Left side best hai
• Legs ke beech pillow
• Back support

⚠️ 7-8 ghante neend lena zaruri hai.`
};

module.exports = keywords;
