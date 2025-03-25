export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64Image in request body' });
    }
    
    // 从环境变量获取API密钥
    const apiKey = process.env.BIGMODEL_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    console.log('准备发送请求到智谱API...');
    
    // 构建智谱API请求 - 确保这与智谱AI文档一致
    const prompt = `分析这张图片，并给出以下信息：
    1. 该位置可能在哪里
    2. 图中有几个人
    3. 图中有什么物品
    4. 该地点的大概位置
    5. 附近可能有什么美食
    6. 附近有什么风景点
    请以JSON格式返回，包含以下字段：location, people_count, objects, position, food, scenery`;
    
    const requestData = {
      model: "glm-4v",  // 确认这是正确的模型名称
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: `data:image/jpeg;base64,${base64Image}` } }
          ]
        }
      ],
      temperature: 0.7,
      stream: false
    };
    
    // 发送请求到智谱API
    const response = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(requestData)
    });
    
    // 检查响应状态
    if (!response.ok) {
      const errorText = await response.text();
      console.error('智谱API错误:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `智谱API错误 (${response.status})`, 
        details: errorText 
      });
    }
    
    // 解析并返回API响应
    const data = await response.json();
    console.log('收到智谱API响应');
    
    return res.status(200).json(data);
  } catch (error) {
    console.error('API路由错误:', error);
    return res.status(500).json({ error: error.message });
  }
}
