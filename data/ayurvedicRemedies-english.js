const ayurvedicRemediesEnglish = {
    1: {
        generalGuidance: [
            "Pregnancy has just begun - allow your body to rest",
            "Avoid stress and anxiety",
            "Maintain a regular daily routine"
        ],
        remedies: [
            "Drink warm milk with ghee before bedtime",
            "Avoid vigorous abdominal massage",
            "Practice pranayama - alternate nostril breathing is beneficial"
        ],
        herbs: [
            "Ginger tea (in small amounts)",
            "Tulsi tea once daily",
            "Cinnamon tea twice a week (consult your doctor)"
        ],
        avoid: [
            "Heavy and oily food",
            "Intense exercise",
            "Stressful situations",
            "New medicines without doctor's consultation"
        ]
    },
    4: {
        generalGuidance: [
            "End of first month of pregnancy",
            "Adopt Ayurvedic practices for stability",
            "Eat sattvic (pure) food"
        ],
        remedies: [
            "Warm water with lemon and honey in the morning",
            "Light massage with oil (under expert guidance)",
            "Yoga: gentle walking, cat stretch"
        ],
        herbs: [
            "Ginger-ajwain tea on empty stomach",
            "5-6 tulsi leaves daily",
            "Fenugreek seeds soaked overnight, consumed in the morning"
        ],
        avoid: [
            "Excessively spicy food",
            "Raw fruits and vegetables",
            "Cold food and water"
        ]
    },
    8: {
        generalGuidance: [
            "Entering second month - build body strength",
            "Focus on nutritious diet",
            "Maintain inner peace"
        ],
        remedies: [
            "Full body massage with ghee (3 times per week)",
            "Light exercise and prenatal poses",
            "Practice meditation for peace - 10 minutes daily"
        ],
        herbs: [
            "Shatavari powder in milk (as per doctor's dosage)",
            "Light use of ashwagandha (under medical guidance)",
            "Tulsi, cinnamon and jaggery tea"
        ],
        avoid: [
            "Strenuous exercise",
            "Excessive sexual activity",
            "Lifting heavy objects"
        ]
    },
    12: {
        generalGuidance: [
            "End of first trimester - enhance reproductive strength",
            "Strengthen the endocrine system",
            "Maintain emotional balance"
        ],
        remedies: [
            "Full body massage with sesame oil",
            "Shoulder stand practice (with yoga instructor)",
            "Sun salutation - 5 rounds in the morning"
        ],
        herbs: [
            "Regular use of shatavari",
            "Vidarikand pudding",
            "Milk with saffron and almonds"
        ],
        avoid: [
            "Intense emotions and stress",
            "Cold water bathing",
            "Staying awake late at night"
        ]
    },
    16: {
        generalGuidance: [
            "Beginning of second trimester - rapid fetal development",
            "Enhance digestive capacity",
            "Include blood-building foods"
        ],
        remedies: [
            "Milk with jaggery and ghee in the morning",
            "Back massage with oil (especially along spine)",
            "Light exercise - yoga poses to strengthen back"
        ],
        herbs: [
            "Shatavari with ghee",
            "Vidarikand milk preparation",
            "Honey in milk"
        ],
        avoid: [
            "Heavy food that's hard to digest",
            "Excessive exercise",
            "Prolonged lying on back"
        ]
    },
    20: {
        generalGuidance: [
            "Fifth month - rapid fetal growth underway",
            "Build physical and mental resilience",
            "Maintain healthy digestion"
        ],
        remedies: [
            "Coconut oil massage (especially on legs and abdomen)",
            "Khichdi-based diet",
            "Prenatal yoga and pranayama"
        ],
        herbs: [
            "Milk with almond paste",
            "Amla (Indian gooseberry) jam",
            "Triphala powder in warm water at night"
        ],
        avoid: [
            "Intense activities",
            "Long-distance travel",
            "Excessive spices"
        ]
    },
    24: {
        generalGuidance: [
            "Sixth month - transitioning to third trimester",
            "Strengthen bones and tissues",
            "Support fetal development"
        ],
        remedies: [
            "Full body massage with sesame oil",
            "Meditation and mindfulness - 15 minutes daily",
            "Gentle abdominal massage (circular motions)"
        ],
        herbs: [
            "Milk with saffron and ghee",
            "Regular use of shatavari ghee",
            "Dried nuts and dried fruit mixture"
        ],
        avoid: [
            "Excessive salt",
            "Deep fried foods",
            "Mental anxiety"
        ]
    },
    28: {
        generalGuidance: [
            "Beginning of third trimester - prepare for labor",
            "Maintain physical strength",
            "Prepare body for delivery"
        ],
        remedies: [
            "Mustard oil massage (3-4 times per week)",
            "Pelvic floor exercises (Kegel exercises)",
            "Birthing pose (best for preparing for labor)"
        ],
        herbs: [
            "Milk with almonds and dried fruits",
            "Amla juice on empty stomach in morning",
            "Mixture of jaggery and ghee"
        ],
        avoid: [
            "Excessive exercise",
            "Long periods of standing",
            "Cold air"
        ]
    },
    32: {
        generalGuidance: [
            "Eighth month - final three months have begun",
            "Intensify preparation for labor",
            "Maintain mental peace"
        ],
        remedies: [
            "Daily oil massage (15-20 minutes)",
            "Squats and pelvic exercises",
            "Deep breathing - 10 minutes morning and evening"
        ],
        herbs: [
            "Cumin water every morning",
            "Milk with honey and almonds",
            "Mixture of dried nuts (cashew, raisins, almonds)"
        ],
        avoid: [
            "Heavy work",
            "Climbing stairs excessively",
            "Excessive movement"
        ]
    },
    36: {
        generalGuidance: [
            "Ninth month - labor is very near",
            "Complete physical and mental preparation",
            "Maintain regular contact with doctor"
        ],
        remedies: [
            "Daily oil massage (especially pelvic area)",
            "Walking - 30 minutes morning and evening",
            "Pranayama and yoga - labor preparation"
        ],
        herbs: [
            "Not excessive ginger tea",
            "Milk with honey at night",
            "Sesame and jaggery balls (ladoo)"
        ],
        avoid: [
            "Excessive heat",
            "Heavy meals",
            "Sexual activity (consult doctor)"
        ]
    },
    40: {
        generalGuidance: [
            "Tenth month - awaiting labor",
            "Maintain peace and patience",
            "Stay alert for all signs"
        ],
        remedies: [
            "Daily oil massage morning and evening",
            "Natural walking - 30-45 minutes",
            "Meditation and mantra chanting - for mental peace"
        ],
        herbs: [
            "Warm milk with honey before bed",
            "Dried nuts mixture",
            "Cumin and fennel tea"
        ],
        avoid: [
            "Avoid any additional stress",
            "Excessive heat",
            "Sexual activity"
        ]
    }
};

function getAyurvedicRemediesEnglish(week) {
    // Return exact week if available, otherwise find closest week
    if (ayurvedicRemediesEnglish[week]) {
        return ayurvedicRemediesEnglish[week];
    }

    // Find closest available week data based on trimester
    const trimester = week <= 12 ? 1 : week <= 27 ? 2 : 3;
    const weeks = Object.keys(ayurvedicRemediesEnglish).map(w => parseInt(w)).sort((a, b) => a - b);

    let closest = weeks[0];
    for (const w of weeks) {
        const wTrimester = w <= 12 ? 1 : w <= 27 ? 2 : 3;
        if (wTrimester === trimester) {
            closest = w;
        }
        if (w > week) break;
    }

    return ayurvedicRemediesEnglish[closest] || ayurvedicRemediesEnglish[1];
}

module.exports = { getAyurvedicRemediesEnglish };
