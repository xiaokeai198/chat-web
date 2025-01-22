require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;
const API_KEY = process.env.DEEPSEEK_API_KEY;
const rateLimit = require('express-rate-limit');

// 启用 CORS
app.use(cors());

// 重要：设置静态文件目录为 public
app.use(express.static('public'));
// 或者使用绝对路径
// app.use(express.static(path.join(__dirname, 'public')));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 分钟
    max: 100 // 限制每个 IP 15分钟内最多 100 个请求
});

app.use('/api/', limiter);

// 解析 JSON 请求体
app.use(express.json());

// API 代理
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': req.headers.authorization
            },
            body: JSON.stringify(req.body)
        });

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('API 错误:', error);
        res.status(500).json({ error: error.message });
    }
});

// 所有路由都返回 index.html
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 