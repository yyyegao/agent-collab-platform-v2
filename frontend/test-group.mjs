import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:5173');
await page.waitForNetworkIdle({ timeout: 10000 });

// 1. 点击群聊
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  const buttons = header ? Array.from(header.querySelectorAll('button')) : [];
  const groupBtn = buttons.find(b => b.textContent.includes('群聊'));
  groupBtn?.click();
});
await new Promise(r => setTimeout(r, 2000));

// 2. 点击侧边栏的加号按钮
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const flexContainer = main?.querySelector('.flex-1.flex.overflow-hidden');
  const firstChild = flexContainer?.children[0];
  const btn = firstChild?.querySelector('button');
  btn?.click();
});
await new Promise(r => setTimeout(r, 1000));

// 3. 填写群聊名称
await page.evaluate(() => {
  const inputs = document.querySelectorAll('input');
  if (inputs.length > 0) inputs[0].value = '测试群聊';
});
await new Promise(r => setTimeout(r, 500));

// 4. 选择前两个 Agent
const clickAgents = async () => {
  const agentCards = await page.evaluate(() => {
    const modals = document.querySelectorAll('.modal-content');
    const modal = modals[modals.length - 1];
    if (!modal) return [];
    const cards = modal.querySelectorAll('.cursor-pointer');
    return Array.from(cards).slice(0, 2);
  });
  for (const card of agentCards) {
    card.click();
    await new Promise(r => setTimeout(r, 300));
  }
};
await clickAgents();

// 5. 点击创建按钮
await page.evaluate(() => {
  const buttons = Array.from(document.querySelectorAll('button'));
  const createBtn = buttons.find(b => b.textContent.includes('创建群聊') && !b.disabled);
  createBtn?.click();
});
await new Promise(r => setTimeout(r, 1000));

// 6. 检查是否创建成功
const success = await page.evaluate(() => {
  return document.body.innerHTML.includes('测试群聊');
});
console.log('Group created:', success);

await browser.close();
