const CONFIG = {
    API_KEY: '',  // 将通过设置界面设置
    API_URL: 'https://api.deepseek.com/v1/chat/completions',
    MODEL: 'deepseek-chat',
    BASE_URL: location.hostname === 'localhost' ? '' : '/你的仓库名'
}; 