/**
 * 动态问候语工具函数
 * 根据日期、时间和星期生成个性化问候语
 */

/**
 * 获取动态问候语
 * @returns {string} 根据当前时间和日期返回的问候语
 */
export const getDynamicGreeting = () => {
  const now = new Date();
  const day = now.getDay(); // 0-6, 0是周日
  const hour = now.getHours(); // 0-23

  // 定义语录库
  const workDayQuotes = [
    "新的一天，从解决一个难题开始！",
    "你的努力，正在为中国制造业创造价值。",
    "每一个细节，都铸就卓越品质。",
    "保持专注，今天又是高效的一天！",
    "匠心工艺，始于每一个选型决策。",
    "数据驱动决策，智能引领未来。",
    "精益求精，为客户创造更大价值。",
    "今天的效率，决定明天的成就。"
  ];

  const eveningQuotes = [
    "辛苦了！感谢你今天的辛勤付出。",
    "工作结束，请好好休息，享受生活。",
    "平衡工作与生活，才能走得更远。",
    "今天也完成了很多工作，为自己点赞！",
    "下班啦！放松心情，明天继续加油。",
    "感谢你的敬业精神，期待明天的精彩。"
  ];

  const weekendQuotes = [
    "周末愉快！感谢你为公司的付出，请尽情享受休息时光。",
    "好好充电，周一我们继续创造精彩！",
    "工作诚可贵，休息价更高，周末好好放松吧！",
    "周末时光，陪陪家人，享受生活。",
    "劳逸结合，才能保持最佳状态。祝周末愉快！"
  ];

  // 随机选择函数
  const getRandomQuote = (quotes) => {
    return quotes[Math.floor(Math.random() * quotes.length)];
  };

  // 判断逻辑
  if (day === 0 || day === 6) {
    // 周末
    return getRandomQuote(weekendQuotes);
  } else {
    // 工作日
    if (hour >= 8 && hour < 18) {
      // 工作时间 (8:00-17:59)
      return getRandomQuote(workDayQuotes);
    } else {
      // 早晚时间
      return getRandomQuote(eveningQuotes);
    }
  }
};

/**
 * 获取时段问候语
 * @returns {string} 根据当前时间返回"早上好"、"下午好"或"晚上好"
 */
export const getTimeGreeting = () => {
  const hour = new Date().getHours();

  if (hour >= 0 && hour < 6) {
    return "深夜好";
  } else if (hour >= 6 && hour < 9) {
    return "早上好";
  } else if (hour >= 9 && hour < 12) {
    return "上午好";
  } else if (hour >= 12 && hour < 14) {
    return "中午好";
  } else if (hour >= 14 && hour < 18) {
    return "下午好";
  } else if (hour >= 18 && hour < 22) {
    return "晚上好";
  } else {
    return "夜深了";
  }
};

/**
 * 获取完整的个性化问候信息
 * @param {string} userName - 用户姓名
 * @returns {object} 包含问候语、语录和额外信息的对象
 */
export const getFullGreeting = (userName = "用户") => {
  const timeGreeting = getTimeGreeting();
  const quote = getDynamicGreeting();
  const now = new Date();
  const day = now.getDay();
  const isWeekend = day === 0 || day === 6;

  return {
    greeting: `${userName}, ${timeGreeting}！`,
    quote,
    isWeekend,
    time: now,
    dayOfWeek: ['周日', '周一', '周二', '周三', '周四', '周五', '周六'][day]
  };
};

