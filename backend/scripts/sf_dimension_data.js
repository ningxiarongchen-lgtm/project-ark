/**
 * SF系列执行器尺寸数据
 * 
 * 包含：
 * - sharedDimensions: 按本体尺寸共享的法兰和顶部安装尺寸
 * - sf_all_dimensions_data: 所有型号的轮廓和气动连接尺寸
 */

// ===== 共享尺寸数据 (法兰和顶部安装) =====
const sharedDimensions = {
  'SF10': {
    flange: { 
      standard: 'ISO 5211 F10', 
      D: 102, 
      A: 70, 
      C: 102, 
      F: 10, 
      threadSpec: '4-M10', 
      threadDepth: 28, 
      B: 31.3, 
      T: 8 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF12': {
    flange: { 
      standard: 'ISO 5211 F12', 
      D: 125, 
      A: 85, 
      C: 125, 
      F: 10, 
      threadSpec: '4-M12', 
      threadDepth: 36, 
      B: 39.3, 
      T: 10 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF14': {
    flange: { 
      standard: 'ISO 5211 F14', 
      D: 140, 
      A: 100, 
      C: 140, 
      F: 10, 
      threadSpec: '4-M12', 
      threadDepth: 48, 
      B: 51.8, 
      T: 14 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF16': {
    flange: { 
      standard: 'ISO 5211 F16', 
      D: 165, 
      A: 130, 
      C: 165, 
      F: 18, 
      threadSpec: '4-M16', 
      threadDepth: 60, 
      B: 64.4, 
      T: 18 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 80, 
      h1: 20, 
      H: 20 
    }
  },
  'SF25': {
    flange: { 
      standard: 'ISO 5211 F25', 
      D: 254, 
      A: 185, 
      C: 254, 
      F: 18, 
      threadSpec: '8-M16', 
      threadDepth: 98, 
      B: 104.4, 
      T: 28 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF30': {
    flange: { 
      standard: 'ISO 5211 F30', 
      D: 298, 
      A: 230, 
      C: 298, 
      F: 28, 
      threadSpec: '8-M20', 
      threadDepth: 128, 
      B: 144.4, 
      T: 40 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF35': {
    flange: { 
      standard: 'ISO 5211 F35', 
      D: 356, 
      A: 260, 
      C: 356, 
      F: 40, 
      threadSpec: '8-M30', 
      threadDepth: 150, 
      B: 169.4, 
      T: 40 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF40': {
    flange: { 
      standard: 'ISO 5211 F40', 
      D: 406, 
      A: 300, 
      C: 406, 
      F: 40, 
      threadSpec: '8-M36', 
      threadDepth: 180, 
      B: 212.4, 
      T: 45 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF48': {
    flange: { 
      standard: 'ISO 5211 F48', 
      D: 483, 
      A: 350, 
      C: 483, 
      F: 45, 
      threadSpec: '12-M36', 
      threadDepth: 220, 
      B: 259.4, 
      T: 55 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  },
  'SF60': {
    flange: { 
      standard: 'ISO 5211 F60', 
      D: 603, 
      A: 470, 
      C: 603, 
      F: 63, 
      threadSpec: '20-M36', 
      threadDepth: 250, 
      B: 330.4, 
      T: 63 
    },
    topMounting: { 
      standard: 'NAMUR VDI/VDE 3845', 
      L: 130, 
      h1: 30, 
      H: 30 
    }
  }
};

// ===== 完整尺寸数据数组 =====
const sf_all_dimensions_data = [
  // --- 双作用 (DA) 型号 ---
  { model: 'SF10-150DA', bodySize: 'SF10', dimensions: { outline: { L2: 350, m1: 127, m2: 76, A: 143.5, H1: 40, H2: 82, D: 100 }, pneumaticConnection: { size: 'NPT1/4"' } } },
  { model: 'SF10-170DA', bodySize: 'SF10', dimensions: { outline: { L2: 350, m1: 127, m2: 76, A: 155.5, H1: 40, H2: 82, D: 100 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF12-170DA', bodySize: 'SF12', dimensions: { outline: { L2: 391, m1: 143, m2: 82, A: 165.5, H1: 50, H2: 84, D: 110 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF12-200DA', bodySize: 'SF12', dimensions: { outline: { L2: 391, m1: 143, m2: 82, A: 178, H1: 50, H2: 84, D: 110 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF14-200DA', bodySize: 'SF14', dimensions: { outline: { L2: 446, m1: 173, m2: 89, A: 188, H1: 60, H2: 95, D: 121 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF14-250DA', bodySize: 'SF14', dimensions: { outline: { L2: 446, m1: 173, m2: 89, A: 215, H1: 60, H2: 95, D: 121 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF14-300DA', bodySize: 'SF14', dimensions: { outline: { L2: 446, m1: 173, m2: 89, A: 242.5, H1: 60, H2: 95, D: 121 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-250DA', bodySize: 'SF16', dimensions: { outline: { L2: 513, m1: 198, m2: 112, A: 230, H1: 75, H2: 107, D: 139 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-300DA', bodySize: 'SF16', dimensions: { outline: { L2: 513, m1: 198, m2: 112, A: 257.5, H1: 75, H2: 107, D: 139 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-350DA', bodySize: 'SF16', dimensions: { outline: { L2: 513, m1: 198, m2: 112, A: 282.5, H1: 75, H2: 107, D: 139 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF25-350DA', bodySize: 'SF25', dimensions: { outline: { L2: 592, m1: 227, m2: 150, A: 287.5, H1: 90, H2: 118, D: 160 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF25-400DA', bodySize: 'SF25', dimensions: { outline: { L2: 592, m1: 227, m2: 150, A: 318, H1: 90, H2: 118, D: 160 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF25-450DA', bodySize: 'SF25', dimensions: { outline: { L2: 605, m1: 227, m2: 150, A: 348, H1: 90, H2: 118, D: 160 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF30-500DA', bodySize: 'SF30', dimensions: { outline: { L2: 715, m1: 277, m2: 175, A: 368, H1: 110, H2: 144, D: 176 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF30-550DA', bodySize: 'SF30', dimensions: { outline: { L2: 715, m1: 277, m2: 175, A: 395, H1: 110, H2: 144, D: 176 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF35-600DA', bodySize: 'SF35', dimensions: { outline: { L2: 833, m1: 334, m2: 207.5, A: 450, H1: 140, H2: 181, D: 194 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF35-700DA', bodySize: 'SF35', dimensions: { outline: { L2: 851, m1: 334, m2: 207.5, A: 475, H1: 140, H2: 181, D: 194 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-600DA', bodySize: 'SF40', dimensions: { outline: { L2: 982, m1: 401, m2: 237.5, A: 505, H1: 170, H2: 196, D: 216 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-700DA', bodySize: 'SF40', dimensions: { outline: { L2: 982, m1: 401, m2: 237.5, A: 525, H1: 170, H2: 196, D: 216 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-800DA', bodySize: 'SF40', dimensions: { outline: { L2: 986, m1: 401, m2: 237.5, A: 610, H1: 170, H2: 196, D: 216 }, pneumaticConnection: { size: 'NPT1.1/2"' } } },
  { model: 'SF48-800DA', bodySize: 'SF48', dimensions: { outline: { L2: 1131, m1: 455, m2: 280, A: 640, H1: 200, H2: 224, D: 243 }, pneumaticConnection: { size: 'NPT1.1/2"' } } },
  { model: 'SF48-900DA', bodySize: 'SF48', dimensions: { outline: { L2: 1151, m1: 455, m2: 280, A: 695, H1: 200, H2: 224, D: 243 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF48-1000DA', bodySize: 'SF48', dimensions: { outline: { L2: 1151, m1: 455, m2: 280, A: 745, H1: 200, H2: 224, D: 243 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-800DA', bodySize: 'SF60', dimensions: { outline: { L2: 1395, m1: 567, m2: 343, A: 710, H1: 230, H2: 258, D: 270 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-900DA', bodySize: 'SF60', dimensions: { outline: { L2: 1415, m1: 567, m2: 343, A: 765, H1: 230, H2: 258, D: 270 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-1000DA', bodySize: 'SF60', dimensions: { outline: { L2: 1415, m1: 567, m2: 343, A: 815, H1: 230, H2: 258, D: 270 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-1100DA', bodySize: 'SF60', dimensions: { outline: { L2: 1415, m1: 567, m2: 343, A: 865, H1: 230, H2: 258, D: 270 }, pneumaticConnection: { size: 'NPT2"' } } },

  // --- 单作用 (SR) 型号 ---
  { model: 'SF10-150SR3', bodySize: 'SF10', dimensions: { outline: { L1: 350, L2: 467, m1: 76, m2: 143.5, A: 40, H1: 82, H2: 100, D: 207 }, pneumaticConnection: { size: 'NPT1/4"' } } },
  { model: 'SF10-170SR3', bodySize: 'SF10', dimensions: { outline: { L1: 350, L2: 467, m1: 76, m2: 155.5, A: 40, H1: 82, H2: 100, D: 231 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF12-170SR3', bodySize: 'SF12', dimensions: { outline: { L1: 391, L2: 510, m1: 82, m2: 165.5, A: 50, H1: 84, H2: 110, D: 231 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF12-200SR3', bodySize: 'SF12', dimensions: { outline: { L1: 391, L2: 510, m1: 82, m2: 165.5, A: 50, H1: 84, H2: 110, D: 255 }, pneumaticConnection: { size: 'NPT3/8"' } } },
  { model: 'SF14-200SR3', bodySize: 'SF14', dimensions: { outline: { L1: 446, L2: 618, m1: 89, m2: 188, A: 60, H1: 95, H2: 121, D: 255 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF14-250SR3', bodySize: 'SF14', dimensions: { outline: { L1: 446, L2: 618, m1: 89, m2: 215, A: 60, H1: 95, H2: 121, D: 310 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF14-300SR3', bodySize: 'SF14', dimensions: { outline: { L1: 446, L2: 618, m1: 89, m2: 242.5, A: 60, H1: 95, H2: 121, D: 356 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-250SR3', bodySize: 'SF16', dimensions: { outline: { L1: 513, L2: 774, m1: 105, m2: 230, A: 75, H1: 107, H2: 139, D: 310 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-300SR3', bodySize: 'SF16', dimensions: { outline: { L1: 513, L2: 774, m1: 105, m2: 257.5, A: 75, H1: 107, H2: 139, D: 365 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF16-350SR3', bodySize: 'SF16', dimensions: { outline: { L1: 513, L2: 774, m1: 105, m2: 282.5, A: 75, H1: 107, H2: 139, D: 415 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF25-350SR3', bodySize: 'SF25', dimensions: { outline: { L1: 592, L2: 940, m1: 150, m2: 287.5, A: 90, H1: 118, H2: 160, D: 415 }, pneumaticConnection: { size: 'NPT1/2"' } } },
  { model: 'SF25-400SR3', bodySize: 'SF25', dimensions: { outline: { L1: 597, L2: 940, m1: 150, m2: 318, A: 90, H1: 118, H2: 160, D: 456 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF25-450SR3', bodySize: 'SF25', dimensions: { outline: { L1: 605, L2: 940, m1: 150, m2: 348, A: 90, H1: 118, H2: 160, D: 516 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF30-450SR3', bodySize: 'SF30', dimensions: { outline: { L1: 715, L2: 1165, m1: 175, m2: 368, A: 110, H1: 144, H2: 176, D: 516 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF30-500SR3', bodySize: 'SF30', dimensions: { outline: { L1: 715, L2: 1165, m1: 175, m2: 395, A: 110, H1: 144, H2: 176, D: 570 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF30-550SR3', bodySize: 'SF30', dimensions: { outline: { L1: 715, L2: 1165, m1: 175, m2: 420, A: 110, H1: 144, H2: 176, D: 620 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF35-550SR3', bodySize: 'SF35', dimensions: { outline: { L1: 833, L2: 1511, m1: 207.5, m2: 450, A: 140, H1: 181, H2: 194, D: 620 }, pneumaticConnection: { size: 'NPT3/4"' } } },
  { model: 'SF35-600SR3', bodySize: 'SF35', dimensions: { outline: { L1: 851, L2: 1511, m1: 207.5, m2: 475, A: 140, H1: 181, H2: 194, D: 670 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF35-700SR3', bodySize: 'SF35', dimensions: { outline: { L1: 851, L2: 1511, m1: 207.5, m2: 525, A: 140, H1: 181, H2: 194, D: 770 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-600SR3', bodySize: 'SF40', dimensions: { outline: { L1: 982, L2: 1760, m1: 237.5, m2: 505, A: 170, H1: 196, H2: 216, D: 670 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-700SR3', bodySize: 'SF40', dimensions: { outline: { L1: 982, L2: 1760, m1: 237.5, m2: 555, A: 170, H1: 196, H2: 216, D: 770 }, pneumaticConnection: { size: 'NPT1"' } } },
  { model: 'SF40-800SR3', bodySize: 'SF40', dimensions: { outline: { L1: 986, L2: 1760, m1: 237.5, m2: 610, A: 170, H1: 196, H2: 216, D: 880 }, pneumaticConnection: { size: 'NPT1.1/2"' } } },
  { model: 'SF48-800SR3', bodySize: 'SF48', dimensions: { outline: { L1: 1131, L2: 2283, m1: 280, m2: 640, A: 200, H1: 224, H2: 243, D: 880 }, pneumaticConnection: { size: 'NPT1.1/2"' } } },
  { model: 'SF48-900SR3', bodySize: 'SF48', dimensions: { outline: { L1: 1151, L2: 2283, m1: 280, m2: 695, A: 200, H1: 224, H2: 243, D: 990 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF48-1000SR3', bodySize: 'SF48', dimensions: { outline: { L1: 1151, L2: 2283, m1: 280, m2: 745, A: 200, H1: 224, H2: 243, D: 1090 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-800SR3', bodySize: 'SF60', dimensions: { outline: { L1: 1395, L2: 3025, m1: 343, m2: 710, A: 230, H1: 258, H2: 288, D: 880 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-900SR3', bodySize: 'SF60', dimensions: { outline: { L1: 1415, L2: 3025, m1: 343, m2: 765, A: 230, H1: 258, H2: 288, D: 990 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-1000SR3', bodySize: 'SF60', dimensions: { outline: { L1: 1415, L2: 3025, m1: 343, m2: 815, A: 230, H1: 258, H2: 288, D: 1090 }, pneumaticConnection: { size: 'NPT2"' } } },
  { model: 'SF60-1100SR3', bodySize: 'SF60', dimensions: { outline: { L1: 1415, L2: 3025, m1: 343, m2: 865, A: 230, H1: 258, H2: 288, D: 1190 }, pneumaticConnection: { size: 'NPT2"' } } }
];

module.exports = {
  sharedDimensions,
  sf_all_dimensions_data
};

