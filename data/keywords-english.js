const englishKeywords = {
    // Constipation related
    'constipation': `🚽 Constipation During Pregnancy:

🔹 Causes:
• Pregnancy hormones
• Iron supplements
• Low water intake
• Low fiber diet

🔹 Solutions:
• Drink 8-10 glasses of water daily
• Eat fiber-rich foods (fruits, vegetables)
• Take short walks
• Eat mangoes, papaya, figs

⚠️ Consult your doctor before taking any medication.`,

    'kabz': `🚽 Constipation During Pregnancy:

🔹 Causes:
• Pregnancy hormones
• Iron supplements
• Low water intake
• Low fiber diet

🔹 Solutions:
• Drink 8-10 glasses of water daily
• Eat fiber-rich foods (fruits, vegetables)
• Take short walks
• Eat mangoes, papaya, figs

⚠️ Consult your doctor before taking any medication.`,

    // Vaccination related
    'vaccination': `💉 Vaccinations During Pregnancy:

🔹 Essential Vaccines:
• Tetanus (TT) - 2 doses
• Hepatitis B
• Influenza (flu shot)

🔹 Timing:
• TT 1st dose - 16 weeks
• TT 2nd dose - 4 weeks later

🔹 Benefits:
• Protection for mother and baby
• Prevention from infections

⚠️ Get vaccination chart from your doctor and complete it.`,

    'tikakaran': `💉 Vaccinations During Pregnancy:

🔹 Essential Vaccines:
• Tetanus (TT) - 2 doses
• Hepatitis B
• Influenza (flu shot)

🔹 Timing:
• TT 1st dose - 16 weeks
• TT 2nd dose - 4 weeks later

🔹 Benefits:
• Protection for mother and baby
• Prevention from infections

⚠️ Get vaccination chart from your doctor and complete it.`,

    // Diet related
    'diet': `🍎 Diet During Pregnancy:

🔹 What to Eat:
• Green leafy vegetables
• Fruits (mango, banana, apple)
• Lentils, rice, bread
• Milk and yogurt
• Dry fruits (almonds, walnuts)

🔹 What to Avoid:
• Raw meat/fish
• Alcohol
• Too much coffee/tea
• Raw eggs

🔹 Tips:
• Eat small frequent meals
• Eat 5-6 times a day
• Drink plenty of water

⚠️ Balanced diet is essential.`,

    'aahar': `🍎 Diet During Pregnancy:

🔹 What to Eat:
• Green leafy vegetables
• Fruits (mango, banana, apple)
• Lentils, rice, bread
• Milk and yogurt
• Dry fruits (almonds, walnuts)

🔹 What to Avoid:
• Raw meat/fish
• Alcohol
• Too much coffee/tea
• Raw eggs

🔹 Tips:
• Eat small frequent meals
• Eat 5-6 times a day
• Drink plenty of water

⚠️ Balanced diet is essential.`,

    // Anxiety related
    'anxiety': `😟 Anxiety During Pregnancy:

🔹 Common Worries:
• Baby's health
• Fear of delivery
• Financial stress
• Body changes

🔹 Ways to Reduce:
• Practice deep breathing
• Meditation
• Talk to family
• Read good books
• Listen to music

🔹 When to See Doctor:
• Severe depression
• Loss of appetite
• Insomnia

⚠️ Mental health is equally important.`,

    'chinta': `😟 Anxiety During Pregnancy:

🔹 Common Worries:
• Baby's health
• Fear of delivery
• Financial stress
• Body changes

🔹 Ways to Reduce:
• Practice deep breathing
• Meditation
• Talk to family
• Read good books
• Listen to music

🔹 When to See Doctor:
• Severe depression
• Loss of appetite
• Insomnia

⚠️ Mental health is equally important.`,

    // Exercise related
    'exercise': `🤸‍♀️ Exercise During Pregnancy:

🔹 Safe Exercises:
• Walking (30 min daily)
• Swimming
• Prenatal yoga
• Light stretching

🔹 Benefits:
• Increases energy
• Improves mood
• Easier delivery
• Weight control

🔹 What to Avoid:
• Heavy lifting
• Contact sports
• Hot yoga
• High intensity workouts

⚠️ Consult doctor before starting exercise.`,

    'vyayam': `🤸‍♀️ Exercise During Pregnancy:

🔹 Safe Exercises:
• Walking (30 min daily)
• Swimming
• Prenatal yoga
• Light stretching

🔹 Benefits:
• Increases energy
• Improves mood
• Easier delivery
• Weight control

🔹 What to Avoid:
• Heavy lifting
• Contact sports
• Hot yoga
• High intensity workouts

⚠️ Consult doctor before starting exercise.`,

    // Headache related
    'headache': `🤕 Headaches During Pregnancy:

🔹 Causes:
• Hormonal changes
• Stress
• Dehydration
• Skipping meals
• Lack of sleep

🔹 Relief Methods:
• Cold compress on forehead
• Neck and shoulder massage
• Rest in dark room
• Drink more water
• Eat regular meals

🔹 When to See Doctor:
• Severe pain
• With vomiting
• Vision problems

⚠️ Avoid painkillers during pregnancy.`,

    'sirdard': `🤕 Headaches During Pregnancy:

🔹 Causes:
• Hormonal changes
• Stress
• Dehydration
• Skipping meals
• Lack of sleep

🔹 Relief Methods:
• Cold compress on forehead
• Neck and shoulder massage
• Rest in dark room
• Drink more water
• Eat regular meals

🔹 When to See Doctor:
• Severe pain
• With vomiting
• Vision problems

⚠️ Avoid painkillers during pregnancy.`,

    // Vomiting related
    'vomiting': `🤮 Vomiting During Pregnancy:

🔹 Causes:
• More common in first 3 months
• Morning sickness
• Triggered by smells
• Empty stomach

🔹 Ways to Reduce:
• Eat dry biscuits upon waking
• Eat small frequent meals
• Drink ginger tea
• Smell lemon
• Stay in fresh air

🔹 See Doctor If:
• Vomiting more than 3-4 times daily
• Unable to keep water down
• Weight loss

⚠️ Keep taking fluids to prevent dehydration.`,

    'ulti': `🤮 Vomiting During Pregnancy:

🔹 Causes:
• More common in first 3 months
• Morning sickness
• Triggered by smells
• Empty stomach

🔹 Ways to Reduce:
• Eat dry biscuits upon waking
• Eat small frequent meals
• Drink ginger tea
• Smell lemon
• Stay in fresh air

🔹 See Doctor If:
• Vomiting more than 3-4 times daily
• Unable to keep water down
• Weight loss

⚠️ Keep taking fluids to prevent dehydration.`,

    // Blood pressure related
    'bp': `🩸 Blood Pressure During Pregnancy:

🔹 High BP Symptoms:
• Headaches
• Vision problems
• Chest pain
• Swelling (face, hands)

🔹 Control Methods:
• Reduce salt intake
• Regular walking
• Reduce stress
• Weight control
• Regular checkups

🔹 Low BP Symptoms:
• Dizziness
• Weakness
• Nausea

⚠️ Regular BP monitoring is essential.`,

    'raktchap': `🩸 Blood Pressure During Pregnancy:

🔹 High BP Symptoms:
• Headaches
• Vision problems
• Chest pain
• Swelling (face, hands)

🔹 Control Methods:
• Reduce salt intake
• Regular walking
• Reduce stress
• Weight control
• Regular checkups

🔹 Low BP Symptoms:
• Dizziness
• Weakness
• Nausea

⚠️ Regular BP monitoring is essential.`,

    // Diabetes related
    'diabetes': `🍬 Diabetes During Pregnancy:

🔹 Gestational Diabetes Symptoms:
• Excessive thirst
• Frequent urination
• Fatigue
• Blurred vision

🔹 Control Methods:
• Balanced diet
• Regular exercise
• Reduce sugar intake
• Regular monitoring
• Doctor's medication

🔹 Complications:
• Baby's excess weight
• Delivery problems
• Future diabetes risk

⚠️ Regular blood sugar monitoring is essential.`,

    'sugar': `🍬 Diabetes During Pregnancy:

🔹 Gestational Diabetes Symptoms:
• Excessive thirst
• Frequent urination
• Fatigue
• Blurred vision

🔹 Control Methods:
• Balanced diet
• Regular exercise
• Reduce sugar intake
• Regular monitoring
• Doctor's medication

🔹 Complications:
• Baby's excess weight
• Delivery problems
• Future diabetes risk

⚠️ Regular blood sugar monitoring is essential.`,

    // Sleep related
    'sleep': `😴 Sleep During Pregnancy:

🔹 Sleep Problems:
• Frequent bathroom trips
• Abdominal discomfort
• Stress and anxiety
• Hormonal changes

🔹 Good Sleep Tips:
• Sleep on left side
• Use pillows (under belly, between legs)
• Avoid caffeine
• Maintain regular routine
• Keep room cool

🔹 When to See Doctor:
• Complete insomnia
• Excessive snoring
• Sleep apnea symptoms

⚠️ Good sleep is essential for baby's development.`,

    'neend': `😴 Sleep During Pregnancy:

🔹 Sleep Problems:
• Frequent bathroom trips
• Abdominal discomfort
• Stress and anxiety
• Hormonal changes

🔹 Good Sleep Tips:
• Sleep on left side
• Use pillows (under belly, between legs)
• Avoid caffeine
• Maintain regular routine
• Keep room cool

🔹 When to See Doctor:
• Complete insomnia
• Excessive snoring
• Sleep apnea symptoms

⚠️ Good sleep is essential for baby's development.`
};

module.exports = englishKeywords;