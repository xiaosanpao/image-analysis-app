export default function handler(req, res) {
  // 记录请求信息
  console.log('收到请求:', req.method);
  
  // 允许所有跨域请求
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // 返回简单响应，无论什么请求方法
  return res.status(200).json({
    success: true,
    method: req.method,
    message: '这是一个测试响应',
    mockData: {
      choices: [{
        message: {
          content: JSON.stringify({
            location: "城市道路",
            people_count: "0人",
            objects: "公路标志、车辆、广告牌",
            position: "城市区域",
            food: "附近可能有快餐店、咖啡馆",
            scenery: "城市景观、商业区"
          })
        }
      }]
    }
  });
}
