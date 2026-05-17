// Catalog — each unit is an individual item with its own buy/arrival/note.
// status: 'in_stock' | 'sold'  (sold units have sell + sold date)
// Prices in thousands VND.

const CATEGORIES = [
  { id: 'keyboard',  name: 'Bàn phím',   color: '#ff6a3d' },
  { id: 'keycap',    name: 'Keycap',     color: '#f59e0b' },
  { id: 'phone',     name: 'Điện thoại', color: '#2563eb' },
  { id: 'mouse',     name: 'Chuột',      color: '#059669' },
  { id: 'cable',     name: 'Sạc & Cáp',  color: '#7c3aed' },
  { id: 'monitor',   name: 'Màn hình',   color: '#0f766e' },
  { id: 'accessory', name: 'Phụ kiện',   color: '#db2777' },
];

// Product catalog: category -> product line -> small classifications / variants.
// Transactions keep both productLineId and variantId, while name/variant remain denormalized for display.
const INITIAL_PRODUCT_LINES = [
  {
    id: 'aula-f75',
    cat: 'keyboard',
    brand: 'AULA',
    name: 'AULA F75',
    variants: [
      { id: 'aula-f75-white-blue-reaper', name: 'Trắng xanh · Switch Leobog Reaper', color: 'Trắng xanh', switch: 'Leobog Reaper' },
      { id: 'aula-f75-black-ice-vein', name: 'Đen · Switch Ice Vein', color: 'Đen', switch: 'Ice Vein' },
      { id: 'aula-f75-pink-crescent', name: 'Hồng · Switch Crescent', color: 'Hồng', switch: 'Crescent' },
    ],
  },
  {
    id: 'mini60he-pro',
    cat: 'keyboard',
    brand: 'Mini',
    name: 'Mini60he Pro',
    variants: [
      { id: 'mini60he-pro-black-fr4', name: 'Đen FR4', color: 'Đen', plate: 'FR4' },
      { id: 'mini60he-pro-white-fr4', name: 'Trắng FR4', color: 'Trắng', plate: 'FR4' },
      { id: 'mini60he-pro-pink-le', name: 'Hồng LE', color: 'Hồng', edition: 'LE' },
    ],
  },
  {
    id: 'keycap-xda',
    cat: 'keycap',
    brand: 'XDA',
    name: 'Keycap XDA',
    variants: [
      { id: 'keycap-xda-white-132', name: 'Trắng · 132 keys', color: 'Trắng', layout: '132 keys' },
      { id: 'keycap-xda-brown-132', name: 'Nâu · 132 keys', color: 'Nâu', layout: '132 keys' },
      { id: 'keycap-xda-cafe-132', name: 'Cafe · 132 keys', color: 'Cafe', layout: '132 keys' },
    ],
  },
  {
    id: 'iphone-15-pro',
    cat: 'phone',
    brand: 'Apple',
    name: 'iPhone 15 Pro',
    variants: [
      { id: 'iphone-15-pro-256-black', name: '256GB Titan Đen', storage: '256GB', color: 'Titan Đen' },
      { id: 'iphone-15-pro-256-white', name: '256GB Titan Trắng', storage: '256GB', color: 'Titan Trắng' },
      { id: 'iphone-15-pro-512-blue', name: '512GB Titan Xanh', storage: '512GB', color: 'Titan Xanh' },
    ],
  },
  {
    id: 'g-pro-x-superlight',
    cat: 'mouse',
    brand: 'Logitech',
    name: 'Logitech G Pro X Superlight',
    variants: [
      { id: 'g-pro-x-superlight-black', name: 'Đen', color: 'Đen' },
      { id: 'g-pro-x-superlight-white', name: 'Trắng', color: 'Trắng' },
    ],
  },
  {
    id: 'anker-65w-gan',
    cat: 'cable',
    brand: 'Anker',
    name: 'Sạc Anker 65W GaN',
    variants: [
      { id: 'anker-65w-gan-black', name: 'Đen', color: 'Đen' },
      { id: 'anker-65w-gan-white', name: 'Trắng', color: 'Trắng' },
    ],
  },
  {
    id: 'lg-ultragear-27gp850',
    cat: 'monitor',
    brand: 'LG',
    name: 'LG UltraGear 27GP850',
    variants: [
      { id: 'lg-ultragear-27gp850-2k-165', name: '27" · 2K · IPS · 165Hz', size: '27"', resolution: '2K', panel: 'IPS', refreshRate: '165Hz' },
      { id: 'lg-ultragear-27gp850-2k-180', name: '27" · 2K · IPS · 180Hz OC', size: '27"', resolution: '2K', panel: 'IPS', refreshRate: '180Hz OC' },
    ],
  },
  {
    id: 'aoc-q27g3xmn',
    cat: 'monitor',
    brand: 'AOC',
    name: 'AOC Q27G3XMN',
    variants: [
      { id: 'aoc-q27g3xmn-2k-mini-led-180', name: '27" · 2K · Mini LED · 180Hz', size: '27"', resolution: '2K', panel: 'Mini LED', refreshRate: '180Hz' },
    ],
  },
  {
    id: 'dell-p2723qe',
    cat: 'monitor',
    brand: 'Dell',
    name: 'Dell P2723QE',
    variants: [
      { id: 'dell-p2723qe-4k-usbc-60', name: '27" · 4K · IPS · USB-C · 60Hz', size: '27"', resolution: '4K', panel: 'IPS', refreshRate: '60Hz' },
    ],
  },
  {
    id: 'artisan-hien',
    cat: 'accessory',
    brand: 'Artisan',
    name: 'Lót chuột Artisan Hien',
    variants: [
      { id: 'artisan-hien-xl', name: 'XL', size: 'XL' },
      { id: 'artisan-hien-l', name: 'L', size: 'L' },
    ],
  },
];

const INITIAL_UNITS = [
  // ========== IN STOCK ==========
  // F75 — 3 units with different variants/prices
  { id: 'u001', productLineId: 'aula-f75', variantId: 'aula-f75-white-blue-reaper', name: 'AULA F75', cat: 'keyboard', variant: 'Trắng xanh · Switch Leobog Reaper', buy: 580, expectedSell: 680, arrived: '2026-05-08', note: '', status: 'in_stock' },
  { id: 'u002', productLineId: 'aula-f75', variantId: 'aula-f75-black-ice-vein', name: 'AULA F75', cat: 'keyboard', variant: 'Đen · Switch Ice Vein', buy: 620, expectedSell: 720, arrived: '2026-05-10', note: 'KH Hà Nội cọc 200K', status: 'in_stock' },
  { id: 'u003', productLineId: 'aula-f75', variantId: 'aula-f75-pink-crescent', name: 'AULA F75', cat: 'keyboard', variant: 'Hồng · Switch Crescent', buy: 590, expectedSell: 700, arrived: '2026-05-11', note: '', status: 'in_stock' },

  // Mini60he Pro — 3 units
  { id: 'u004', productLineId: 'mini60he-pro', variantId: 'mini60he-pro-black-fr4', name: 'Mini60he Pro', cat: 'keyboard', variant: 'Đen FR4',    buy: 370, expectedSell: 430, arrived: '2026-05-05', note: '', status: 'in_stock' },
  { id: 'u005', productLineId: 'mini60he-pro', variantId: 'mini60he-pro-white-fr4', name: 'Mini60he Pro', cat: 'keyboard', variant: 'Trắng FR4',  buy: 380, expectedSell: 450, arrived: '2026-05-05', note: '', status: 'in_stock' },
  { id: 'u006', productLineId: 'mini60he-pro', variantId: 'mini60he-pro-pink-le', name: 'Mini60he Pro', cat: 'keyboard', variant: 'Hồng LE',    buy: 395, expectedSell: 480, arrived: '2026-05-06', note: 'Bản giới hạn', status: 'in_stock' },

  // f108 Pro Mocha — 2 units
  { id: 'u007', name: 'f108 Pro Mocha FR4', cat: 'keyboard', variant: 'Mocha v1', buy: 778, expectedSell: 950, arrived: '2026-05-02', note: '', status: 'in_stock' },
  { id: 'u008', name: 'f108 Pro Mocha FR4', cat: 'keyboard', variant: 'Mocha v2', buy: 825, expectedSell: 980, arrived: '2026-05-04', note: '', status: 'in_stock' },

  // hi75c Pro — 2 units
  { id: 'u009', name: 'hi75c Pro FR4', cat: 'keyboard', variant: 'Đen',   buy: 683, expectedSell: 850, arrived: '2026-05-01', note: '', status: 'in_stock' },
  { id: 'u010', name: 'hi75c Pro FR4', cat: 'keyboard', variant: 'Trắng', buy: 695, expectedSell: 870, arrived: '2026-05-03', note: 'KH đặt sẵn',  status: 'in_stock' },

  // Wukong K87 Pro — 2 units
  { id: 'u011', name: 'Wukong K87 Pro', cat: 'keyboard', variant: 'Đỏ',  buy: 486, expectedSell: 720, arrived: '2026-05-07', note: '', status: 'in_stock' },
  { id: 'u012', name: 'Wukong K87 Pro', cat: 'keyboard', variant: 'Đen', buy: 510, expectedSell: 740, arrived: '2026-05-09', note: '', status: 'in_stock' },

  // Zoom75 / BOOG75
  { id: 'u013', name: 'Zoom75 Wireless', cat: 'keyboard', variant: 'Đen', buy: 1850, expectedSell: 2200, arrived: '2026-05-10', note: '', status: 'in_stock' },
  { id: 'u014', name: 'Meletrix BOOG75', cat: 'keyboard', variant: 'Trắng', buy: 1280, expectedSell: 1480, arrived: '2026-05-11', note: '', status: 'in_stock' },

  // Keycaps
  { id: 'u015', productLineId: 'keycap-xda', variantId: 'keycap-xda-white-132', name: 'Keycap XDA', cat: 'keycap', variant: 'Trắng · 132 keys', buy: 100, expectedSell: 145, arrived: '2026-05-01', note: '', status: 'in_stock' },
  { id: 'u016', productLineId: 'keycap-xda', variantId: 'keycap-xda-brown-132', name: 'Keycap XDA', cat: 'keycap', variant: 'Nâu · 132 keys', buy: 100, expectedSell: 140, arrived: '2026-05-01', note: '', status: 'in_stock' },
  { id: 'u017', productLineId: 'keycap-xda', variantId: 'keycap-xda-cafe-132', name: 'Keycap XDA', cat: 'keycap', variant: 'Cafe · 132 keys', buy: 100, expectedSell: 145, arrived: '2026-05-02', note: '', status: 'in_stock' },
  { id: 'u018', name: 'Keycap Topo Hồng', cat: 'keycap', variant: '132 keys', buy: 60,  expectedSell: 95,  arrived: '2026-05-02', note: 'Hàng nhập sỉ', status: 'in_stock' },
  { id: 'u019', name: 'Keycap GMK Olivia',cat: 'keycap', variant: 'Clone',    buy: 280, expectedSell: 380, arrived: '2026-05-08', note: '', status: 'in_stock' },
  { id: 'u020', name: 'Keycap Comic',     cat: 'keycap', variant: 'Đỏ',       buy: 108, expectedSell: 145, arrived: '2026-05-08', note: '', status: 'in_stock' },

  // Phones
  { id: 'u021', productLineId: 'iphone-15-pro', variantId: 'iphone-15-pro-256-black', name: 'iPhone 15 Pro', cat: 'phone', variant: '256GB Titan Đen',   buy: 24500, expectedSell: 27900, arrived: '2026-05-02', note: '',                  status: 'in_stock' },
  { id: 'u022', productLineId: 'iphone-15-pro', variantId: 'iphone-15-pro-256-white', name: 'iPhone 15 Pro', cat: 'phone', variant: '256GB Titan Trắng', buy: 24800, expectedSell: 28200, arrived: '2026-05-05', note: 'New seal',           status: 'in_stock' },
  { id: 'u023', productLineId: 'iphone-15-pro', variantId: 'iphone-15-pro-512-blue', name: 'iPhone 15 Pro', cat: 'phone', variant: '512GB Titan Xanh',  buy: 28200, expectedSell: 31500, arrived: '2026-05-07', note: '',                  status: 'in_stock' },
  { id: 'u024', name: 'Samsung S24 Ultra', cat: 'phone', variant: '512GB Đen',     buy: 22800, expectedSell: 26500, arrived: '2026-05-04', note: '',                  status: 'in_stock' },
  { id: 'u025', name: 'Xiaomi 14 Pro',  cat: 'phone', variant: '12/256 Trắng',     buy: 16200, expectedSell: 18900, arrived: '2026-05-06', note: '',                  status: 'in_stock' },

  // Mice
  { id: 'u026', productLineId: 'g-pro-x-superlight', variantId: 'g-pro-x-superlight-black', name: 'Logitech G Pro X Superlight', cat: 'mouse', variant: 'Đen',  buy: 2100, expectedSell: 2650, arrived: '2026-05-03', note: '', status: 'in_stock' },
  { id: 'u027', productLineId: 'g-pro-x-superlight', variantId: 'g-pro-x-superlight-white', name: 'Logitech G Pro X Superlight', cat: 'mouse', variant: 'Trắng',buy: 2120, expectedSell: 2680, arrived: '2026-05-05', note: '', status: 'in_stock' },
  { id: 'u028', name: 'Razer Viper V3 Pro', cat: 'mouse', variant: 'Đen',           buy: 2850, expectedSell: 3400, arrived: '2026-05-05', note: '', status: 'in_stock' },
  { id: 'u029', name: 'Razer Viper V3 Pro', cat: 'mouse', variant: 'Trắng',         buy: 2880, expectedSell: 3450, arrived: '2026-05-07', note: '', status: 'in_stock' },
  { id: 'u030', name: 'Pulsar X2H Mini',    cat: 'mouse', variant: 'Đen',           buy: 1450, expectedSell: 1850, arrived: '2026-05-08', note: '', status: 'in_stock' },
  { id: 'u031', name: 'Endgame Gear OP1 8K',cat: 'mouse', variant: 'Đen',           buy: 1680, expectedSell: 2100, arrived: '2026-05-09', note: '', status: 'in_stock' },

  // Cables / chargers
  { id: 'u032', productLineId: 'anker-65w-gan', variantId: 'anker-65w-gan-black', name: 'Sạc Anker 65W GaN',    cat: 'cable', variant: 'Đen',   buy: 480, expectedSell: 650, arrived: '2026-05-02', note: '', status: 'in_stock' },
  { id: 'u033', productLineId: 'anker-65w-gan', variantId: 'anker-65w-gan-white', name: 'Sạc Anker 65W GaN',    cat: 'cable', variant: 'Trắng', buy: 480, expectedSell: 650, arrived: '2026-05-02', note: '', status: 'in_stock' },
  { id: 'u034', name: 'Cáp USB-C Baseus 100W',cat: 'cable', variant: '1m',    buy: 95,  expectedSell: 150, arrived: '2026-05-04', note: '', status: 'in_stock' },
  { id: 'u035', name: 'Cáp USB-C Baseus 100W',cat: 'cable', variant: '2m',    buy: 120, expectedSell: 180, arrived: '2026-05-04', note: '', status: 'in_stock' },
  { id: 'u036', name: 'Sạc UGREEN Nexode 100W',cat: 'cable',variant: '',      buy: 720, expectedSell: 950, arrived: '2026-05-06', note: '', status: 'in_stock' },
  { id: 'u037', name: 'Cáp Lightning Coiled', cat: 'cable', variant: 'Đen',   buy: 180, expectedSell: 280, arrived: '2026-05-07', note: '', status: 'in_stock' },

  // Monitors
  { id: 'u041', productLineId: 'lg-ultragear-27gp850', variantId: 'lg-ultragear-27gp850-2k-165', name: 'LG UltraGear 27GP850', cat: 'monitor', variant: '27" · 2K · IPS · 165Hz', buy: 5200, expectedSell: 5990, arrived: '2026-05-12', note: 'Test mẫu gaming', status: 'in_stock' },
  { id: 'u042', productLineId: 'lg-ultragear-27gp850', variantId: 'lg-ultragear-27gp850-2k-180', name: 'LG UltraGear 27GP850', cat: 'monitor', variant: '27" · 2K · IPS · 180Hz OC', buy: 5450, expectedSell: 6290, arrived: '2026-05-13', note: '', status: 'in_stock' },
  { id: 'u043', productLineId: 'aoc-q27g3xmn', variantId: 'aoc-q27g3xmn-2k-mini-led-180', name: 'AOC Q27G3XMN', cat: 'monitor', variant: '27" · 2K · Mini LED · 180Hz', buy: 6100, expectedSell: 6990, arrived: '2026-05-14', note: 'HDR demo', status: 'in_stock' },
  { id: 'u044', productLineId: 'dell-p2723qe', variantId: 'dell-p2723qe-4k-usbc-60', name: 'Dell P2723QE', cat: 'monitor', variant: '27" · 4K · IPS · USB-C · 60Hz', buy: 7200, expectedSell: 8290, arrived: '2026-05-15', note: 'Mẫu văn phòng', status: 'in_stock' },

  // Accessories
  { id: 'u038', productLineId: 'artisan-hien', variantId: 'artisan-hien-xl', name: 'Lót chuột Artisan Hien', cat: 'accessory', variant: 'XL', buy: 1100, expectedSell: 1450, arrived: '2026-05-03', note: '',          status: 'in_stock' },
  { id: 'u039', name: 'Hub USB-C 7-in-1',       cat: 'accessory', variant: 'Xám',buy: 380,  expectedSell: 520,  arrived: '2026-05-05', note: '',          status: 'in_stock' },
  { id: 'u040', name: 'Đệm cổ tay gỗ óc chó',   cat: 'accessory', variant: '60%',buy: 220,  expectedSell: 320,  arrived: '2026-05-06', note: 'Handmade',   status: 'in_stock' },

  // ========== SOLD ==========
  { id: 's001', productLineId: 'aula-f75', variantId: 'aula-f75-white-blue-reaper', name: 'AULA F75', cat: 'keyboard', variant: 'Trắng xanh · Switch Leobog Reaper', buy: 580, sell: 650, arrived: '2026-04-28', sold: '2026-05-04', note: 'Xong 4/5', status: 'sold' },
  { id: 's002', productLineId: 'mini60he-pro', variantId: 'mini60he-pro-black-fr4', name: 'Mini60he Pro',       cat: 'keyboard', variant: 'Đen FR4',        buy: 370, sell: 430, arrived: '2026-04-28', sold: '2026-05-08', note: 'Tháng 4 bán 8/5',    status: 'sold' },
  { id: 's003', productLineId: 'mini60he-pro', variantId: 'mini60he-pro-white-fr4', name: 'Mini60he Pro',       cat: 'keyboard', variant: 'Trắng FR4',      buy: 370, sell: 430, arrived: '2026-04-28', sold: '2026-05-08', note: '',                   status: 'sold' },
  { id: 's004', name: 'f108 Pro Mocha FR4', cat: 'keyboard', variant: 'Mocha v1',   buy: 778, sell: 950, arrived: '2026-04-22', sold: '2026-05-08', note: 'BH 15 ngày',         status: 'sold' },
  { id: 's005', name: 'f108 Pro Mocha FR4', cat: 'keyboard', variant: 'Mocha v2',   buy: 825, sell: 980, arrived: '2026-04-25', sold: '2026-05-05', note: 'Đã ship',            status: 'sold' },
  { id: 's006', name: 'hi75c Pro FR4',      cat: 'keyboard', variant: 'Đen',        buy: 683, sell: 850, arrived: '2026-04-20', sold: '2026-05-12', note: '',                   status: 'sold' },
  { id: 's007', name: 'Wukong K87 Pro',     cat: 'keyboard', variant: 'Đỏ',         buy: 486, sell: 720, arrived: '2026-04-18', sold: '2026-05-07', note: 'Lời cao',            status: 'sold' },

  // LOSS / break-even examples
  { id: 's008', name: 'Mini60he Pro',       cat: 'keyboard', variant: 'Đen cũ',     buy: 338, sell: 300, arrived: '2026-04-15', sold: '2026-05-09', note: 'Trade lỗ, xả hàng tồn', status: 'sold' },
  { id: 's009', productLineId: 'keycap-xda', variantId: 'keycap-xda-white-132', name: 'Keycap XDA',   cat: 'keycap',   variant: 'Trắng · 132 keys',           buy: 100, sell: 100, arrived: '2026-04-10', sold: '2026-05-02', note: 'Trao đổi đổi mẫu',   status: 'sold' },

  { id: 's010', name: 'Keycap Comic',       cat: 'keycap',   variant: 'Đỏ',         buy: 108, sell: 145, arrived: '2026-04-10', sold: '2026-05-01', note: '',                   status: 'sold' },
  { id: 's011', name: 'Keycap Topo Hồng',   cat: 'keycap',   variant: '132 keys',   buy: 60,  sell: 95,  arrived: '2026-04-08', sold: '2026-05-09', note: '',                   status: 'sold' },

  // Phones sold
  { id: 's012', productLineId: 'iphone-15-pro', variantId: 'iphone-15-pro-256-black', name: 'iPhone 15 Pro',      cat: 'phone',    variant: '256GB Titan Đen',buy: 24500, sell: 27900, arrived: '2026-04-15', sold: '2026-05-11', note: 'KH cũ',          status: 'sold' },
  { id: 's013', name: 'iPhone 15 Pro',      cat: 'phone',    variant: '512GB',      buy: 27500, sell: 26800, arrived: '2026-04-20', sold: '2026-05-06', note: 'Cắt lỗ, máy bị trầy nhẹ', status: 'sold' }, // LOSS
  { id: 's014', name: 'Samsung S24 Ultra',  cat: 'phone',    variant: '256GB',      buy: 22800, sell: 26500, arrived: '2026-04-20', sold: '2026-05-10', note: '',               status: 'sold' },
  { id: 's015', name: 'Xiaomi 14 Pro',      cat: 'phone',    variant: '12/256',     buy: 16200, sell: 18900, arrived: '2026-04-25', sold: '2026-05-08', note: '',               status: 'sold' },
  { id: 's016', name: 'Pixel 8 Pro',        cat: 'phone',    variant: '128GB',      buy: 18500, sell: 21500, arrived: '2026-04-12', sold: '2026-05-03', note: '',               status: 'sold' },

  { id: 's017', productLineId: 'g-pro-x-superlight', variantId: 'g-pro-x-superlight-black', name: 'Logitech G Pro X Superlight', cat: 'mouse', variant: 'Đen',  buy: 2100, sell: 2650, arrived: '2026-04-10', sold: '2026-05-05', note: '',                 status: 'sold' },
  { id: 's018', name: 'Razer Viper V3 Pro', cat: 'mouse',    variant: 'Trắng',      buy: 2850, sell: 3400, arrived: '2026-04-18', sold: '2026-05-11', note: '',                 status: 'sold' },
  { id: 's019', name: 'Pulsar X2H Mini',    cat: 'mouse',    variant: 'Đen',        buy: 1450, sell: 1850, arrived: '2026-04-22', sold: '2026-05-09', note: '',                 status: 'sold' },
  { id: 's020', name: 'Endgame Gear OP1 8K',cat: 'mouse',    variant: '',           buy: 1680, sell: 1600, arrived: '2026-04-26', sold: '2026-05-12', note: 'Demo lỗi nhẹ',     status: 'sold' }, // LOSS

  { id: 's021', productLineId: 'anker-65w-gan', variantId: 'anker-65w-gan-black', name: 'Sạc Anker 65W GaN',  cat: 'cable',    variant: 'Đen',        buy: 480, sell: 650, arrived: '2026-04-05', sold: '2026-05-02', note: '',                   status: 'sold' },
  { id: 's022', productLineId: 'anker-65w-gan', variantId: 'anker-65w-gan-white', name: 'Sạc Anker 65W GaN',  cat: 'cable',    variant: 'Trắng',      buy: 480, sell: 650, arrived: '2026-04-05', sold: '2026-05-04', note: '',                   status: 'sold' },
  { id: 's023', name: 'Cáp USB-C Baseus 100W', cat: 'cable', variant: '1m',         buy: 95,  sell: 150, arrived: '2026-04-08', sold: '2026-05-06', note: '',                   status: 'sold' },
  { id: 's024', name: 'Sạc UGREEN Nexode 100W',cat: 'cable', variant: '',           buy: 720, sell: 950, arrived: '2026-04-14', sold: '2026-05-10', note: '',                   status: 'sold' },

  // Monitors sold
  { id: 's028', productLineId: 'lg-ultragear-27gp850', variantId: 'lg-ultragear-27gp850-2k-165', name: 'LG UltraGear 27GP850', cat: 'monitor', variant: '27" · 2K · IPS · 165Hz', buy: 5100, sell: 5890, arrived: '2026-04-24', sold: '2026-05-07', note: 'Khách build góc gaming', status: 'sold' },
  { id: 's029', productLineId: 'aoc-q27g3xmn', variantId: 'aoc-q27g3xmn-2k-mini-led-180', name: 'AOC Q27G3XMN', cat: 'monitor', variant: '27" · 2K · Mini LED · 180Hz', buy: 6000, sell: 6850, arrived: '2026-04-26', sold: '2026-05-10', note: 'Đã cân màu trước khi giao', status: 'sold' },

  { id: 's025', productLineId: 'artisan-hien', variantId: 'artisan-hien-xl', name: 'Lót chuột Artisan Hien', cat: 'accessory', variant: 'XL',    buy: 1100, sell: 1450, arrived: '2026-04-21', sold: '2026-05-08', note: '',                 status: 'sold' },
  { id: 's026', name: 'Hub USB-C 7-in-1',     cat: 'accessory', variant: 'Xám',     buy: 380,  sell: 520,  arrived: '2026-04-15', sold: '2026-05-04', note: '',                 status: 'sold' },
  { id: 's027', name: 'Đệm cổ tay gỗ óc chó', cat: 'accessory', variant: '',        buy: 220,  sell: 320,  arrived: '2026-04-18', sold: '2026-05-09', note: '',                 status: 'sold' },
];

window.INITIAL_CATEGORIES = CATEGORIES;
window.CATEGORIES = CATEGORIES;
window.INITIAL_PRODUCT_LINES = INITIAL_PRODUCT_LINES;
window.INITIAL_UNITS = INITIAL_UNITS;
