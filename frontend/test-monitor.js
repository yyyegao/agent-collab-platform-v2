const http = require('http');

const req = http.request({
  hostname: 'localhost',
  port: 3000,
  path: '/',
  method: 'GET'
}, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Page length:', data.length);
    if (data.includes('监控')) {
      console.log('✅ 页面包含监控相关内容');
    }
  });
});
req.on('error', e => console.log('Error:', e.message));
req.end();
