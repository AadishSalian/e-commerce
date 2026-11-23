import { getLocaleConfig } from './config';

export interface LocalizedProductData {
  name: string;
  description: string;
  category: string;
  specs?: Record<string, string>;
  altText?: string;
}

export const CATALOG_LOCALIZATIONS: Record<string, Record<string, LocalizedProductData>> = {
  't-1': {
    'hi-IN': {
      name: 'मैट कीबोर्ड १',
      description: 'एयरोस्पेस-ग्रेड एल्यूमीनियम के एक ही ब्लॉक से निर्मित एक अल्ट्रा-लो प्रोफाइल मैकेनिकल कीबोर्ड। सॉफ्ट-टच मैट चारकोल में तैयार।',
      category: 'तकनीक',
      specs: { 'वजन': '६८० ग्राम', 'कनेक्टिविटी': 'वायरलेस / टाइप-सी', 'सामग्री': 'एल्यूमीनियम' },
      altText: 'मैट ब्लैक फिनिश में प्रीमियम मैकेनिकल कीबोर्ड',
    },
    'kn-IN': {
      name: 'ಮ್ಯಾಟ್ ಕೀಬೋರ್ಡ್ ೧',
      description: 'ಏರೋಸ್ಪೇಸ್ ದರ್ಜೆಯ ಅಲ್ಯೂಮಿನಿಯಂನಿಂದ ತಯಾರಿಸಲಾದ ಅಲ್ಟ್ರಾ-ಲೋ ಪ್ರೊಫೈಲ್ ಮೆಕ್ಯಾನಿಕಲ್ ಕೀಬೋರ್ಡ್. ಸಾಫ್ಟ್-ಟಚ್ ಮ್ಯಾಟ್ ಇದ್ದಿಲು ಬಣ್ಣದಲ್ಲಿದೆ.',
      category: 'ತಂತ್ರಜ್ಞಾನ',
      specs: { 'ತೂಕ': '೬೮೦ ಗ್ರಾಂ', 'ಸಂಪರ್ಕ': 'ವೈರ್‌ಲೆಸ್ / ಟೈಪ್-ಸಿ', 'ವಸ್ತು': 'ಅಲ್ಯೂಮಿನಿಯಂ' },
      altText: 'ಮ್ಯಾಟ್ ಕಪ್ಪು ಫಿನಿಶ್‌ನಲ್ಲಿ ಪ್ರೀಮಿಯಂ ಮೆಕ್ಯಾನಿಕಲ್ ಕೀಬೋರ್ಡ್',
    },
    'ta-IN': {
      name: 'மேட் விசைப்பலகை 1',
      description: 'விண்வெளி தர அலுமினியத்தின் ஒற்றைத் தொகுதியிலிருந்து இயந்திரமயமாக்கப்பட்ட அல்ட்ரா-லோ சுயவிவர மெக்கானிக்கல் விசைப்பலகை.',
      category: 'தொழில்நுட்பம்',
      specs: { 'எடை': '680 கிராம்', 'இணைப்பு': 'வயர்லெஸ் / டைப்-சி', 'பொருள்': 'அலுமினியம்' },
      altText: 'மேட் கருப்பு நிறத்தில் பிரீமியம் மெக்கானிக்கல் விசைப்பலகை',
    },
    'de-DE': {
      name: 'Matte Tastatur Modell 1',
      description: 'Eine extrem flache mechanische Tastatur, präzise aus einem massiven Block Luftfahrt-Aluminium gefräst. Veredelt mit reflexionsarmem Anthrazit.',
      category: 'Technologie',
      specs: { 'Gewicht': '680 g', 'Konnektivität': 'Kabellos / USB-C', 'Material': 'Aluminium' },
      altText: 'Präzisionsgefertigte mechanische Tastatur in mattschwarz',
    },
    'ar-AE': {
      name: 'لوحة مفاتيح مات 1',
      description: 'لوحة مفاتيح ميكانيكية فائقة النحافة مصنوعة من كتلة واحدة من الألومنيوم المستخدم في صناعة الطائرات بلون فحمي غير لامع.',
      category: 'التقنية',
      specs: { 'الوزن': '680 غرام', 'الاتصال': 'لاسلكي / Type-C', 'المادة': 'ألومنيوم' },
      altText: 'لوحة مفاتيح ميكانيكية دقيقة بلمسة غير لامعة',
    },
  },
  't-2': {
    'hi-IN': {
      name: 'सिरेमिक ईयरबड्स',
      description: 'टिकाऊ, मैट-तैयार सिरेमिक आवरण में उच्च-निष्ठा वायरलेस ऑडियो। शुद्ध ध्वनि और न्यूनतम उपस्थिति के लिए डिज़ाइन किया गया।',
      category: 'तकनीक',
      specs: { 'बैटरी': '३२ घंटे', 'शोर रद्दीकरण': 'सक्रिय एएनसी', 'वजन': '४५ ग्राम' },
      altText: 'सफेद सिरेमिक वायरलेस ईयरबड्स',
    },
    'kn-IN': {
      name: 'ಸೆರಾಮಿಕ್ ಇಯರ್‌ಬಡ್ಸ್',
      description: 'ಬಾಳಿಕೆ ಬರುವ ಮ್ಯಾಟ್ ಮುಕ್ತಾಯದ ಸೆರಾಮಿಕ್ ವಸತಿಯಲ್ಲಿ ಹೈ-ಫಿಡೆಲಿಟಿ ವೈರ್‌ಲೆಸ್ ಆಡಿಯೋ. ಪರಿಶುದ್ಧ ಧ್ವನಿಗಾಗಿ ವಿನ್ಯಾಸಗೊಳಿಸಲಾಗಿದೆ.',
      category: 'ತಂತ್ರಜ್ಞಾನ',
      specs: { 'ಬ್ಯಾಟರಿ': '೩೨ ಗಂಟೆಗಳು', 'ಶಬ್ದ ರದ್ದತಿ': 'ಸಕ್ರಿಯ ಎಎನ್‌ಸಿ', 'ತೂಕ': '೪೫ ಗ್ರಾಂ' },
      altText: 'ಸೆರಾಮಿಕ್ ವೈರ್‌ಲೆಸ್ ಇಯರ್‌ಬಡ್ಸ್',
    },
    'ta-IN': {
      name: 'செராமிக் இயர்பட்ஸ்',
      description: 'நீடித்த, மேட்-பினிஷ்டு செராமிக் உறையில் உயர்-வரிசை வயர்லெஸ் ஆடியோ. தூய ஒலிக்காக வடிவமைக்கப்பட்டுள்ளது.',
      category: 'தொழில்நுட்பம்',
      specs: { 'பேட்டரி': '32 மணிநேரம்', 'இரைச்சல் ரத்து': 'செயலில் ANC', 'எடை': '45 கிராம்' },
      altText: 'செராமிக் வயர்லெஸ் இயர்பட்ஸ்',
    },
    'de-DE': {
      name: 'Keramik In-Ear-Kopfhörer',
      description: 'Kristallklare kabellose Audioübertragung, geschützt durch ein samtig-mattes Keramikgehäuse mit aktiver Geräuschunterdrückung.',
      category: 'Technologie',
      specs: { 'Akkulaufzeit': '32 Stunden', 'Geräuschunterdrückung': 'Aktives ANC', 'Gewicht': '45 g' },
      altText: 'Hochwertige kabellose In-Ear-Kopfhörer aus matter Keramik',
    },
    'ar-AE': {
      name: 'سماعات أذن سيراميك',
      description: 'صوت لاسلكي عالي الدقة مغلف بغطاء سيراميك غير لامع ومقاوم للصدمات مع خاصية عزل الضوضاء النشط.',
      category: 'التقنية',
      specs: { 'البطارية': '32 ساعة', 'عزل الضوضاء': 'نشط ANC', 'الوزن': '45 غرام' },
      altText: 'سماعات أذن لاسلكية من السيراميك غير اللامع',
    },
  },
};

/**
 * Returns localized product fields, falling back safely to base product values
 */
export function getLocalizedProduct(
  productId: string,
  baseProduct: { name: string; description: string; category: string },
  localeCode: string = 'en-IN'
): LocalizedProductData {
  const productTranslations = CATALOG_LOCALIZATIONS[productId];
  if (!productTranslations) {
    return {
      name: baseProduct.name,
      description: baseProduct.description,
      category: baseProduct.category,
    };
  }

  const localized = productTranslations[localeCode];
  if (localized) {
    return {
      name: localized.name || baseProduct.name,
      description: localized.description || baseProduct.description,
      category: localized.category || baseProduct.category,
      specs: localized.specs,
      altText: localized.altText,
    };
  }

  return {
    name: baseProduct.name,
    description: baseProduct.description,
    category: baseProduct.category,
  };
}

/**
 * Formats neutral metric measurements (cm, kg) according to target locale config
 */
export function formatMeasurement(
  valueMetric: number,
  unitType: 'length_cm' | 'weight_kg',
  localeCode: string = 'en-IN'
): string {
  const config = getLocaleConfig(localeCode);
  const isImperial = config.unitSystem === 'imperial';

  if (unitType === 'length_cm') {
    if (isImperial) {
      // 1 cm = 0.393701 inches
      const inches = Math.round(valueMetric * 0.393701 * 10) / 10;
      return `${inches} in`;
    }
    return `${valueMetric} cm`;
  }

  if (unitType === 'weight_kg') {
    if (isImperial) {
      // 1 kg = 2.20462 lbs
      const lbs = Math.round(valueMetric * 2.20462 * 10) / 10;
      return `${lbs} lb`;
    }
    return `${valueMetric} kg`;
  }

  return `${valueMetric}`;
}
