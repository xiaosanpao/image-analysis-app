document.addEventListener('DOMContentLoaded', function() {
    const fileInput = document.getElementById('file-input');
    const uploadBtn = document.getElementById('upload-btn');
    const imagePreview = document.getElementById('image-preview');
    const loading = document.querySelector('.loading');
    const resultContainer = document.getElementById('result-container');
    const errorMsg = document.getElementById('error-msg');
    
    uploadBtn.addEventListener('click', function() {
        fileInput.click();
    });
    
    fileInput.addEventListener('change', function(e) {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            
            // 预览图片
            const reader = new FileReader();
            reader.onload = function(event) {
                imagePreview.src = event.target.result;
                imagePreview.style.display = 'block';
            };
            reader.readAsDataURL(file);
            
            // 分析图片
            analyzeImage(file);
        }
    });
    
    function analyzeImage(file) {
        // 显示加载动画
        loading.style.display = 'block';
        resultContainer.style.display = 'none';
        errorMsg.style.display = 'none';
        
        // 将图片转换为base64
        const reader = new FileReader();
        reader.onload = function(event) {
            const base64Image = event.target.result;
            
            // 调用我们的Vercel API路由
            fetch('/api/analyze', {  // 修改这里为 /api/analyze
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ base64Image })
            })
            .then(response => {
                if (!response.ok) {
                    return response.text().then(text => {
                        throw new Error('API请求失败，状态码: ' + response.status + '，详情: ' + text);
                    });
                }
                return response.json();
            })
            .then(data => {
                // 处理API返回的结果
                processAPIResponse(data);
            })
            .catch(error => {
                console.error('错误:', error);
                loading.style.display = 'none';
                errorMsg.textContent = '分析失败: ' + error.message;
                errorMsg.style.display = 'block';
            });
        };
        reader.readAsDataURL(file);
    }
    
    function processAPIResponse(response) {
        try {
            // 尝试从API响应中提取我们需要的信息
            let analysisResult;
            
            if (response.choices && response.choices[0] && response.choices[0].message && response.choices[0].message.content) {
                const content = response.choices[0].message.content;
                
                // 尝试解析JSON
                try {
                    // 从文本中提取JSON部分
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        analysisResult = JSON.parse(jsonMatch[0]);
                    } else {
                        // 如果没有找到JSON，尝试从文本中提取信息
                        analysisResult = extractInfoFromText(content);
                    }
                } catch (e) {
                    // JSON解析失败，尝试从文本中提取信息
                    analysisResult = extractInfoFromText(content);
                }
            }
            
            // 显示结果
            displayResults(analysisResult);
        } catch (error) {
            console.error('处理响应时出错:', error);
            loading.style.display = 'none';
            errorMsg.textContent = '处理结果失败: ' + error.message;
            errorMsg.style.display = 'block';
        }
    }
    
    function extractInfoFromText(text) {
        // 从文本中提取所需信息的简单逻辑
        const result = {
            location: extractValue(text, '位置', '该位置可能在'),
            people_count: extractValue(text, '人数', '有几个人'),
            objects: extractValue(text, '物品', '有什么物品'),
            position: extractValue(text, '大概位置'),
            food: extractValue(text, '美食', '附近可能有什么美食'),
            scenery: extractValue(text, '风景', '附近有什么风景')
        };
        return result;
    }
    
    function extractValue(text, keyword, alternativeKeyword) {
        const lines = text.split('\n');
        for (const line of lines) {
            if (line.includes(keyword) || (alternativeKeyword && line.includes(alternativeKeyword))) {
                const parts = line.split(':');
                if (parts.length > 1) {
                    return parts[1].trim();
                }
                
                const parts2 = line.split('：');
                if (parts2.length > 1) {
                    return parts2[1].trim();
                }
            }
        }
        return '未检测到';
    }
    
    function displayResults(result) {
        // 隐藏加载动画
        loading.style.display = 'none';
        
        // 显示结果容器
        resultContainer.style.display = 'block';
        
        // 填充结果
        document.getElementById('location-text').textContent = result.location || '未检测到';
        document.getElementById('people-text').textContent = result.people_count || '未检测到';
        document.getElementById('objects-text').textContent = result.objects || '未检测到';
        document.getElementById('position-text').textContent = result.position || '未检测到';
        document.getElementById('food-text').textContent = result.food || '未检测到';
        document.getElementById('scenery-text').textContent = result.scenery || '未检测到';
    }
});
