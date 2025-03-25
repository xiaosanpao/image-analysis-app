# 图片分析应用

这是一个使用智谱AI API进行图片分析的Web应用。用户可以上传图片，系统会分析图片内容并提供关于位置、人数、物品、周边美食和风景等信息。

## 功能

- 图片上传与预览
- 图片内容分析
- 显示分析结果，包含以下信息：
  - 位置信息
  - 人数
  - 物品
  - 大概位置
  - 附近美食
  - 附近风景

## 技术栈

- 前端：HTML, CSS, JavaScript
- 后端：Vercel Serverless Functions
- API：智谱AI图像分析API

## 部署

该项目使用Vercel进行部署。要部署此项目：

1. Fork或克隆此仓库
2. 在Vercel上导入项目
3. 设置环境变量`BIGMODEL_API_KEY`为您的智谱API密钥
4. 部署应用

## 本地开发

```bash
# 安装依赖
npm install

# 本地开发服务器
npm run dev
