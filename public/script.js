document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.querySelector('.chat-messages');
    const input = document.querySelector('.chat-input input');
    const sendButton = document.querySelector('.chat-input button');
    const emojiButton = document.querySelector('.emoji-button');
    const emojiPicker = document.querySelector('.emoji-picker');
    const emojis = document.querySelectorAll('.emoji');

    // 添加设置相关的元素
    const settingsButton = document.querySelector('.settings-button');
    const settingsModal = document.querySelector('.settings-modal');
    const saveSettings = document.querySelector('.save-settings');
    const closeSettings = document.querySelector('.close-settings');
    const apiKeyInput = document.querySelector('#apiKey');

    // 检查 API 密钥状态并更新 UI
    function checkApiKeyStatus() {
        if (!CONFIG.API_KEY) {
            settingsButton.classList.add('needs-setup');
            // 如果没有 API 密钥，自动打开设置对话框
            settingsModal.classList.add('active');
        } else {
            settingsButton.classList.remove('needs-setup');
        }
    }

    // 从本地存储加载 API 密钥
    const savedApiKey = localStorage.getItem('deepseekApiKey');
    if (savedApiKey) {
        CONFIG.API_KEY = savedApiKey;
        apiKeyInput.value = savedApiKey;
    }
    checkApiKeyStatus();  // 检查初始状态

    // 切换表情选择器
    emojiButton.addEventListener('click', () => {
        emojiPicker.classList.toggle('active');
    });

    // 选择表情
    emojis.forEach(emoji => {
        emoji.addEventListener('click', () => {
            input.value += emoji.textContent;
            emojiPicker.classList.remove('active');
            input.focus();
        });
    });

    // 打开设置
    settingsButton.addEventListener('click', () => {
        settingsModal.classList.add('active');
        apiKeyInput.value = CONFIG.API_KEY || '';
    });

    // 关闭设置
    closeSettings.addEventListener('click', () => {
        settingsModal.classList.remove('active');
    });

    // 点击外部关闭设置
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.remove('active');
        }
    });

    // 保存设置
    saveSettings.addEventListener('click', () => {
        const newApiKey = apiKeyInput.value.trim();
        const apiInput = document.querySelector('.api-input');
        const errorMessage = apiInput.querySelector('.error-message');
        
        // 移除旧的错误消息
        if (errorMessage) {
            errorMessage.remove();
        }
        apiInput.classList.remove('has-error');

        if (!newApiKey) {
            // 显示错误消息
            apiInput.classList.add('has-error');
            const error = document.createElement('div');
            error.className = 'error-message';
            error.textContent = '请输入 API 密钥';
            apiInput.appendChild(error);
            return;
        }

        CONFIG.API_KEY = newApiKey;
        localStorage.setItem('deepseekApiKey', newApiKey);
        settingsModal.classList.remove('active');
        checkApiKeyStatus();  // 更新 UI 状态
        
        // 显示成功消息
        const messageDiv = document.createElement('div');
        messageDiv.className = 'message received';
        messageDiv.innerHTML = `
            <div class="avatar"></div>
            <div class="message-content">
                API 密钥已更新，你可以开始聊天了！
            </div>
        `;
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    });

    // 添加与 DeepSeek API 交互的函数
    async function getAIResponse(message) {
        try {
            // 检查 API 密钥是否存在
            if (!CONFIG.API_KEY) {
                throw new Error('请先在设置中配置 API 密钥');
            }

            // 显示请求信息
            console.log('发送请求:', {
                url: CONFIG.API_URL,
                model: CONFIG.MODEL,
                message: message
            });
            
            const response = await fetch(CONFIG.API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${CONFIG.API_KEY}`
                },
                body: JSON.stringify({
                    model: CONFIG.MODEL,
                    messages: [
                        {
                            role: "system",
                            content: "You are a helpful assistant."
                        },
                        {
                            role: "user",
                            content: message
                        }
                    ],
                    stream: false
                })
            });

            // 显示响应状态
            console.log('响应状态:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('API 错误响应:', errorText);
                throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
            }

            const data = await response.json();
            console.log('API 响应数据:', data);

            if (!data.choices || !data.choices[0] || !data.choices[0].message) {
                console.error('无效的响应格式:', data);
                throw new Error('API 返回了无效的响应格式');
            }

            return data.choices[0].message.content;
        } catch (error) {
            console.error('完整错误信息:', error);
            
            // 根据错误类型返回不同的提示信息
            if (error.message.includes('API 密钥未设置')) {
                return '请点击右上角的⚙️设置按钮配置 API 密钥';
            } else if (error.message.includes('Failed to fetch')) {
                return '网络连接失败，请检查网络连接或服务器状态';
            } else if (error.message.includes('401')) {
                return 'API 密钥无效，请检查设置中的 API 密钥是否正确';
            } else if (error.message.includes('403')) {
                return 'API 密钥没有访问权限';
            } else if (error.message.includes('429')) {
                return '请求太频繁，请稍后再试';
            }
            
            return `发生错误: ${error.message}`;
        }
    }

    // 修改发送消息函数
    async function sendMessage() {
        const message = input.value.trim();
        if (message) {
            // 显示用户消息
            const messageDiv = document.createElement('div');
            messageDiv.className = 'message sent';
            messageDiv.innerHTML = `
                <div class="message-content">
                    ${message}
                </div>
            `;
            chatMessages.appendChild(messageDiv);
            input.value = '';
            chatMessages.scrollTop = chatMessages.scrollHeight;

            // 显示"正在输入"状态
            const typingDiv = document.createElement('div');
            typingDiv.className = 'message received';
            typingDiv.innerHTML = `
                <div class="avatar"></div>
                <div class="message-content typing">
                    正在输入...
                </div>
            `;
            chatMessages.appendChild(typingDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            try {
                // 获取 AI 响应
                const aiResponse = await getAIResponse(message);
                
                // 移除"正在输入"状态
                chatMessages.removeChild(typingDiv);

                // 显示 AI 响应
                const aiMessageDiv = document.createElement('div');
                aiMessageDiv.className = 'message received';
                aiMessageDiv.innerHTML = `
                    <div class="avatar"></div>
                    <div class="message-content">
                        ${aiResponse}
                    </div>
                `;
                chatMessages.appendChild(aiMessageDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            } catch (error) {
                // 处理错误
                chatMessages.removeChild(typingDiv);
                const errorDiv = document.createElement('div');
                errorDiv.className = 'message received error';
                errorDiv.innerHTML = `
                    <div class="avatar"></div>
                    <div class="message-content">
                        ${error.message}
                    </div>
                `;
                chatMessages.appendChild(errorDiv);
            }
        }
    }

    // 点击发送按钮发送消息
    sendButton.addEventListener('click', sendMessage);

    // 按回车发送消息
    input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // 点击其他地方关闭表情选择器
    document.addEventListener('click', (e) => {
        if (!emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
            emojiPicker.classList.remove('active');
        }
    });
}); 