// ==========================================
// ☁️ 云端核心：BTC vs Gold 进度条 (Rich UI)
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 数据配置 ---
  // 黄金总市值 (约 17.5 万亿美元，作为常量锚点)
  const GOLD_MARKET_CAP_USD = 17500000000000; 
  
  // 获取 BTC 数据
  const data = await getBTCData();
  const btcCap = data.market_cap.usd;
  const btcPrice = data.current_price.usd;

  // 计算进度
  let progress = btcCap / GOLD_MARKET_CAP_USD;
  // 防止溢出 (虽然还得等很久)
  if (progress > 1) progress = 1;
  
  let percentage = (progress * 100).toFixed(2) + "%";
  
  // 计算目标币价 (市值追平黄金时的单价)
  // 目标价 = 当前价 / 进度
  let targetPrice = (btcPrice / progress).toLocaleString('en-US', {maximumFractionDigits: 0});


  // --- 2. 背景设计 ---
  let gradient = new LinearGradient();
  gradient.colors = [new Color("#141414"), new Color("#1C1C1E")];
  gradient.locations = [0, 1];
  widget.backgroundGradient = gradient;
  
  // 设置内边距
  widget.setPadding(16, 16, 16, 16);


  // --- 3. UI 布局 ---

  // [Header] 标题栏
  let header = widget.addStack();
  header.centerAlignContent();
  let title = header.addText("🟡 GOLD PARITY"); // 黄金对标
  title.font = Font.heavySystemFont(10);
  title.textColor = new Color("#8E8E93");
  header.addSpacer();
  let status = header.addText("TARGET: $" + targetPrice); // 显示目标价
  status.font = Font.systemFont(10);
  status.textColor = new Color("#333333"); // 隐约可见，不抢眼

  widget.addSpacer(12);


  // [Hero] 核心百分比大字
  let percentText = widget.addText(percentage);
  percentText.font = Font.heavySystemFont(32);
  percentText.textColor = new Color("#FFD700"); // 金色高亮
  // 给文字加个阴影效果
  percentText.shadowColor = new Color("#F7931A", 0.3);
  percentText.shadowRadius = 3;
  percentText.shadowOffset = new Point(0, 2);

  widget.addSpacer(4);
  
  // 描述小字
  let subText = widget.addText(`已完成黄金市值的 ${percentage}`);
  subText.font = Font.systemFont(12);
  subText.textColor = Color.white();
  subText.textOpacity = 0.6;

  widget.addSpacer(12);


  // [Visual] 动态绘制进度条 (核心黑科技)
  // 我们在内存里画一张图，然后贴上去
  let barImg = drawProgressBar(progress);
  let barView = widget.addImage(barImg);
  barView.imageSize = new Size(280, 12); // 设置进度条尺寸
  barView.cornerRadius = 6; // 圆角


  // [Footer] 底部对比数据
  widget.addSpacer(10);
  let footer = widget.addStack();
  footer.centerAlignContent();

  // 左边：BTC Logo + 市值
  let btcIcon = footer.addText("🟠");
  btcIcon.font = Font.systemFont(10);
  footer.addSpacer(4);
  let btcVal = footer.addText("$" + (btcCap / 1e12).toFixed(1) + "T"); // 万亿单位
  btcVal.font = Font.boldSystemFont(11);
  btcVal.textColor = Color.white();

  footer.addSpacer(); // 撑开中间

  // 右边：Gold Logo + 市值
  let goldVal = footer.addText("$" + (GOLD_MARKET_CAP_USD / 1e12).toFixed(1) + "T");
  goldVal.font = Font.boldSystemFont(11);
  goldVal.textColor = new Color("#8E8E93"); // 灰色，代表旧时代
  footer.addSpacer(4);
  let goldIcon = footer.addText("🟡");
  goldIcon.font = Font.systemFont(10);


  return widget;
};

// --- 辅助函数：绘制进度条 ---
function drawProgressBar(progress) {
  // 定义画布尺寸
  const width = 600;
  const height = 24;
  let ctx = new DrawContext();
  ctx.size = new Size(width, height);
  ctx.respectScreenScale = true;

  // 1. 绘制轨道 (背景底槽)
  let trackPath = new Path();
  trackPath.addRoundedRect(new Rect(0, 0, width, height), height / 2, height / 2);
  ctx.addPath(trackPath);
  ctx.setFillColor(new Color("#333333")); // 深灰色底槽
  ctx.fillPath();

  // 2. 绘制进度 (前景填充)
  // 算出填充的宽度
  let fillWidth = width * progress;
  if (fillWidth < height) fillWidth = height; // 最小显示一个圆点

  let fillPath = new Path();
  fillPath.addRoundedRect(new Rect(0, 0, fillWidth, height), height / 2, height / 2);
  ctx.addPath(fillPath);
  
  // 渐变色填充：从比特币橙 -> 闪亮金
  // 这是一个水平渐变
  // 注意：Scriptable DrawContext 填充渐变比较复杂，这里用纯色或简单的技巧
  ctx.setFillColor(new Color("#F7931A")); // 核心橙色
  ctx.fillPath();

  return ctx.getImage();
}

// --- 辅助函数：获取数据 ---
async function getBTCData() {
  const url = "https://api.coingecko.com/api/v3/coins/bitcoin?localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";
  try {
    let req = new Request(url);
    let json = await req.loadJSON();
    return json.market_data;
  } catch (e) {
    return { 
      market_cap: { usd: 1900000000000 }, 
      current_price: { usd: 95000 } 
    }; // 离线默认值
  }
}
