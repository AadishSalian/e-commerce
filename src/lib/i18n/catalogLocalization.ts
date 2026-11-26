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
    'es-ES': {
      name: 'Teclado Matte 1',
      description: 'Teclado mecánico ultraplano fresado a partir de un solo bloque de aluminio aeronáutico. Acabado en carbón mate.',
      category: 'Tecnología',
      specs: { 'Peso': '680 g', 'Conectividad': 'Inalámbrico / Tipo C', 'Material': 'Aluminio' },
      altText: 'Teclado mecánico premium acabado en negro mate',
    },
    'es-MX': {
      name: 'Teclado Matte 1',
      description: 'Teclado mecánico ultraplano fresado a partir de un solo bloque de aluminio aeronáutico.',
      category: 'Tecnología',
    },
    'fr-FR': {
      name: 'Clavier Matte Modèle 1',
      description: 'Clavier mécanique ultra-plat usiné dans un bloc massif d’aluminium aérospatial.',
      category: 'Technologie',
    },
    'ja-JP': {
      name: 'マットキーボード 1',
      description: '航空宇宙グレードのアルミニウム削り出しによる超薄型メカニカルキーボード。上質なマットチャコール仕上げ。',
      category: 'テクノロジー',
      specs: { '重量': '680g', '接続': 'ワイヤレス / Type-C', '素材': 'アルミニウム' },
    },
    'zh-CN': {
      name: '哑光机械键盘 1',
      description: '由单块航空级铝合金精雕细琢而成的超薄机械键盘。温润细腻的哑光炭黑质感。',
      category: '数码硬件',
      specs: { '重量': '680克', '连接方式': '无线 / Type-C', '材质': '航空级铝合金' },
    },
    'it-IT': {
      name: 'Tastiera Matte 1',
      description: 'Tastiera meccanica a profilo ultra-basso ricavata da un unico blocco di alluminio aerospaziale.',
      category: 'Tecnologia',
      specs: { 'Peso': '680 g', 'Connettività': 'Wireless / Type-C', 'Materiale': 'Alluminio' },
    },
    'pt-BR': {
      name: 'Teclado Matte 1',
      description: 'Teclado mecânico de perfil ultrabaixo usinado a partir de um bloco sólido de alumínio aeroespacial.',
      category: 'Tecnologia',
      specs: { 'Peso': '680 g', 'Conectividade': 'Sem fio / Type-C', 'Material': 'Alumínio' },
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
    'es-ES': {
      name: 'Auriculares Cerámicos',
      description: 'Audio inalámbrico de alta fidelidad con carcasa de cerámica mate duradera y cancelación activa de ruido.',
      category: 'Tecnología',
    },
    'fr-FR': {
      name: 'Écouteurs en Céramique',
      description: 'Audio sans fil haute-fidélité dans un boîtier céramique mat avec réduction active de bruit.',
      category: 'Technologie',
    },
    'ja-JP': {
      name: 'セラミックワイヤレスイヤホン',
      description: '高耐久マットセラミック筐体に包まれたハイファイワイヤレスオーディオ。純粋なサウンドとミニマルな佇まい。',
      category: 'テクノロジー',
    },
    'zh-CN': {
      name: '陶瓷无线耳机',
      description: '高保真无线音频，封装在耐用的哑光陶瓷外壳中。纯净音质与极简美学并存。',
      category: '数码硬件',
    },
    'it-IT': {
      name: 'Auricolari in Ceramica',
      description: 'Audio wireless ad alta fedeltà racchiuso in un resistente alloggiamento in ceramica con finitura opaca.',
      category: 'Tecnologia',
    },
    'pt-BR': {
      name: 'Fones de Ouvido em Cerâmica',
      description: 'Áudio sem fio de alta fidelidade envolvido em estrutura de cerâmica com acabamento fosco.',
      category: 'Tecnologia',
    },
  },
  't-3': {
    'hi-IN': {
      name: 'सटीक वायरलेस माउस',
      description: 'अर्गोनॉमिक सटीकता और स्पर्शनीय मैट फिनिश के साथ डिज़ाइन किया गया वायरलेस माउस।',
      category: 'तकनीक',
    },
    'kn-IN': {
      name: 'ನಿಖರ ವೈರ್‌ಲೆಸ್ ಮೌಸ್',
      description: 'ನಿಖರ ನಿಯಂತ್ರಣ ಮತ್ತು ಮ್ಯಾಟ್ ಫಿನಿಶ್ ಹೊಂದಿರುವ ವೈರ್‌ಲೆಸ್ ಮೌಸ್.',
      category: 'ತಂತ್ರಜ್ಞಾನ',
    },
    'ta-IN': {
      name: 'துல்லிய வயர்லெஸ் மவுஸ்',
      description: 'துல்லியமான கட்டுப்பாடு மற்றும் மேட் பூச்சு கொண்ட வயர்லெஸ் மவுஸ்.',
      category: 'தொழில்நுட்பம்',
    },
    'de-DE': {
      name: 'Präzisions-Maus Kabellos',
      description: 'Ergonomische kabellose Maus mit reflexionsarmem Finish und höchster Sensorpräzision.',
      category: 'Technologie',
    },
    'es-ES': {
      name: 'Ratón Inalámbrico de Precisión',
      description: 'Ratón ergonómico inalámbrico con acabado mate y máxima precisión óptica.',
      category: 'Tecnología',
    },
    'fr-FR': {
      name: 'Souris Sans Fil de Précision',
      description: 'Souris ergonomique haute précision avec finition mate protectrice.',
      category: 'Technologie',
    },
    'ar-AE': {
      name: 'فأرة لاسلكية دقيقة',
      description: 'فأرة مريحة بتصميم انسيابي ولمسة نهائية غير لامعة.',
      category: 'التقنية',
    },
    'ja-JP': {
      name: 'モノリス オーバーイヤーヘッドホン',
      description: 'ブルータリストなアルミニウムフレームに包まれたスタジオグレードのアコースティックエンジニアリング。',
      category: 'テクノロジー',
    },
    'zh-CN': {
      name: '巨石头戴式耳机',
      description: '包裹在硬朗铝合金框架中的录音室级声学工程，带来沉浸式声音体验。',
      category: '数码硬件',
    },
    'it-IT': {
      name: 'Cuffie Monolith Over-Ear',
      description: 'Ingegneria acustica da studio racchiusa in una cornice in alluminio brutalista.',
      category: 'Tecnologia',
    },
    'pt-BR': {
      name: 'Headphone Monolith Over-Ear',
      description: 'Engenharia acústica de estúdio envolvida em uma moldura de alumínio robusta.',
      category: 'Tecnologia',
    },
  },
  't-4': {
    'hi-IN': {
      name: 'एल्यूमिनियम डेस्क स्टैंड',
      description: 'सॉलिड एल्यूमिनियम ब्लॉक से निर्मित मजबूत लैपटॉप व मॉनिटर स्टैंड।',
      category: 'तकनीक',
    },
    'kn-IN': {
      name: 'ಅಲ್ಯೂಮಿನಿಯಂ ಡೆಸ್ಕ್ ಸ್ಟ್ಯಾಂಡ್',
      description: 'ಘನ ಅಲ್ಯೂಮಿನಿಯಂನಿಂದ ತಯಾರಿಸಲಾದ ದೃಢ ಡೆಸ್ಕ್ ಸ್ಟ್ಯಾಂಡ್.',
      category: 'ತಂತ್ರಜ್ಞಾನ',
    },
    'ta-IN': {
      name: 'அலுமினியம் டெஸ்க் ஸ்டாண்ட்',
      description: 'உறுதியான அலுமினியத்தால் செய்யப்பட்ட மேஜை ஸ்டாண்ட்.',
      category: 'தொழில்நுட்பம்',
    },
    'de-DE': {
      name: 'Aluminium-Schreibtischständer',
      description: 'Massiver Monitor- und Laptopständer aus matt eloxiertem Flugzeugaluminium.',
      category: 'Technologie',
    },
    'es-ES': {
      name: 'Soporte de Escritorio de Aluminio',
      description: 'Soporte macizo de aluminio anodizado mate para portátiles y pantallas.',
      category: 'Tecnología',
    },
    'fr-FR': {
      name: 'Support de Bureau en Aluminium',
      description: 'Support robuste en aluminium anodisé mat pour écrans et ordinateurs portables.',
      category: 'Technologie',
    },
    'ar-AE': {
      name: 'حامل مكتب ألومنيوم',
      description: 'حامل متين مصنوع من قطعة ألومنيوم صلبة لأجهزة الكمبيوتر المحمولة والشاشات.',
      category: 'التقنية',
    },
    'ja-JP': {
      name: 'アルミニウム デスクスタンド',
      description: 'ソリッドアルミニウムから削り出された、高品位なノートPC・モニタースタンド。',
      category: 'テクノロジー',
    },
    'zh-CN': {
      name: '铝合金桌面支架',
      description: '由实心铝块精密加工而成的高端笔记本与显示器支架。',
      category: '数码硬件',
    },
    'it-IT': {
      name: 'Supporto da Scrivania in Alluminio',
      description: 'Supporto massiccio in alluminio opaco per laptop e monitor.',
      category: 'Tecnologia',
    },
    'pt-BR': {
      name: 'Suporte de Mesa em Alumínio',
      description: 'Suporte robusto em alumínio anodizado fosco para notebooks e monitores.',
      category: 'Tecnologia',
    },
  },
};

/**
 * Returns localized product fields, falling back safely to base product values
 */
export function getLocalizedProduct(
  product: { id: string; name: string; description: string; category: string },
  localeCode?: string
): LocalizedProductData;
export function getLocalizedProduct(
  productId: string,
  baseProduct: { name: string; description: string; category: string },
  localeCode?: string
): LocalizedProductData;
export function getLocalizedProduct(
  arg1: string | { id: string; name: string; description: string; category: string },
  arg2?: { name: string; description: string; category: string } | string,
  arg3: string = 'en-IN'
): LocalizedProductData {
  let productId: string;
  let baseProduct: { name: string; description: string; category: string };
  let localeCode: string;

  if (typeof arg1 === 'string') {
    productId = arg1;
    baseProduct = arg2 as { name: string; description: string; category: string };
    localeCode = (arg3 as string) || 'en-IN';
  } else {
    productId = arg1.id;
    baseProduct = arg1;
    localeCode = (typeof arg2 === 'string' ? arg2 : 'en-IN');
  }

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
