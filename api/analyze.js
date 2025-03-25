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
  
  // 记录请求方法和路径（调试用）
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  // 验证请求方法
  if (req.method !== 'POST') {
    console.log(`非POST请求: ${req.method}`);
    return res.status(405).json({ error: '只支持POST方法' });
  }
  
  try {
    // 记录请求体信息（调试用）
    console.log('请求体类型:', typeof req.body);
    console.log('请求体包含base64Image:', req.body && 'base64Image' in req.body);
    
    const { base64Image } = req.body || {};
    
    if (!base64Image) {
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    // 简化为模拟响应，以排除Imagga API集成问题
    const mockResult = {
      choices: [{
        message: {
          content: JSON.stringify({
            location: "山地观景台",
            people_count: "1人",
            objects: "山脉、蓝天、云层、汽车",
            position: "高海拔区域",
            food: "山区特色美食、地方小吃",
            scenery: "壮观山脉、云海、日落景观"
          })
        }
      }]
    };
    
    // 添加延迟模拟API处理时间
    setTimeout(() => {
      return res.status(200).json(mockResult);
    }, 1000);
    
  } catch (error) {
    console.error('API处理错误:', error);
    return res.status(500).json({ error: error.message });
  }
}export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 记录请求方法和路径（调试用）
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  // 验证请求方法
  if (req.method !== 'POST') {
    console.log(`非POST请求: ${req.method}`);
    return res.status(405).json({ error: '只支持POST方法' });
  }
  
  try {
    // 记录请求体信息（调试用）
    console.log('请求体类型:', typeof req.body);
    console.log('请求体包含base64Image:', req.body && 'base64Image' in req.body);
    
    const { base64Image } = req.body || {};
    
    if (!base64Image) {
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    // 简化为模拟响应，以排除Imagga API集成问题
    const mockResult = {
      choices: [{
        message: {
          content: JSON.stringify({
            location: "山地观景台",
            people_count: "1人",
            objects: "山脉、蓝天、云层、汽车",
            position: "高海拔区域",
            food: "山区特色美食、地方小吃",
            scenery: "壮观山脉、云海、日落景观"
          })
        }
      }]
    };
    
    // 添加延迟模拟API处理时间
    setTimeout(() => {
      return res.status(200).json(mockResult);
    }, 1000);
    
  } catch (error) {
    console.error('API处理错误:', error);
    return res.status(500).json({ error: error.message });
  }
}export default async function handler(req, res) {
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 记录请求方法和路径（调试用）
  console.log(`收到请求: ${req.method} ${req.url}`);
  
  // 验证请求方法
  if (req.method !== 'POST') {
    console.log(`非POST请求: ${req.method}`);
    return res.status(405).json({ error: '只支持POST方法' });
  }
  
  try {
    // 记录请求体信息（调试用）
    console.log('请求体类型:', typeof req.body);
    console.log('请求体包含base64Image:', req.body && 'base64Image' in req.body);
    
    const { base64Image } = req.body || {};
    
    if (!base64Image) {
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    // 简化为模拟响应，以排除Imagga API集成问题
    const mockResult = {
      choices: [{
        message: {
          content: JSON.stringify({
            location: "山地观景台",
            people_count: "1人",
            objects: "山脉、蓝天、云层、汽车",
            position: "高海拔区域",
            food: "山区特色美食、地方小吃",
            scenery: "壮观山脉、云海、日落景观"
          })
        }
      }]
    };
    
    // 添加延迟模拟API处理时间
    setTimeout(() => {
      return res.status(200).json(mockResult);
    }, 1000);
    
  } catch (error) {
    console.error('API处理错误:', error);
    return res.status(500).json({ error: error.message });
  }
}
