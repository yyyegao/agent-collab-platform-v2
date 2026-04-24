import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({
  headless: true,
  args: ['--no-sandbox']
});
const page = await browser.newPage();

await page.goto('http://localhost:5173');
await page.waitForNetworkIdle({ timeout: 10000 });

console.log('Page loaded');

// Find header section first
const headerButtons = await page.$$('header button');
console.log('Header buttons count:', headerButtons.length);

for (const btn of headerButtons) {
  const text = await btn.evaluate(el => el.textContent);
  console.log('Header button:', text);
  if (text.includes('群聊')) {
    await btn.click();
    console.log('Clicked 群聊 toggle');
    break;
  }
}

await new Promise(r => setTimeout(r, 1000));

// Click single chat toggle
const headerButtons2 = await page.$$('header button');
for (const btn of headerButtons2) {
  const text = await btn.evaluate(el => el.textContent);
  if (text.includes('单聊')) {
    await btn.click();
    console.log('Clicked 单聊 toggle');
    break;
  }
}

await new Promise(r => setTimeout(r, 1000));

const html = await page.content();
const hasCodeHelper = html.includes('代码助手');
const hasAgentList = html.includes('AgentChatList') || (html.includes('单聊') && html.includes('代码助手'));
const hasGroup = html.includes('项目讨论组');

console.log('After switching back:');
console.log('  Has 代码助手 (single):', hasCodeHelper);
console.log('  Has 群聊 (group):', hasGroup);

await browser.close();
console.log('Test done');
