// ==========================================
// ☁️ 云端核心代码：定投哲学铭牌
// 风格：极简黑金 / 赛博斯多葛
// ==========================================

module.exports.createWidget = async () => {
  const widget = new ListWidget();

  // --- 1. 背景样式设计 ---
  // 采用深邃的黑灰渐变，营造高端感和沉浸感
  let gradient = new LinearGradient();
  // 上半部分是深炭灰，下半部分是纯黑
  gradient.colors = [new Color("#1c1c1e"), new Color("#000000")];
  gradient.locations = [0, 0.8];
  widget.backgroundGradient = gradient;

  // 设置整体边距，让文字呼吸
  widget.setPadding(20, 20, 20, 20);


  // --- 2. 顶部视觉锚点 (Header) ---
  let headerStack = widget.addStack();
  headerStack.centerAlignContent();

  // 一个比特币橙色的小圆点，作为视觉引导
  let dotIcon = headerStack.addText("●");
  dotIcon.font = Font.blackSystemFont(8); // 特粗字体
  dotIcon.textColor = new Color("#F7931A"); // 比特币标志性橙色

  headerStack.addSpacer(5);

  // 小标题，定义这个组件的属性
  let titleText = headerStack.addText("定投哲学");
  titleText.font = Font.systemFont(10);
  titleText.textColor = new Color("#8e8e93"); // 苹果风格的次级灰色
  titleText.textOpacity = 0.8;

  // 增加 header 和正文之间的距离
  widget.addSpacer(15);


  // --- 3. 核心正文 (Main Content) ---
  // 你的那句金句
  const mainSentence = "定投是长期持有的唯一有效改良。";

  let bodyText = widget.addText(mainSentence);
  
  // 字体设计：大、粗、居中
  // 使用系统自带的衬线字体(Serif)或圆体(Rounded)可能会更有哲学味，
  // 但为了稳妥和力量感，这里选用 Bold System Font。
  bodyText.font = Font.boldSystemFont(18); 
  bodyText.textColor = Color.white(); // 纯白文字，最高对比度
  bodyText.centerAlignText(); // 居中对齐，庄重感

  // 允许文字在小尺寸组件下稍微缩小一点点以适应屏幕
  bodyText.minimumScaleFactor = 0.9;


  // --- 4. 底部装饰 (Optional Footnote) ---
  // 加一个微妙的底部，平衡视觉（可选）
  widget.addSpacer(); // 自动把上面的内容顶上去，把下面的顶下来
  let footerStack = widget.addStack();
  footerStack.addSpacer(); // 居中
  let footerText = footerStack.addText("₿ COMPOUND LIFE");
  footerText.font = Font.heavySystemFont(8);
  footerText.textColor = new Color("#333333"); // 极深的灰色，几乎隐形，增加层次感
  footerStack.addSpacer();


  return widget;
};
