/**
 * 定价工具模块单元测试
 * 
 * 测试框架: Jest
 * 测试对象: utils/pricing.js
 * 
 * 运行测试:
 *   npm test
 *   npm test -- pricing.test.js
 *   npm test -- --coverage
 */

const pricing = require('../utils/pricing');

describe('pricing.calculatePrice()', () => {
  // 模拟的价格档位数据
  const mockPriceTiers = [
    { min_quantity: 1, unit_price: 100 },
    { min_quantity: 10, unit_price: 90 }
  ];

  // 测试组 1: 基础功能测试
  describe('基础功能', () => {
    test('当 quantity=5 时，应该返回单价 100（使用第一档）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 5);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(100);
      expect(result.total_price).toBe(500); // 100 × 5
      expect(result.min_quantity).toBe(1);
      expect(result.quantity).toBe(5);
    });

    test('当 quantity=15 时，应该返回单价 90（使用第二档）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 15);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(90);
      expect(result.total_price).toBe(1350); // 90 × 15
      expect(result.min_quantity).toBe(10);
      expect(result.quantity).toBe(15);
    });

    test('当 quantity=1 时，应该返回单价 100（边界情况：最小值）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 1);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(100);
      expect(result.total_price).toBe(100);
      expect(result.min_quantity).toBe(1);
    });

    test('当 quantity=10 时，应该返回单价 90（边界情况：档位临界值）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 10);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(90);
      expect(result.total_price).toBe(900);
      expect(result.min_quantity).toBe(10);
    });

    test('当 quantity=9 时，应该返回单价 100（临界值前一个）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 9);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(100);
      expect(result.total_price).toBe(900);
      expect(result.min_quantity).toBe(1);
    });

    test('当 quantity=100 时，应该返回单价 90（大数量）', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 100);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(90);
      expect(result.total_price).toBe(9000);
      expect(result.min_quantity).toBe(10);
    });
  });

  // 测试组 2: 参数验证
  describe('参数验证', () => {
    test('当 priceTiers 为 null 时，应该返回 null', () => {
      const result = pricing.calculatePrice(null, 5);
      expect(result).toBeNull();
    });

    test('当 priceTiers 为空数组时，应该返回 null', () => {
      const result = pricing.calculatePrice([], 5);
      expect(result).toBeNull();
    });

    test('当 priceTiers 不是数组时，应该返回 null', () => {
      const result = pricing.calculatePrice('not an array', 5);
      expect(result).toBeNull();
    });

    test('当 quantity 为 0 时，应该使用默认值 1', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 0);
      
      expect(result).not.toBeNull();
      expect(result.quantity).toBe(1);
      expect(result.unit_price).toBe(100);
    });

    test('当 quantity 为负数时，应该使用默认值 1', () => {
      const result = pricing.calculatePrice(mockPriceTiers, -5);
      
      expect(result).not.toBeNull();
      expect(result.quantity).toBe(1);
      expect(result.unit_price).toBe(100);
    });

    test('当 quantity 未提供时，应该使用默认值 1', () => {
      const result = pricing.calculatePrice(mockPriceTiers);
      
      expect(result).not.toBeNull();
      expect(result.quantity).toBe(1);
      expect(result.unit_price).toBe(100);
    });
  });

  // 测试组 3: 价格类型 (price_type)
  describe('价格类型处理', () => {
    const tiersWithType = [
      { min_quantity: 1, unit_price: 100, price_type: 'normal' },
      { min_quantity: 10, unit_price: 90, price_type: 'normal' },
      { min_quantity: 1, unit_price: 120, price_type: 'high_temp' },
      { min_quantity: 10, unit_price: 108, price_type: 'high_temp' }
    ];

    test('当指定 price_type=normal 时，应该使用对应档位', () => {
      const result = pricing.calculatePrice(tiersWithType, 5, 'normal');
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(100);
      expect(result.price_type).toBe('normal');
    });

    test('当指定 price_type=high_temp 时，应该使用对应档位', () => {
      const result = pricing.calculatePrice(tiersWithType, 5, 'high_temp');
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(120);
      expect(result.price_type).toBe('high_temp');
    });

    test('当 price_type 未指定时，应该使用默认值 normal', () => {
      const result = pricing.calculatePrice(tiersWithType, 5);
      
      expect(result).not.toBeNull();
      expect(result.price_type).toBe('normal');
    });
  });

  // 测试组 4: 复杂场景
  describe('复杂场景', () => {
    const complexTiers = [
      { min_quantity: 1, unit_price: 5280 },
      { min_quantity: 5, unit_price: 5016 },
      { min_quantity: 10, unit_price: 4752 },
      { min_quantity: 20, unit_price: 4488 }
    ];

    test('4档阶梯定价 - 数量 8，应该使用第 2 档', () => {
      const result = pricing.calculatePrice(complexTiers, 8);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(5016);
      expect(result.total_price).toBe(40128); // 5016 × 8
      expect(result.min_quantity).toBe(5);
    });

    test('4档阶梯定价 - 数量 15，应该使用第 3 档', () => {
      const result = pricing.calculatePrice(complexTiers, 15);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(4752);
      expect(result.total_price).toBe(71280); // 4752 × 15
      expect(result.min_quantity).toBe(10);
    });

    test('4档阶梯定价 - 数量 50，应该使用第 4 档', () => {
      const result = pricing.calculatePrice(complexTiers, 50);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(4488);
      expect(result.total_price).toBe(224400); // 4488 × 50
      expect(result.min_quantity).toBe(20);
    });
  });

  // 测试组 5: 返回对象结构验证
  describe('返回对象结构', () => {
    test('返回对象应该包含所有必需字段', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 5);
      
      expect(result).toHaveProperty('unit_price');
      expect(result).toHaveProperty('total_price');
      expect(result).toHaveProperty('min_quantity');
      expect(result).toHaveProperty('quantity');
      expect(result).toHaveProperty('price_type');
    });

    test('返回的 total_price 应该等于 unit_price × quantity', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 5);
      
      expect(result.total_price).toBe(result.unit_price * result.quantity);
    });

    test('返回的字段类型应该正确', () => {
      const result = pricing.calculatePrice(mockPriceTiers, 5);
      
      expect(typeof result.unit_price).toBe('number');
      expect(typeof result.total_price).toBe('number');
      expect(typeof result.min_quantity).toBe('number');
      expect(typeof result.quantity).toBe('number');
      expect(typeof result.price_type).toBe('string');
    });
  });

  // 测试组 6: 边界和异常情况
  describe('边界和异常情况', () => {
    test('当数量小于所有档位的 min_quantity 时，应该返回最低档位并带警告', () => {
      const tiers = [
        { min_quantity: 5, unit_price: 100 },
        { min_quantity: 10, unit_price: 90 }
      ];
      
      const result = pricing.calculatePrice(tiers, 3);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(100);
      expect(result.warning).toBeDefined();
      expect(result.warning).toContain('低于最小起订量');
    });

    test('当档位乱序时，应该正确排序并计算', () => {
      const unsortedTiers = [
        { min_quantity: 10, unit_price: 90 },
        { min_quantity: 1, unit_price: 100 },
        { min_quantity: 20, unit_price: 80 }
      ];
      
      const result = pricing.calculatePrice(unsortedTiers, 15);
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(90);
      expect(result.min_quantity).toBe(10);
    });

    test('当只有一个档位时，应该始终返回该档位', () => {
      const singleTier = [
        { min_quantity: 1, unit_price: 100 }
      ];
      
      const result1 = pricing.calculatePrice(singleTier, 1);
      const result2 = pricing.calculatePrice(singleTier, 100);
      
      expect(result1.unit_price).toBe(100);
      expect(result2.unit_price).toBe(100);
    });
  });

  // 测试组 7: 性能测试
  describe('性能测试', () => {
    test('处理大量档位应该在合理时间内完成', () => {
      // 生成 100 个档位
      const largeTiers = Array.from({ length: 100 }, (_, i) => ({
        min_quantity: i + 1,
        unit_price: 1000 - i * 5
      }));
      
      const startTime = Date.now();
      const result = pricing.calculatePrice(largeTiers, 50);
      const endTime = Date.now();
      
      expect(result).not.toBeNull();
      expect(result.unit_price).toBe(755); // 1000 - 49 * 5
      expect(endTime - startTime).toBeLessThan(10); // 应该在 10ms 内完成
    });
  });
});

// 测试组 8: 集成测试（与其他函数配合）
describe('pricing 模块集成测试', () => {
  const mockPriceTiers = [
    { min_quantity: 1, unit_price: 100 },
    { min_quantity: 10, unit_price: 90 },
    { min_quantity: 20, unit_price: 80 }
  ];

  test('calculatePrice 与 getAllPriceTiers 配合使用', () => {
    const allTiers = pricing.getAllPriceTiers(mockPriceTiers);
    const price = pricing.calculatePrice(mockPriceTiers, 15);
    
    expect(allTiers).toHaveLength(3);
    expect(price.unit_price).toBe(90);
  });

  test('calculatePrice 与 calculateSavings 配合使用', () => {
    const price = pricing.calculatePrice(mockPriceTiers, 15);
    const savings = pricing.calculateSavings(mockPriceTiers, 15);
    
    expect(price.unit_price).toBe(90);
    expect(savings.actual_unit_price).toBe(90);
    expect(savings.base_unit_price).toBe(100);
  });

  test('calculatePrice 与 getRecommendedQuantity 配合使用', () => {
    const price = pricing.calculatePrice(mockPriceTiers, 15);
    const recommendation = pricing.getRecommendedQuantity(mockPriceTiers, 15);
    
    expect(price.unit_price).toBe(90);
    if (recommendation) {
      expect(recommendation.current_unit_price).toBe(90);
      expect(recommendation.next_tier_unit_price).toBe(80);
    }
  });
});

// 测试总结
describe('测试总结', () => {
  test('所有核心功能应该正常工作', () => {
    const mockPriceTiers = [
      { min_quantity: 1, unit_price: 100 },
      { min_quantity: 10, unit_price: 90 }
    ];
    
    // 测试核心逻辑
    const result1 = pricing.calculatePrice(mockPriceTiers, 5);
    const result2 = pricing.calculatePrice(mockPriceTiers, 15);
    
    // 核心断言
    expect(result1.unit_price).toBe(100);
    expect(result2.unit_price).toBe(90);
    
    // 总价计算正确
    expect(result1.total_price).toBe(500);
    expect(result2.total_price).toBe(1350);
    
    // 档位选择正确
    expect(result1.min_quantity).toBe(1);
    expect(result2.min_quantity).toBe(10);
  });
});

