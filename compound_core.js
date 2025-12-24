// ==========================================
// ☁️ 云端核心代码 (Compound Core)
// 文件名: compound_core.js
// ==========================================

module.exports.createWidget = async (userBTC) => {
  // 1. 默认配置与参数处理
  // 如果用户没填参数，默认显示 1 BTC
  const MY_BTC_AMOUNT = parseFloat(userBTC) || 1.0; 
  const CURRENCY = "cny"; // cny 或 usd
  const ANCHOR_ITEM = "tesla"; // tesla, coffee, house

  // 2. 数据源定义
  const API_URL = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${CURRENCY}`;
  const PRICES = {
    "cny": { "tesla": 250000, "coffee": 30, "house": 1000000 },
    "usd": { "tesla": 35000, "coffee": 5, "house": 150000 }
  };
  const LABELS = {
    "tesla": { emoji: "🚘", name: "Model 3" },
    "coffee": { emoji: "☕", name: "星巴克" },
    "house": { emoji: "🏠", name: "房产首付" }
  };

  // 3. 创建组件 UI
  const widget = new ListWidget();
  
  // 背景：深邃黑金渐变
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#1a1a1a"), new Color("#2a2a2a")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;

  // 获取价格
  let btcPrice = await getBTCPrice(API_URL, CURRENCY);
  let totalValue = btcPrice * MY_BTC_AMOUNT;
  
  // 计算购买力
  let itemPrice = PRICES[CURRENCY][ANCHOR_ITEM];
  let powerCount = (totalValue / itemPrice).toFixed(1); 
  let itemInfo = LABELS[ANCHOR_ITEM];

  // 获取排名文案
  let rankInfo = getRank(MY_BTC_AMOUNT);

  // --- 绘制 UI ---
  
  // Header
  let headerStack = widget.addStack();
  let logoText = headerStack.addText("₿ 复利人生"); // 这里你可以随时远程改名
  logoText.font = Font.boldSystemFont(10);
  logoText.textColor = new Color("#F7931A");
  
  widget.addSpacer(6);

  // Amount
  let amountText = widget.addText(MY_BTC_AMOUNT.toString() + " BTC");
  amountText.font = Font.heavySystemFont(22);
  amountText.textColor = Color.white();
  
  widget.addSpacer(4);

  // Power
  let powerStack = widget.addStack();
  powerStack.centerAlignContent();
  let emojiText = powerStack.addText(itemInfo.emoji + " ");
  emojiText.font = Font.systemFont(12);
  let valText = powerStack.addText("≈ " + powerCount + " " + itemInfo.name);
  valText.font = Font.mediumSystemFont(12);
  valText.textColor = new Color("#aaaaaa");

  widget.addSpacer(6);

  // Rank
  let rankText = widget.addText(rankInfo);
  rankText.font = Font.boldSystemFont(10);
  rankText.textColor = MY_BTC_AMOUNT >= 1 ? new Color("#FFD700") : new Color("#20B2AA");
  
  // 底部公告栏 (这是你的远程扩音器！)
  // 你可以在云端随时加一行字，所有用户都会看到
  // widget.addSpacer(4);
  // let notice = widget.addText("🔔 今晚8点社群直播");
  // notice.font = Font.systemFont(8);
  // notice.textColor = Color.red();

  return widget;
};

// 辅助函数：获取价格
async function getBTCPrice(url, currency) {
  try {
    let req = new Request(url);
    let json = await req.loadJSON();
    return json.bitcoin[currency];
  } catch (e) {
    return 0; // 离线处理
  }
}

// 辅助函数：计算排名
function getRank(amount) {
  if (amount >= 10) return "🐋 巨鲸：全球前 0.001%";
  if (amount >= 1) return "🏆 2100万俱乐部成员";
  if (amount >= 0.1) return "🥈 超过全球 97% 的人";
  return "🌱 正在改变命运的路上";
}
