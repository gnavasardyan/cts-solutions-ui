import { db } from './db';
import { products } from '@shared/schema';

const metalConstructionProducts = [
  // Балки двутавровые
  {
    name: 'Балка двутавровая 20Б1',
    description: 'Стальная двутавровая балка для строительных конструкций промышленных зданий',
    category: 'beam',
    price: 15420,
    weight: 120.5,
    dimensions: '{"length": 6000, "height": 200, "width": 100, "thickness": 8.5, "webThickness": 5.6}',
    gost: 'ГОСТ 8239-89',
    inStock: 50,
    specifications: 'Сталь С255, марка стали по ГОСТ 27772-2015',
  },
  {
    name: 'Балка двутавровая 30Б1',
    description: 'Стальная двутавровая балка повышенной несущей способности для больших пролетов',
    category: 'beam',
    price: 28450,
    weight: 184.2,
    dimensions: '{"length": 6000, "height": 300, "width": 135, "thickness": 10.7, "webThickness": 6.5}',
    gost: 'ГОСТ 8239-89',
    inStock: 35,
    specifications: 'Сталь С345, класс прочности 345МПа',
  },
  {
    name: 'Балка двутавровая 40Б1',
    description: 'Тяжелая двутавровая балка для мостовых конструкций и крановых путей',
    category: 'beam',
    price: 42800,
    weight: 261.1,
    dimensions: '{"length": 12000, "height": 400, "width": 155, "thickness": 13, "webThickness": 8.3}',
    gost: 'ГОСТ 8239-89',
    inStock: 20,
    specifications: 'Сталь С345, термообработанная',
  },

  // Швеллеры
  {
    name: 'Швеллер 20П',
    description: 'Стальной швеллер с параллельными гранями полок для каркасных конструкций',
    category: 'beam',
    price: 18900,
    weight: 147.0,
    dimensions: '{"length": 6000, "height": 200, "width": 76, "thickness": 9, "webThickness": 5.9}',
    gost: 'ГОСТ 8240-97',
    inStock: 45,
    specifications: 'Сталь С255, горячекатаный профиль',
  },

  // Колонны
  {
    name: 'Колонна К-1 (сварная)',
    description: 'Сварная колонна из двутавра для каркаса одноэтажного промышленного здания',
    category: 'column',
    price: 25680,
    weight: 218.5,
    dimensions: '{"length": 3600, "width": 160, "height": 160, "baseWidth": 300, "baseHeight": 300}',
    gost: 'ГОСТ 23118-2012',
    inStock: 30,
    specifications: 'Колонна с базой, анкерные болты в комплекте',
  },
  {
    name: 'Колонна К-2 (составная)',
    description: 'Составная сварная колонна для многоэтажного каркасного здания',
    category: 'column', 
    price: 35420,
    weight: 295.8,
    dimensions: '{"length": 4800, "width": 200, "height": 200, "baseWidth": 400, "baseHeight": 400}',
    gost: 'ГОСТ 23118-2012',
    inStock: 22,
    specifications: 'Многоэтажная колонна с узлами сопряжения',
  },
  {
    name: 'Колонна крановая КК-1',
    description: 'Подкрановая колонна для мостовых кранов грузоподъемностью до 32т',
    category: 'column',
    price: 48900,
    weight: 420.3,
    dimensions: '{"length": 8400, "width": 240, "height": 600, "craneBracketHeight": 150}',
    gost: 'ГОСТ 23118-2012',
    inStock: 15,
    specifications: 'С подкрановой консолью и тормозной балкой',
  },

  // Фермы
  {
    name: 'Ферма покрытия Ф-18',
    description: 'Стропильная ферма треугольного очертания для покрытия промышленного здания',
    category: 'truss',
    price: 45280,
    weight: 385.2,
    dimensions: '{"span": 18000, "height": 2880, "width": 300, "nodeCount": 12}',
    gost: 'ГОСТ 23118-2012',
    inStock: 18,
    specifications: 'Ферма из уголков и труб, с фасонками',
  },
  {
    name: 'Ферма покрытия Ф-24',
    description: 'Стропильная ферма для больших пролетов складских и производственных зданий',
    category: 'truss',
    price: 68500,
    weight: 542.8,
    dimensions: '{"span": 24000, "height": 3840, "width": 300, "nodeCount": 16}',
    gost: 'ГОСТ 23118-2012',
    inStock: 12,
    specifications: 'Усиленная ферма для нагрузки до 250кг/м²',
  },
  {
    name: 'Ферма подстропильная ПФ-6',
    description: 'Подстропильная ферма для опирания прогонов кровли',
    category: 'truss',
    price: 28400,
    weight: 215.6,
    dimensions: '{"span": 6000, "height": 960, "width": 250, "nodeCount": 8}',
    gost: 'ГОСТ 23118-2012',
    inStock: 25,
    specifications: 'Легкая ферма из гнутых профилей',
  },

  // Соединения и крепеж
  {
    name: 'Болт высокопрочный М20×80',
    description: 'Комплект высокопрочного болтового соединения с гайкой и шайбами',
    category: 'connection',
    price: 485,
    weight: 0.82,
    dimensions: '{"diameter": 20, "length": 80, "threadLength": 52}',
    gost: 'ГОСТ 22353-77',
    inStock: 500,
    specifications: 'Класс прочности 10.9, оцинкованный',
  },
  {
    name: 'Болт высокопрочный М24×100',
    description: 'Усиленный болт для ответственных соединений металлоконструкций',
    category: 'connection',
    price: 650,
    weight: 1.25,
    dimensions: '{"diameter": 24, "length": 100, "threadLength": 62}',
    gost: 'ГОСТ 22353-77',
    inStock: 350,
    specifications: 'Класс прочности 10.9, термообработанный',
  },
  {
    name: 'Анкерный болт М30×500',
    description: 'Анкерный болт для крепления колонн к фундаменту',
    category: 'connection',
    price: 1250,
    weight: 3.8,
    dimensions: '{"diameter": 30, "length": 500, "anchorLength": 400}',
    gost: 'ГОСТ 24379.1-2012',
    inStock: 120,
    specifications: 'Тип 1.1, с анкерной плитой',
  },

  // Плиты перекрытия
  {
    name: 'Плита перекрытия ПК 60-15-8',
    description: 'Железобетонная предварительно напряженная плита перекрытия',
    category: 'slab',
    price: 18450,
    weight: 2650.0,
    dimensions: '{"length": 5980, "width": 1490, "height": 220}',
    gost: 'ГОСТ 9561-2016',
    inStock: 30,
    specifications: 'Бетон B30, арматура А500С',
  },
  {
    name: 'Плита перекрытия ПК 72-15-8',
    description: 'Железобетонная плита увеличенной длины для промышленных зданий',
    category: 'slab',
    price: 22100,
    weight: 3180.0,
    dimensions: '{"length": 7180, "width": 1490, "height": 220}',
    gost: 'ГОСТ 9561-2016',
    inStock: 25,
    specifications: 'Бетон B35, морозостойкость F200',
  },

  // Профнастил и ограждающие конструкции
  {
    name: 'Профлист Н75-750-0.8',
    description: 'Несущий профилированный лист для кровли и стен',
    category: 'beam',
    price: 850,
    weight: 9.2,
    dimensions: '{"length": 6000, "width": 750, "thickness": 0.8, "profileHeight": 75}',
    gost: 'ГОСТ 24045-2016',
    inStock: 200,
    specifications: 'Оцинкованная сталь с полимерным покрытием',
  },

  // Металлические лестницы
  {
    name: 'Лестница наружная ЛН-1',
    description: 'Наружная пожарная лестница с площадками и ограждениями',
    category: 'truss',
    price: 32800,
    weight: 285.4,
    dimensions: '{"height": 12000, "width": 800, "stepCount": 40, "platformCount": 4}',
    gost: 'ГОСТ 25772.10-83',
    inStock: 8,
    specifications: 'Антикоррозийное покрытие, поручни высотой 1200мм',
  },

  // Прогоны и связи
  {
    name: 'Прогон П-1 (из швеллера)',
    description: 'Прогон кровли из гнутого швеллера для крепления профнастила',
    category: 'beam',
    price: 4800,
    weight: 28.6,
    dimensions: '{"length": 6000, "height": 120, "width": 50, "thickness": 3}',
    gost: 'ГОСТ 8278-83',
    inStock: 80,
    specifications: 'Оцинкованный гнутый профиль',
  },
  {
    name: 'Связи вертикальные СВ-1',
    description: 'Вертикальные связи жесткости между колоннами',
    category: 'truss',
    price: 8900,
    weight: 65.2,
    dimensions: '{"length": 6000, "crossSectionArea": 156, "angleSize": 50}',
    gost: 'ГОСТ 8509-93',
    inStock: 40,
    specifications: 'Из равнополочных уголков 50×50×5',
  },
];

export async function initializeCatalogData() {
  console.log('Initializing expanded catalog data...');
  
  try {
    // Clear existing products
    await db.delete(products);
    
    // Insert new detailed products
    await db.insert(products).values(metalConstructionProducts);
    
    console.log(`Added ${metalConstructionProducts.length} metal construction products to catalog`);
    
  } catch (error) {
    console.error('Error initializing catalog data:', error);
    throw error;
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  initializeCatalogData()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}