// 这个文件处理图片分析API请求
// 它会接收前端发送的图片数据，转发给智谱API，然后将结果返回给前端

export default async function handler(req, res) {
  // 只接受POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  
  try {
    const { base64Image } = req.body;
    
    if (!base64Image) {
      return res.status(400).json({ error: 'Missing base64Image in request body' });
    }
    
    // 智谱API密钥从环境变量中获取
    const apiKey = process.env.BIGMODEL_API_KEY;
    
    if (!apiKey) {
      return res.status(500).json({ error: 'API key not configured' });
    }
    
    // 构建智谱API请求
    const prompt = `分析这张图片，并给出以下信息：
    1. 该位置可能在哪里
    2. 图中有几个人
    3. 图中有什么物品
    4. 该地点的大概位置
    5. 附近可能有什么美食
    6. 附近有什么风景点
    请以JSON格式返回，包含以下字段：location, people_count, objects, position, food, scenery`;
    
    const requestData = {
      model: "glm-4v",  // 使用支持图像识别的模型
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
    
    console.log('Sending request to BigModel API...');
    
    // 调用智谱API
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
      console.error('BigModel API responded with an error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: 'Error from BigModel API', 
        status: response.status,
        details: errorText
      });
    }
    
    // 解析API响应
    const data = await response.json();
    console.log('Received response from BigModel API');
    
    // 返回结果给前端
    return res.status(200).json(data);
  } catch (error) {
    console.error('Error in API route:', error);
    return res.status(500).json({ error: error.message });
  }
}
