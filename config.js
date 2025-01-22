const CONFIG = {
    API_KEY: '',  // 将通过设置界面设置
    API_URL: 'https://api.deepseek.com/v1/chat/completions',  // 使用直接的 API 地址
    MODEL: 'deepseek-chat'
};

// 添加配置检查
function validateConfig() {
    console.log('当前 API 配置:', {
        url: CONFIG.API_URL,
        model: CONFIG.MODEL,
        hasKey: !!CONFIG.API_KEY
    });
}

// 页面加载时检查配置
validateConfig(); 