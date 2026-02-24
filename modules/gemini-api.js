/**
 * YouTube Creator Dashboard — Gemini API Module
 * Multi-model fallback chain with auto-retry for rate limits
 */
window.GeminiAPI = {
    API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
    // Model priority chain — tries each until one works
    MODELS: ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-1.5-flash'],
    RETRY_DELAY_MS: 5000, // Wait 5s before retrying after 429
    MAX_RETRIES: 1,       // Retry once per model before moving to next
    STORAGE_KEY: 'ytcd_gemini_api_key',
    // ⬇️ ĐÃ DÁN GEMINI API KEY CỦA BẠN VÀO ĐÂY (GIỮ KÍN NẾU SỬ DỤNG CÔNG KHAI)
    DEFAULT_KEY: 'AIzaSyCv-pU6_C-hzG_QQUd8mYHjesAFun53T-s',

    init() {
        if (!this.getApiKey() && this.DEFAULT_KEY) {
            this.setApiKey(this.DEFAULT_KEY);
        }
    },

    setApiKey(key) { localStorage.setItem(this.STORAGE_KEY, key); },
    getApiKey() { return localStorage.getItem(this.STORAGE_KEY); },
    isConfigured() { const k = this.getApiKey(); return k && k.length > 0; },

    _buildBody(prompt, systemInstruction, options = {}) {
        const { temperature = 1.0, maxOutputTokens = 8192 } = options;
        const body = {
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            generationConfig: { temperature, maxOutputTokens }
        };
        if (systemInstruction) {
            body.systemInstruction = { parts: [{ text: systemInstruction }] };
        }
        return body;
    },

    _sleep(ms) { return new Promise(r => setTimeout(r, ms)); },

    /**
     * Try all models in the chain for a given endpoint suffix
     * Returns the first successful response
     */
    async _tryModels(endpointSuffix, body, apiKey) {
        let lastError = null;

        for (const model of this.MODELS) {
            for (let attempt = 0; attempt <= this.MAX_RETRIES; attempt++) {
                try {
                    const url = `${this.API_BASE}/${model}:${endpointSuffix}${endpointSuffix.includes('?') ? '&' : '?'}key=${apiKey}`;
                    const response = await fetch(url, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(body)
                    });

                    if (response.ok) {
                        if (model !== this.MODELS[0]) {
                            console.log(`✅ Using model: ${model}`);
                        }
                        return response;
                    }

                    if (response.status === 429) {
                        const errData = await response.json().catch(() => ({}));
                        // Extract retry delay from error if available
                        const retryMatch = errData?.error?.message?.match(/retry in ([\d.]+)s/i);
                        const waitTime = retryMatch ? Math.min(parseFloat(retryMatch[1]) * 1000, 15000) : this.RETRY_DELAY_MS;

                        if (attempt < this.MAX_RETRIES) {
                            console.warn(`⏳ ${model} rate limited, retrying in ${(waitTime / 1000).toFixed(1)}s...`);
                            await this._sleep(waitTime);
                            continue;
                        }
                        console.warn(`⚠️ ${model} rate limited, trying next model...`);
                        lastError = errData?.error?.message || `Model ${model} rate limited`;
                        break; // Move to next model
                    }

                    if (response.status === 404) {
                        console.warn(`⚠️ ${model} not found, trying next model...`);
                        lastError = `Model ${model} not found`;
                        break; // Move to next model
                    }

                    // Other error — throw immediately
                    const errData = await response.json().catch(() => ({}));
                    throw new Error(errData?.error?.message || `HTTP ${response.status}`);

                } catch (e) {
                    if (e.message?.includes('HTTP') || e.message?.includes('API Key')) throw e;
                    lastError = e.message;
                    break;
                }
            }
        }

        throw new Error(`Tất cả model đều bị rate limit. ${lastError || ''}\nVui lòng đợi 1-2 phút rồi thử lại.`);
    },

    async generateContent(prompt, systemInstruction = '', options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('Gemini API Key chưa được cấu hình. Vào Settings để nhập key.');

        const body = this._buildBody(prompt, systemInstruction, options);
        const response = await this._tryModels('generateContent', body, apiKey);

        const data = await response.json();
        const parts = data?.candidates?.[0]?.content?.parts || [];
        return parts.filter(p => p.text && !p.thought).map(p => p.text).join('') || '';
    },

    async streamContent(prompt, systemInstruction, targetElement, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('Gemini API Key chưa được cấu hình.');

        const body = this._buildBody(prompt, systemInstruction, options);
        const response = await this._tryModels('streamGenerateContent?alt=sse', body, apiKey);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let buffer = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop();

            for (const line of lines) {
                if (!line.startsWith('data: ')) continue;
                const jsonStr = line.slice(6).trim();
                if (!jsonStr || jsonStr === '[DONE]') continue;
                try {
                    const data = JSON.parse(jsonStr);
                    const parts = data?.candidates?.[0]?.content?.parts || [];
                    for (const part of parts) {
                        if (part.thought) continue;
                        if (part.text) {
                            fullText += part.text;
                            if (targetElement) {
                                targetElement.innerHTML = this.formatMarkdown(fullText);
                                targetElement.scrollTop = targetElement.scrollHeight;
                            }
                        }
                    }
                } catch (e) { /* skip malformed */ }
            }
        }
        return fullText;
    },

    formatMarkdown(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 style="color: var(--accent); margin: 1rem 0 0.5rem;">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 style="color: var(--accent); margin: 1.2rem 0 0.5rem;">$1</h3>')
            .replace(/^# (.+)$/gm, '<h2 style="color: var(--accent); margin: 1.5rem 0 0.5rem;">$1</h2>')
            .replace(/^─+$/gm, '<hr style="border:none;border-top:1px solid var(--border);margin:1rem 0;">')
            .replace(/\n/g, '<br>');
    }
};

GeminiAPI.init();
