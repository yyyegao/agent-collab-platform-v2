import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

await page.setViewport({ width: 1280, height: 800 });
await page.goto('http://localhost:5173');
await page.waitForNetworkIdle({ timeout: 10000 });

console.log('=== Initial ===');
let initialHeader = await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  return header ? header.textContent : 'no header';
});
console.log('Initial header:', initialHeader.includes('单聊'), initialHeader.includes('群聊'));

// Click 群聊
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  const buttons = header ? Array.from(header.querySelectorAll('button')) : [];
  const groupBtn = buttons.find(b => b.textContent.includes('群聊'));
  groupBtn?.click();
});
await new Promise(r => setTimeout(r, 1000));

console.log('\n=== After 群聊 ===');
let afterGroupHeader = await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  return header ? header.textContent : 'no header';
});
console.log('After group header:', afterGroupHeader);

// Click 单聊
await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  const buttons = header ? Array.from(header.querySelectorAll('button')) : [];
  const singleBtn = buttons.find(b => b.textContent.includes('单聊'));
  singleBtn?.click();
});
await new Promise(r => setTimeout(r, 1000));

console.log('\n=== After 单聊 ===');
let afterSingleHeader = await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const header = main?.querySelector('header');
  return header ? header.textContent : 'no header';
});
console.log('After single header:', afterSingleHeader);

// Check sidebar content
let sidebarContent = await page.evaluate(() => {
  const main = document.querySelector('.md\\:ml-64');
  const sidebar = main?.querySelector('.border-r.border-gray-200');
  return sidebar ? sidebar.textContent : 'no sidebar';
});
console.log('Sidebar has 单聊 section:', sidebarContent.includes('单聊'));
console.log('Sidebar has 代码助手:', sidebarContent.includes('代码助手'));

await browser.close();
console.log('\n✅ Test completed!');
