// 保持原有代码，无需修改
function analyzeImage(file) {
  // 文件大小和类型预校验
  if (file.size > 2 * 1024 * 1024) {  // 2MB
    errorMsg.textContent = '文件过大，请选择小于2MB的图像';
    errorMsg.style.display = 'block';
    return;
  }
  
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    errorMsg.textContent = '仅支持 JPEG, PNG 和 WebP 格式的图像';
    errorMsg.style.display = 'block';
    return;
  }
  
  // 之前的代码保持不变
  const reader = new FileReader();
  reader.onload = function(event) {
    const base64Image = event.target.result;
    
    fetch('/api/analyze', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ base64Image })
    })
    .then(response => {
      // 错误处理代码保持不变
    });
  };
  reader.readAsDataURL(file);
}
