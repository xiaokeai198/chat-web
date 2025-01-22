require('dotenv').config();
const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const fetch = require('node-fetch');

const app = express();
const port = process.env.PORT || 3000;

// 安全性设置
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://api.deepseek.com"]
        }
    }
}));

// 启用 CORS
app.use(cors());

// 启用压缩
app.use(compression());

// 解析 JSON 请求体
app.use(express.json());

// 速率限制
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15分钟
    max: 100, // 限制每个IP 15分钟内最多100个请求
    message: '请求过于频繁，请稍后再试'
});

// 应用速率限制到所有路由
app.use('/api/', limiter);

// 提供静态文件
app.use(express.static(path.join(__dirname, '../public')));

// API 代理
app.post('/api/chat', async (req, res) => {
    try {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${req.headers.authorization.split(' ')[1]}`
            },
            body: JSON.stringify(req.body)
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('DeepSeek API 错误:', errorData);
            return res.status(response.status).json({
                error: '与 AI 服务器通信时出错',
                details: errorData
            });
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error('服务器错误:', error);
        res.status(500).json({
            error: '服务器内部错误',
            message: error.message
        });
    }
});

// 错误处理中间件
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        error: '服务器内部错误',
        message: process.env.NODE_ENV === 'development' ? err.message : '请稍后再试'
    });
});

// 启动服务器
app.listen(port, () => {
    console.log(`服务器运行在 http://localhost:${port}`);
}); 