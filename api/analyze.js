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
    
    // Imagga API凭证 - 从环境变量获取
    const apiKey = process.env.IMAGGA_API_KEY;
    const apiSecret = process.env.IMAGGA_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'API credentials not configured' });
    }
    
    // 构建Imagga API的授权头
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    
    // 首先上传图像到Imagga
    const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
      method: 'POST',
      headers: {
        'Authorization': authHeader
      },
      body: Buffer.from(base64Image, 'base64')
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('Imagga上传错误:', uploadResponse.status, errorText);
      return res.status(uploadResponse.status).json({ 
        error: `图像上传失败 (${uploadResponse.status})`, 
        details: errorText 
      });
    }
    
    const uploadData = await uploadResponse.json();
    const uploadId = uploadData.result.upload_id;
    
    // 获取图像标签
    const tagsResponse = await fetch(`https://api.imagga.com/v2/tags?upload_id=${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!tagsResponse.ok) {
      const errorText = await tagsResponse.text();
      console.error('Imagga标签错误:', tagsResponse.status, errorText);
      return res.status(tagsResponse.status).json({ 
        error: `标签分析失败 (${tagsResponse.status})`, 
        details: errorText 
      });
    }
    
    const tagsData = await tagsResponse.json();
    
    // 获取图像类别
    const categoriesResponse = await fetch(`https://api.imagga.com/v2/categories/personal_photos?upload_id=${uploadId}`, {
      method: 'GET',
      headers: {
        'Authorization': authHeader
      }
    });
    
    if (!categoriesResponse.ok) {
      const errorText = await categoriesResponse.text();
      console.error('Imagga类别错误:', categoriesResponse.status, errorText);
      return res.status(categoriesResponse.status).json({ 
        error: `类别分析失败 (${categoriesResponse.status})`, 
        details: errorText 
      });
    }
    
    const categoriesData = await categoriesResponse.json();
    
    // 处理上传的图像（使用完后删除）
    await fetch(`https://api.imagga.com/v2/uploads/${uploadId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': authHeader
      }
    });
    
    // 处理Imagga返回的数据
    const tags = tagsData.result.tags.map(tag => tag.tag.en).slice(0, 10);
    const categories = categoriesData.result.categories.map(cat => cat.name.en);
    const primaryCategory = categories.length > 0 ? categories[0] : '未知类别';
    
    // 检测是否有人
    const hasPerson = tags.some(tag => ['person', 'people', 'human', 'man', 'woman'].includes(tag.toLowerCase()));
    const peopleCount = hasPerson ? '至少1人' : '0人';
    
    // 根据标签推断位置和物品
    const locationTags = tags.filter(tag => 
      ['outdoor', 'indoor', 'nature', 'city', 'urban', 'rural', 'beach', 'mountain', 'forest', 'building', 'street'].includes(tag.toLowerCase())
    );
    const location = locationTags.length > 0 ? locationTags.join(', ') : '未能确定具体位置';
    
    const objectTags = tags.filter(tag => 
      !['person', 'people', 'human', 'man', 'woman'].includes(tag.toLowerCase()) && 
      !locationTags.includes(tag)
    );
    const objects = objectTags.join(', ');
    
    // 根据类别推荐附近可能的美食和风景
    let food = '未能确定附近美食';
    let scenery = '未能确定附近风景';
    
    if (primaryCategory.includes('beach') || tags.includes('beach')) {
      food = '沿海海鲜餐厅、热带水果摊、冰淇淋店';
      scenery = '海滩、海景、日落美景、沿海步道';
    } else if (primaryCategory.includes('mountain') || tags.some(tag => ['mountain', 'hill', 'highland'].includes(tag))) {
      food = '山区特色餐厅、农家菜、地方特色小吃';
      scenery = '山峰、森林、瀑布、山间小路、观景台';
    } else if (primaryCategory.includes('city') || tags.some(tag => ['city', 'urban', 'building'].includes(tag))) {
      food = '城市餐厅、咖啡馆、美食街、各类国际美食';
      scenery = '城市景观、公园、博物馆、商业区、历史建筑';
    } else if (primaryCategory.includes('indoor') || tags.includes('indoor')) {
      food = '室内餐厅、咖啡厅、美食广场';
      scenery = '室内景点、购物中心、艺术展览';
    }
    
    // 格式化为您应用期望的格式
    const formattedResult = {
      choices: [{
        message: {
          content: JSON.stringify({
            location: location,
            people_count: peopleCount,
            objects: objects,
            position: primaryCategory,
            food: food,
            scenery: scenery
          })
        }
      }]
    };
    
    return res.status(200).json(formattedResult);
    
  } catch (error) {
    console.error('API路由错误:', error);
    return res.status(500).json({ error: error.message });
  }
}
