export default async function handler(req, res) {
  console.log('====== API请求开始 ======');
  console.log('请求方法:', req.method);
  console.log('请求路径:', req.url);
  console.log('请求头:', JSON.stringify(req.headers));
  console.log('请求体类型:', typeof req.body);
  console.log('请求体包含base64Image:', req.body && 'base64Image' in req.body);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    console.log('收到OPTIONS预检请求，返回200');
    return res.status(200).end();
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
    console.log(`请求方法错误: 需要POST，收到${req.method}`);
    return res.status(405).json({ error: '只支持POST方法' });
  }
  
  try {
    const { base64Image } = req.body || {};
    
    if (!base64Image) {
      console.log('请求体缺少base64Image字段');
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    console.log('base64Image长度:', base64Image.length);
    
    // Imagga API凭证 - 从环境变量获取
    const apiKey = process.env.IMAGGA_API_KEY;
    const apiSecret = process.env.IMAGGA_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.log('API凭证未配置');
      return res.status(500).json({ error: 'API credentials not configured' });
    }
    
    console.log('API凭证已配置');
    
    // 构建Imagga API的授权头
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    console.log('生成授权头');
    
    // 尝试上传图像到Imagga
    console.log('准备调用Imagga API上传图像');
    try {
      const imageBuffer = Buffer.from(base64Image, 'base64');
      console.log('转换base64为Buffer完成，大小:', imageBuffer.length);
      
      const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: imageBuffer
      });
      
      console.log('Imagga上传响应状态:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Imagga上传错误:', errorText);
        return res.status(uploadResponse.status).json({ 
          error: `图像上传失败 (${uploadResponse.status})`, 
          details: errorText 
        });
      }
      
      const uploadData = await uploadResponse.json();
      console.log('Imagga上传成功，响应:', JSON.stringify(uploadData));
      
      const uploadId = uploadData.result.upload_id;
      
      // 获取图像标签
      console.log('获取图像标签，upload_id:', uploadId);
      const tagsResponse = await fetch(`https://api.imagga.com/v2/tags?upload_id=${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
      
      console.log('标签响应状态:', tagsResponse.status);
      
      if (!tagsResponse.ok) {
        const errorText = await tagsResponse.text();
        console.error('Imagga标签错误:', errorText);
        return res.status(tagsResponse.status).json({ 
          error: `标签分析失败 (${tagsResponse.status})`, 
          details: errorText 
        });
      }
      
      const tagsData = await tagsResponse.json();
      console.log('标签分析成功');
      
      // 获取图像类别
      console.log('获取图像类别');
      const categoriesResponse = await fetch(`https://api.imagga.com/v2/categories/personal_photos?upload_id=${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
      
      console.log('类别响应状态:', categoriesResponse.status);
      
      if (!categoriesResponse.ok) {
        const errorText = await categoriesResponse.text();
        console.error('Imagga类别错误:', errorText);
        return res.status(categoriesResponse.status).json({ 
          error: `类别分析失败 (${categoriesResponse.status})`, 
          details: errorText 
        });
      }
      
      const categoriesData = await categoriesResponse.json();
      console.log('类别分析成功');
      
      // 处理上传的图像（使用完后删除）
      console.log('删除上传的图像');
      await fetch(`https://api.imagga.com/v2/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader
        }
      });
      
      // 处理Imagga返回的数据
      const tags = tagsData.result.tags.map(tag => tag.tag.en).slice(0, 10);
      console.log('提取的标签:', tags.join(', '));
      
      const categories = categoriesData.result.categories.map(cat => cat.name.en);
      console.log('提取的类别:', categories.join(', '));
      
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
      
      console.log('分析完成，返回结果');
      return res.status(200).json(formattedResult);
      
    } catch (uploadError) {
      console.error('上传图像或分析过程出错:', uploadError);
      return res.status(500).json({ 
        error: '图像处理错误', 
        details: uploadError.message 
      });
    }
    
  } catch (error) {
    console.error('API路由处理出错:', error);
    return res.status(500).json({ error: error.message });
  }
}export default async function handler(req, res) {
  console.log('====== API请求开始 ======');
  console.log('请求方法:', req.method);
  console.log('请求路径:', req.url);
  console.log('请求头:', JSON.stringify(req.headers));
  console.log('请求体类型:', typeof req.body);
  console.log('请求体包含base64Image:', req.body && 'base64Image' in req.body);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    console.log('收到OPTIONS预检请求，返回200');
    return res.status(200).end();
  }
  
  // 验证请求方法
  if (req.method !== 'POST') {
    console.log(`请求方法错误: 需要POST，收到${req.method}`);
    return res.status(405).json({ error: '只支持POST方法' });
  }
  
  try {
    const { base64Image } = req.body || {};
    
    if (!base64Image) {
      console.log('请求体缺少base64Image字段');
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    console.log('base64Image长度:', base64Image.length);
    
    // Imagga API凭证 - 从环境变量获取
    const apiKey = process.env.IMAGGA_API_KEY;
    const apiSecret = process.env.IMAGGA_API_SECRET;
    
    if (!apiKey || !apiSecret) {
      console.log('API凭证未配置');
      return res.status(500).json({ error: 'API credentials not configured' });
    }
    
    console.log('API凭证已配置');
    
    // 构建Imagga API的授权头
    const authHeader = 'Basic ' + Buffer.from(apiKey + ':' + apiSecret).toString('base64');
    console.log('生成授权头');
    
    // 尝试上传图像到Imagga
    console.log('准备调用Imagga API上传图像');
    try {
      const imageBuffer = Buffer.from(base64Image, 'base64');
      console.log('转换base64为Buffer完成，大小:', imageBuffer.length);
      
      const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
        method: 'POST',
        headers: {
          'Authorization': authHeader
        },
        body: imageBuffer
      });
      
      console.log('Imagga上传响应状态:', uploadResponse.status);
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Imagga上传错误:', errorText);
        return res.status(uploadResponse.status).json({ 
          error: `图像上传失败 (${uploadResponse.status})`, 
          details: errorText 
        });
      }
      
      const uploadData = await uploadResponse.json();
      console.log('Imagga上传成功，响应:', JSON.stringify(uploadData));
      
      const uploadId = uploadData.result.upload_id;
      
      // 获取图像标签
      console.log('获取图像标签，upload_id:', uploadId);
      const tagsResponse = await fetch(`https://api.imagga.com/v2/tags?upload_id=${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
      
      console.log('标签响应状态:', tagsResponse.status);
      
      if (!tagsResponse.ok) {
        const errorText = await tagsResponse.text();
        console.error('Imagga标签错误:', errorText);
        return res.status(tagsResponse.status).json({ 
          error: `标签分析失败 (${tagsResponse.status})`, 
          details: errorText 
        });
      }
      
      const tagsData = await tagsResponse.json();
      console.log('标签分析成功');
      
      // 获取图像类别
      console.log('获取图像类别');
      const categoriesResponse = await fetch(`https://api.imagga.com/v2/categories/personal_photos?upload_id=${uploadId}`, {
        method: 'GET',
        headers: {
          'Authorization': authHeader
        }
      });
      
      console.log('类别响应状态:', categoriesResponse.status);
      
      if (!categoriesResponse.ok) {
        const errorText = await categoriesResponse.text();
        console.error('Imagga类别错误:', errorText);
        return res.status(categoriesResponse.status).json({ 
          error: `类别分析失败 (${categoriesResponse.status})`, 
          details: errorText 
        });
      }
      
      const categoriesData = await categoriesResponse.json();
      console.log('类别分析成功');
      
      // 处理上传的图像（使用完后删除）
      console.log('删除上传的图像');
      await fetch(`https://api.imagga.com/v2/uploads/${uploadId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': authHeader
        }
      });
      
      // 处理Imagga返回的数据
      const tags = tagsData.result.tags.map(tag => tag.tag.en).slice(0, 10);
      console.log('提取的标签:', tags.join(', '));
      
      const categories = categoriesData.result.categories.map(cat => cat.name.en);
      console.log('提取的类别:', categories.join(', '));
      
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
      
      console.log('分析完成，返回结果');
      return res.status(200).json(formattedResult);
      
    } catch (uploadError) {
      console.error('上传图像或分析过程出错:', uploadError);
      return res.status(500).json({ 
        error: '图像处理错误', 
        details: uploadError.message 
      });
    }
    
  } catch (error) {
    console.error('API路由处理出错:', error);
    return res.status(500).json({ error: error.message });
  }
}
