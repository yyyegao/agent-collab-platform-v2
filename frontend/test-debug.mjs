import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

page.on('console', msg => console.log('Browser:', msg.text()));

await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:5173');
await page.waitForNetworkIdle({ timeout: 10000 });

// 刷新一下让 Vite 重新编译
await page.reload();
await page.waitForNetworkIdle({ timeout: 10000 });

console.log('=== Click 群聊 ===');
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  const buttons = header ? Array.from(header.querySelectorAll('button')) : [];
  const groupBtn = buttons.find(b => b.textContent.includes('群聊'));
  groupBtn?.click();
});
await new Promise(r => setTimeout(r, 2000));

// 检查是否有 w-72 侧边栏
const sidebarCheck = await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const flexContainer = main?.querySelector('.flex-1.flex.overflow-hidden');
  if (!flexContainer) return 'no flex container';
  
  const children = flexContainer.children;
  return Array.from(children).map(c => c.className);
});
console.log('Flex children classes:', sidebarCheck);

// 尝试点击可能的创建按钮 - 在第一个 w-72 中
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const flexContainer = main?.querySelector('.flex-1.flex.overflow-hidden');
  const firstChild = flexContainer?.children[0];
  
  if (firstChild) {
    const btn = firstChild.querySelector('button');
    console.log('First sidebar has button:', !!btn);
    if (btn) btn.click();
  }
});
await new Promise(r => setTimeout(r, 1000));

const modal = await page.evaluate(() => document.body.innerHTML.includes('创建群聊'));
console.log('Modal opened:', modal);

await browser.close();
