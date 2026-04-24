import { chromium } from 'playwright';

const API_KEY = 'ak_2Dx9983ow3HU9Kl3Ht3Dl1Gq2mL4D';

const apiConfig = {
  provider: 'longcat',
  model: 'LongCat-Flash-Thinking-2601',
  apiKey: API_KEY,
  appId: '',
  baseUrl: 'https://api.longcat.chat/openai',
  systemPrompt: '',
};

async function fillApiKey() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🌐 打开前端页面...');
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 30000 });

    console.log('🔑 写入 localStorage...');
    await page.evaluate((config) => {
      localStorage.setItem('apiKey', config.apiKey);
      localStorage.setItem('apiConfig', JSON.stringify(config));
      localStorage.setItem('appId', config.appId || '');
    }, apiConfig);

    console.log('✅ API Key 已写入 localStorage');
    console.log('   - apiKey:', API_KEY);
    console.log('   - baseUrl:', apiConfig.baseUrl);
    console.log('   - model:', apiConfig.model);

    // 验证
    const stored = await page.evaluate(() => {
      return {
        apiKey: localStorage.getItem('apiKey'),
        apiConfig: localStorage.getItem('apiConfig'),
      };
    });

    console.log('\n📋 验证结果:');
    console.log('   apiKey 长度:', stored.apiKey?.length);
    console.log('   apiConfig 保存:', stored.apiConfig ? '✅' : '❌');

    if (stored.apiKey === API_KEY) {
      console.log('\n🎉 成功！刷新页面后去"设置"里确认即可');
    } else {
      console.log('\n❌ 写入失败');
    }

  } catch (err) {
    console.error('❌ 错误:', err.message);
  } finally {
    await browser.close();
  }
}

fillApiKey();
