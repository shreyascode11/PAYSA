import type { ReportType, Severity } from "../types";

/** Lower-cased keyword stems in English, Tamil and Hindi. Substring match keeps Tamil/Hindi inflections working. */
const CATEGORY_KEYWORDS: Record<string, readonly string[]> = {
  fall_height: ["fall", "fell", "height", "scaffold", "guard rail", "railing", "ladder", "roof", "விழ", "உயர", "சாரம", "ஏணி", "கைப்பிடி", "गिर", "ऊँचाई", "मचान", "सीढ़ी", "रेलिंग"],
  ppe_missing: ["helmet", "glove", "shoe", "boot", "harness", "mask", "safety gear", "ஹெல்மெட்", "கையுறை", "காலணி", "உபகரண", "हेलमेट", "दस्ताने", "जूते", "मास्क", "सुरक्षा के"],
  electrical: ["wire", "shock", "electric", "current", "spark", "cable", "மின்", "கம்பி", "ஷாக்", "बिजली", "तार", "करंट", "झटका"],
  machinery: ["machine", "mixer", "crane", "drill", "cutter", "jcb", "இயந்திர", "கிரேன்", "मशीन", "क्रेन", "मिक्सर"],
  heat: ["heat", "hot", "sun", "dehydrat", "faint", "shade", "வெப்ப", "வெயில்", "மயக்க", "गर्मी", "धूप", "चक्कर", "लू"],
  collapse: ["collapse", "crack", "cave", "shoring", "இடிந்து", "விரிசல்", "ढह", "दरार"],
  wet_floor: ["wet", "slip", "leak", "ஈர", "வழுக்", "கசி", "गीला", "फिसल", "रिसाव"],
  chemical_cleaning: ["acid", "chemical", "bleach", "phenyl", "ரசாயன", "அமில", "एसिड", "केमिकल", "तेज़ाब"],
  lifting: ["lift", "heavy", "back pain", "carry", "தூக்க", "கனமான", "முதுகு", "उठा", "भारी", "कमर"],
  harassment: ["harass", "touch", "abuse", "stalk", "inappropriate", "துன்புறுத்", "தவறாக", "छेड़", "उत्पीड़न", "गलत तरीके"],
  pay: ["wage", "salary", "pay", "money", "paid", "சம்பள", "கூலி", "பணம்", "वेतन", "पैसा", "मज़दूरी", "तनख्वाह"],
  hours: ["overtime", "hours", "night shift", "no rest", "கூடுதல் நேர", "மணி நேர", "ओवरटाइम", "घंटे"],
  leave: ["leave", "holiday", "sick", "விடுப்பு", "छुट्टी"],
  behaviour: ["shout", "insult", "rude", "கத்து", "அவமான", "चिल्ला", "बेइज़्ज़ती"],
  facilities: ["toilet", "drinking water", "rest room", "கழிப்பறை", "குடிநீர்", "शौचालय", "पीने का पानी"],
  manager: ["supervisor", "manager", "boss", "maistry", "மேஸ்திரி", "மேலாளர்", "சூப்பர்வைசர்", "सुपरवाइज़र", "मैनेजर", "ठेकेदार"],
  conditions: ["condition", "water", "shade", "food", "சூழ்நிலை", "தண்ணீர்", "हालात", "पानी"],
};

const CRITICAL_WORDS = ["almost fell", "nearly fell", "fell", "died", "death", "dead", "blood", "fire", "unconscious", "collapsed", "electrocut", "scared", "sexual", "கிட்டத்தட்ட", "விழுந்தார்", "இரத்த", "தீ ", "பயமா", "மரண", "गिरते", "खून", "आग", "बेहोश", "मौत", "डर"];
const SERIOUS_WORDS = ["injur", "burn", "hurt", "pain", "without", "threat", "force", "காயம்", "எரி", "வலி", "இல்லாமல்", "மிரட்ட", "चोट", "जल ", "जल रहे", "दर्द", "बिना", "धमकी", "ज़बरदस्ती"];
const HIGH_RISK_CATEGORIES = new Set(["fall_height", "electrical", "collapse", "harassment", "machinery"]);

export interface Classification {
  category: string;
  severity: Severity;
}

function score(text: string, words: readonly string[]): number {
  return words.reduce((n, w) => (text.includes(w) ? n + 1 : n), 0);
}

/** Deterministic fallback for the AI classifier: keyword hits pick the category, risk words set severity. */
export function classifyReport(
  rawText: string,
  type: ReportType,
  allowedCategories: readonly string[],
  chosenCategory?: string,
): Classification {
  const text = ` ${rawText.toLowerCase()} `;
  let best = chosenCategory && allowedCategories.includes(chosenCategory) ? chosenCategory : "other";
  // Respect the worker's pick unless they said "other".
  if (best === "other") {
    let bestHits = 0;
    for (const c of allowedCategories) {
      const hits = score(text, CATEGORY_KEYWORDS[c] ?? []);
      if (hits > bestHits) [best, bestHits] = [c, hits];
    }
  }

  let severity: Severity = type === "hazard" ? 2 : 1;
  if (type === "hazard" && HIGH_RISK_CATEGORIES.has(best)) severity = 3;
  if (score(text, SERIOUS_WORDS) > 0) severity = Math.max(severity, type === "hazard" ? 3 : 2) as Severity;
  if (score(text, CRITICAL_WORDS) > 0) severity = type === "hazard" ? 4 : 3;
  return { category: best, severity };
}
