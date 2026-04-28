const express = require('express');
const router = express.Router();

// OpenClaw Gateway 配置
const OPENCLAW_GATEWAY = 'http://127.0.0.1:18789';
const OPENCLAW_TOKEN = 'dea05f7f7a49fc97a5b5cf2fa332d4729d8c4db8fe8c71b9';

// OpenClaw 可用工具定义 (OpenAI function calling 格式)
const OPENCLAW_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'exec',
      description: '执行 Shell 命令并返回输出结果。用于文件操作、git、系统命令等。',
      parameters: {
        type: 'object',
        properties: {
          command: { type: 'string', description: '要执行的 shell 命令' },
          timeout: { type: 'integer', description: '超时时间(秒)，默认30' }
        },
        required: ['command']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'read',
      description: '读取文件内容',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' }
        },
        required: ['path']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'write',
      description: '创建或覆盖文件',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          content: { type: 'string', description: '文件内容' }
        },
        required: ['path', 'content']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'edit',
      description: '编辑文件中的特定文本',
      parameters: {
        type: 'object',
        properties: {
          path: { type: 'string', description: '文件路径' },
          oldText: { type: 'string', description: '要替换的原始文本' },
          newText: { type: 'string', description: '新的替换文本' }
        },
        required: ['path', 'oldText', 'newText']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: '搜索网页获取实时信息',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索关键词' },
          count: { type: 'integer', description: '返回结果数量，默认5' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'web_fetch',
      description: '获取网页内容并提取文本',
      parameters: {
        type: 'object',
        properties: {
          url: { type: 'string', description: '网页 URL' }
        },
        required: ['url']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'memory_search',
      description: '搜索长期记忆库',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: '搜索查询' }
        },
        required: ['query']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'image_generate',
      description: '生成 AI 图片',
      parameters: {
        type: 'object',
        properties: {
          prompt: { type: 'string', description: '图片生成描述' },
          size: { type: 'string', description: '图片尺寸如 1024x1024' }
        },
        required: ['prompt']
      }
    }
  }
];

// 调用 OpenClaw 工具
async function invokeOpenClawTool(toolName, args) {
  try {
    const response = await fetch(`${OPENCLAW_GATEWAY}/tools/invoke`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENCLAW_TOKEN}`
      },
      body: JSON.stringify({
        tool: toolName,
        args: args || {}
      })
    });
    
    const data = await response.json();
    if (data.ok) {
      return { success: true, result: data.result };
    } else {
      return { success: false, error: data.error?.message || 'Tool execution failed' };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// LLM 代理路由 - 支持工具调用
router.post('/chat', async (req, res) => {
  const { provider, model, messages, temperature, maxTokens, tools } = req.body;
  const apiKey = req.headers['x-api-key'];
  
  let baseUrl = 'https://api.openai.com/v1';
  
  if (provider === 'minimax') {
    baseUrl = 'https://api.minimax.chat/v1';
  } else if (provider === 'longcat') {
    baseUrl = 'https://api.longcat.chat/openai/v1';
  }
  
  try {
    // 构建请求
    const requestBody = {
      model,
      messages,
      temperature: temperature ?? 0.7,
      max_tokens: maxTokens ?? 4096,
    };
    
    // 如果有工具定义，添加进去
    if (tools && tools.length > 0) {
      requestBody.tools = tools;
    }
    
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    const data = await response.json();
    
    // 检查是否有工具调用
    if (data.choices && data.choices[0]?.message?.tool_calls && data.choices[0].message.tool_calls.length > 0) {
      // 处理工具调用循环
      const toolCalls = data.choices[0].message.tool_calls;
      const results = [];
      
      for (const toolCall of toolCalls) {
        const toolName = toolCall.function.name;
        let args = {};
        try {
          args = JSON.parse(toolCall.function.arguments || '{}');
        } catch {}
        
        console.log(`[Tool Call] ${toolName}:`, args);
        
        const toolResult = await invokeOpenClawTool(toolName, args);
        
        results.push({
          tool_call_id: toolCall.id,
          role: 'tool',
          name: toolName,
          content: toolResult.success 
            ? JSON.stringify(toolResult.result) 
            : `Error: ${toolResult.error}`
        });
      }
      
      // 将工具结果添加回消息历史
      const updatedMessages = [
        ...messages,
        data.choices[0].message,
        ...results
      ];
      
      // 再次调用 LLM 获取最终响应
      const finalResponse = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          messages: updatedMessages,
          temperature: temperature ?? 0.7,
          max_tokens: maxTokens ?? 4096,
        }),
      });
      
      const finalData = await finalResponse.json();
      return res.json(finalData);
    }
    
    res.json(data);
  } catch (error) {
    console.error('[LLM Error]', error);
    res.status(500).json({ error: error.message });
  }
});

// 获取可用工具列表
router.get('/tools', (req, res) => {
  res.json({
    tools: OPENCLAW_TOOLS,
    gateway: OPENCLAW_GATEWAY
  });
});

module.exports = router;
