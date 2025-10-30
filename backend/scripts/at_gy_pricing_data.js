/**
 * AT和GY系列执行器价格数据
 * 
 * 包含：
 * - AT系列单作用(SR)执行器 - 16个型号
 * - AT系列双作用(DA)执行器 - 16个型号
 * - GY系列单作用(SR)执行器 - 12个型号
 * - GY系列双作用(DA)执行器 - 12个型号
 */

// ===== 第一部分：AT系列 - 单作用 (SR) 执行器 (共 16 个型号) =====
const at_sr_data = [
  {
    model: 'AT-SR52K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 77, lowTemp: 86, highTemp: 122 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 1.5, description: '包含执行机构内所有密封件' }
  },
  {
    model: 'AT-SR63K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 102, lowTemp: 105, highTemp: 122 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 2.6 }
  },
  {
    model: 'AT-SR75K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 128, lowTemp: 132, highTemp: 153 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 3.0 }
  },
  {
    model: 'AT-SR83K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 157, lowTemp: 162, highTemp: 182 },
    handwheel: { model: 'SD-2', surcharge: 167 },
    repairKit: { price: 3.5 }
  },
  {
    model: 'AT-SR92K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 196, lowTemp: 202, highTemp: 232 },
    handwheel: { model: 'SD-2', surcharge: 167 },
    repairKit: { price: 4.3 }
  },
  {
    model: 'AT-SR105K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 252, lowTemp: 258, highTemp: 297 },
    handwheel: { model: 'SD-3', surcharge: 249 },
    repairKit: { price: 4.9 }
  },
  {
    model: 'AT-SR125K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 366, lowTemp: 375, highTemp: 417 },
    handwheel: { model: 'SD-3', surcharge: 249 },
    repairKit: { price: 6.5 }
  },
  {
    model: 'AT-SR140K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 533, lowTemp: 544, highTemp: 589 },
    handwheel: { model: 'SD-4', surcharge: 407 },
    repairKit: { price: 8.3 }
  },
  {
    model: 'AT-SR160K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 737, lowTemp: 751, highTemp: 801 },
    handwheel: { model: 'SD-4', surcharge: 407 },
    repairKit: { price: 9.9 }
  },
  {
    model: 'AT-SR190K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 1154, lowTemp: 1180, highTemp: 1281 },
    handwheel: { model: 'SD-5', surcharge: 702 },
    repairKit: { price: 19.9 }
  },
  {
    model: 'AT-SR210K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 1384, lowTemp: 1412, highTemp: 1527 },
    handwheel: { model: 'SD-5', surcharge: 702 },
    repairKit: { price: 21.3 }
  },
  {
    model: 'AT-SR240K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 1969, lowTemp: 2013, highTemp: 2146 },
    handwheel: { model: 'SD-6', surcharge: 932 },
    repairKit: { price: 24.6 }
  },
  {
    model: 'AT-SR270K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 2950, lowTemp: 2999, highTemp: 3141 },
    handwheel: { model: 'SD-7', surcharge: 1368 },
    repairKit: { price: 25.8 }
  },
  {
    model: 'AT-SR300K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 4466, lowTemp: 4552, highTemp: 4466 },
    handwheel: { model: '7寸球墨', surcharge: 2850 },
    repairKit: { price: 42.3 }
  },
  {
    model: 'AT-SR350K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 6852, lowTemp: 6952, highTemp: 7131 },
    handwheel: { model: '7寸球墨', surcharge: 2850 },
    repairKit: { price: 53.4 }
  },
  {
    model: 'AT-SR400K8', series: 'AT', type: 'Single Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 9736, lowTemp: 9896, highTemp: 10106 },
    handwheel: { model: '7寸球墨', surcharge: 4550 },
    repairKit: { price: 76.8 }
  }
];

// ===== 第二部分：AT系列 - 双作用 (DA) 执行器 (共 16 个型号) =====
const at_da_data = [
  {
    model: 'AT-DA52', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 64, lowTemp: 66, highTemp: 76 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 1.5 }
  },
  {
    model: 'AT-DA63', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 90, lowTemp: 93, highTemp: 110 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 2.6 }
  },
  {
    model: 'AT-DA75', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 110, lowTemp: 115, highTemp: 135 },
    handwheel: { model: 'SD-1', surcharge: 127 },
    repairKit: { price: 3.0 }
  },
  {
    model: 'AT-DA83', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 132, lowTemp: 137, highTemp: 158 },
    handwheel: { model: 'SD-2', surcharge: 167 },
    repairKit: { price: 3.5 }
  },
  {
    model: 'AT-DA92', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 169, lowTemp: 175, highTemp: 205 },
    handwheel: { model: 'SD-2', surcharge: 167 },
    repairKit: { price: 4.3 }
  },
  {
    model: 'AT-DA105', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 216, lowTemp: 222, highTemp: 255 },
    handwheel: { model: 'SD-3', surcharge: 249 },
    repairKit: { price: 4.9 }
  },
  {
    model: 'AT-DA125', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 312, lowTemp: 321, highTemp: 357 },
    handwheel: { model: 'SD-3', surcharge: 249 },
    repairKit: { price: 6.5 }
  },
  {
    model: 'AT-DA140', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 439, lowTemp: 450, highTemp: 489 },
    handwheel: { model: 'SD-4', surcharge: 407 },
    repairKit: { price: 8.3 }
  },
  {
    model: 'AT-DA160', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 595, lowTemp: 608, highTemp: 657 },
    handwheel: { model: 'SD-4', surcharge: 407 },
    repairKit: { price: 9.9 }
  },
  {
    model: 'AT-DA190', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 981, lowTemp: 1006, highTemp: 1099 },
    handwheel: { model: 'SD-5', surcharge: 702 },
    repairKit: { price: 19.9 }
  },
  {
    model: 'AT-DA210', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 1156, lowTemp: 1183, highTemp: 1291 },
    handwheel: { model: 'SD-5', surcharge: 702 },
    repairKit: { price: 21.3 }
  },
  {
    model: 'AT-DA240', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 1670, lowTemp: 1714, highTemp: 1822 },
    handwheel: { model: 'SD-6', surcharge: 932 },
    repairKit: { price: 24.6 }
  },
  {
    model: 'AT-DA270', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 2558, lowTemp: 2608, highTemp: 2732 },
    handwheel: { model: 'SD-7', surcharge: 1368 },
    repairKit: { price: 25.8 }
  },
  {
    model: 'AT-DA300', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 3850, lowTemp: 3936, highTemp: 4077 },
    handwheel: { model: '7寸球墨', surcharge: 2850 },
    repairKit: { price: 42.3 }
  },
  {
    model: 'AT-DA350', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 6034, lowTemp: 6134, highTemp: 6313 },
    handwheel: { model: '7寸球墨', surcharge: 2850 },
    repairKit: { price: 53.4 }
  },
  {
    model: 'AT-DA400', series: 'AT', type: 'Double Acting', material: '铝合金+硬质氧化',
    pricing: { standardTemp: 8900, lowTemp: 9110, highTemp: 9110 },
    handwheel: { model: '7寸球墨', surcharge: 4550 },
    repairKit: { price: 76.8 }
  }
];

// ===== 第三部分：GY系列 - 单作用 (SR) 执行器 (共 12 个型号) =====
const gy_sr_data = [
  { model: 'GY-52SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 770 } },
  { model: 'GY-63SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 860 } },
  { model: 'GY-83SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 1260 } },
  { model: 'GY-105SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 1970 } },
  { model: 'GY-125SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 2770 } },
  { model: 'GY-140SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 4070 } },
  { model: 'GY-160SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 5725 } },
  { model: 'GY-210SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 15010 } },
  { model: 'GY-240SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 25550 } },
  { model: 'GY-270SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 36800 } },
  { model: 'GY-300SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 40950 } },
  { model: 'GY-400SR', series: 'GY', type: 'Single Acting', material: '不锈钢', pricing: { standardTemp: 73450 } }
];

// ===== 第四部分：GY系列 - 双作用 (DA) 执行器 (共 12 个型号) =====
const gy_da_data = [
  { model: 'GY-52', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 740 } },
  { model: 'GY-63', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 820 } },
  { model: 'GY-83', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 1200 } },
  { model: 'GY-105', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 1860 } },
  { model: 'GY-125', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 2620 } },
  { model: 'GY-140', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 3840 } },
  { model: 'GY-160', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 5345 } },
  { model: 'GY-210', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 14360 } },
  { model: 'GY-240', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 24800 } },
  { model: 'GY-270', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 35950 } },
  { model: 'GY-300', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 39800 } },
  { model: 'GY-400', series: 'GY', type: 'Double Acting', material: '不锈钢', pricing: { standardTemp: 71900 } }
];

// 合并所有数据
const all_at_gy_data = [
  ...at_sr_data,
  ...at_da_data,
  ...gy_sr_data,
  ...gy_da_data
];

module.exports = {
  at_sr_data,
  at_da_data,
  gy_sr_data,
  gy_da_data,
  all_at_gy_data
};

