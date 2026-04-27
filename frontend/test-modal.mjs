import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  
  try {
    await page.goto('http://localhost:3002', { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);
    
    console.log('Page title:', await page.title());
    
    // Use JS to click the add button directly
    const clicked = await page.evaluate(() => {
      // The add button is in AgentList - look for button with + icon
      const buttons = document.querySelectorAll('button');
      for (const btn of buttons) {
        const svg = btn.querySelector('svg');
        if (svg) {
          const path = svg.querySelector('path');
          if (path && path.getAttribute('d') === 'M12 4v16m8-8H4') {
            btn.click();
            return true;
          }
        }
      }
      return false;
    });
    
    console.log('JS click result:', clicked);
    await page.waitForTimeout(1500);
    
    // Check if modal is open
    const modalCount = await page.locator('.modal-content-warm').count();
    console.log('Modal visible:', modalCount > 0);
    
    if (modalCount > 0) {
      // Check for scrollbars in the modal
      const scrollbarCheck = await page.evaluate(() => {
        const modal = document.querySelector('.modal-content-warm');
        if (!modal) return 'No modal found';
        
        const issues = [];
        const allEls = modal.querySelectorAll('*');
        
        for (const el of allEls) {
          const style = window.getComputedStyle(el);
          const isScrollable = (style.overflow === 'auto' || style.overflow === 'scroll' || 
                                style.overflowX === 'auto' || style.overflowX === 'scroll' ||
                                style.overflowY === 'auto' || style.overflowY === 'scroll');
          
          if (isScrollable && el.scrollHeight > el.clientHeight) {
            issues.push({
              tag: el.tagName,
              className: el.className.substring(0, 100),
              overflow: style.overflow,
              scrollHeight: el.scrollHeight,
              clientHeight: el.clientHeight
            });
          }
        }
        
        return issues.length > 0 ? JSON.stringify(issues, null, 2) : 'No scrollbar issues found';
      });
      
      console.log('Scrollbar check result:', scrollbarCheck);
      
      // Take screenshot of modal
      await page.locator('.modal-content-warm').screenshot({ path: '/tmp/modal-screenshot.png' });
      console.log('Modal screenshot saved to /tmp/modal-screenshot.png');
    } else {
      console.log('Modal not found');
      // Debug: check what buttons exist
      const buttons = await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        const info = [];
        for (let i = 0; i < Math.min(btns.length, 10); i++) {
          const btn = btns[i];
          info.push({
            text: btn.textContent?.trim().substring(0, 30),
            hasSvg: !!btn.querySelector('svg'),
            className: btn.className
          });
        }
        return info;
      });
      console.log('Buttons found:', JSON.stringify(buttons, null, 2));
    }
    
  } catch (err) {
    console.error('Error:', err.message);
    await page.screenshot({ path: '/tmp/error-screenshot.png', fullPage: true });
    console.log('Error screenshot saved');
  }
  
  await browser.close();
  console.log('Test complete');
})();
