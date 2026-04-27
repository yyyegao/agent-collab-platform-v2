import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    await page.goto('http://localhost:3000', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(3000);
    console.log('✓ Page loaded');

    // Page loads in chat tab (activeTab = 'chat') - no need to click anything
    // The left panel should show AgentChatList with no-session agents

    // Check if we can find any .card-warm elements in the left panel
    const leftPanel = page.locator('.w-72.border-r');
    const cardCount = await leftPanel.locator('.card-warm').count();
    console.log(`Cards in left panel initially: ${cardCount}`);

    // Navigate to Agent List
    await page.locator('.sidebar-warm button', { hasText: 'Agent 列表' }).click();
    await page.waitForTimeout(2000);
    console.log('✓ Agent List tab opened');

    // Create agent
    await page.locator('button.bg-accent-orange').first().click();
    await page.waitForTimeout(2000);
    const avatarImgs = page.locator('.modal-content-warm button img');
    await avatarImgs.nth(6).click();
    await page.locator('input[placeholder="例如：代码助手"]').fill('头像同步测试');
    await page.locator('textarea[placeholder*="职责"]').fill('测试头像同步');
    await page.locator('.modal-content-warm > div:last-child').evaluate(el => el.scrollTop = 9999);
    await page.waitForTimeout(300);
    await page.locator('button', { hasText: '保存' }).click();
    await page.waitForTimeout(3000);
    console.log('✅ Agent created');

    // Go back to chat (对话) tab - the default tab
    await page.locator('.sidebar-warm button', { hasText: '对话' }).click();
    await page.waitForTimeout(2000);
    console.log('✓ Back to chat tab');

    // Now check the left panel for cards
    const newCardCount = await leftPanel.locator('.card-warm').count();
    console.log(`Cards in left panel after creation: ${newCardCount}`);

    // Look for our agent
    const agentCard = page.locator('.card-warm', { hasText: '头像同步测试' });
    const agentCardCount = await agentCard.count();
    console.log(`Our agent card found: ${agentCardCount > 0}`);

    if (agentCardCount > 0) {
      // Check avatar
      const avatarImg = await agentCard.locator('img').count();
      console.log(`✅ Avatar img in card: ${avatarImg > 0}`);
      
      // Click to open chat
      await agentCard.click();
      await page.waitForTimeout(2000);
      
      // Check avatar in chat
      const chatImgs = await page.locator('img[src*="dicebear"]').count();
      console.log(`✅ DiceBear avatar in chat view: ${chatImgs > 0}`);

      if (chatImgs > 0) {
        console.log('\n✅ ALL TESTS PASSED!');
      }
    } else {
      // Debug: dump all text in left panel
      const leftPanelText = await leftPanel.textContent();
      console.log('Left panel text:', leftPanelText?.slice(0, 300));
    }

    await page.screenshot({ path: '/tmp/avatar-final-test.png', fullPage: true });
    console.log('📸 Screenshot saved');

  } catch (err) {
    console.error('❌ Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
  }
  
  await browser.close();
  console.log('Test complete');
})();
