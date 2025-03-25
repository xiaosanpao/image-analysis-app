import sharp from 'sharp';

export default async function handler(req, res) {
  // CORS and method validation (previous code remains the same)
  
  try {
    const body = typeof req.body === 'string' 
      ? JSON.parse(req.body) 
      : req.body || {};
    
    const { base64Image } = body;
    
    if (!base64Image) {
      return res.status(400).json({ error: '请求中缺少base64Image' });
    }
    
    // Image preprocessing
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
    
    try {
      // Use Sharp for image resizing and compression
      const compressedBuffer = await sharp(Buffer.from(base64Data, 'base64'))
        .resize({
          width: 1024,
          height: 1024,
          fit: sharp.fit.inside,
          withoutEnlargement: true
        })
        .jpeg({ quality: 70 })
        .toBuffer();
      
      // Check compressed image size
      if (compressedBuffer.length > 500 * 1024) {
        return res.status(413).json({ 
          error: '图像文件过大', 
          details: '压缩后图像仍超过500KB限制' 
        });
      }
      
      // Proceed with Imagga API analysis (rest of the previous code remains the same)
      const apiKey = process.env.IMAGGA_API_KEY;
      const apiSecret = process.env.IMAGGA_API_SECRET;
      
      const authHeader = 'Basic ' + Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
      
      const uploadResponse = await fetch('https://api.imagga.com/v2/uploads', {
        method: 'POST',
        headers: {
          'Authorization': authHeader,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: `image=${encodeURIComponent(compressedBuffer.toString('base64'))}`
      });
      
      // Remaining code for tags, categories, etc. stays the same
      
    } catch (processingError) {
      return res.status(500).json({ 
        error: '图像处理错误', 
        details: processingError.message 
      });
    }
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
