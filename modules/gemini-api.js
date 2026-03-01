/**
 * YouTube Creator Dashboard — Gemini API Module
 * Auto-detect model mới nhất từ Google API
 * Khi Google mở Gemini 3.x, 4.x... app sẽ TỰ ĐỘNG dùng model mạnh nhất
 */
window.GeminiAPI = {
    API_BASE: 'https://generativelanguage.googleapis.com/v1beta/models',
    STORAGE_KEY: 'ytcd_gemini_api_key',

    // Fallback models nếu auto-detect thất bại
    FALLBACK_MODELS: ['gemini-2.5-flash', 'gemini-2.5-pro'],

    // Sau khi detect, lưu model list vào đây
    // Ưu tiên: Pro (mạnh) cho script, Flash (nhanh) cho tasks đơn giản
    detectedProModel: null,
    detectedFlashModel: null,
    allModels: [],

    async init() {
        console.log('🔑 Gemini API:', this.isConfigured() ? 'Key đã sẵn sàng' : 'Chưa có key - vào Settings để nhập');
        if (this.isConfigured()) {
            await this.detectLatestModels();
        }
    },

    getApiKey() { return localStorage.getItem(this.STORAGE_KEY); },

    setApiKey(key) {
        localStorage.setItem(this.STORAGE_KEY, key);
        console.log('🔑 Gemini API Key đã lưu vào localStorage');
        // Auto-detect models khi có key mới
        this.detectLatestModels();
    },

    isConfigured() {
        const key = this.getApiKey();
        return key && key.length > 0;
    },

    /**
     * 🔍 Auto-detect model mới nhất từ Google API
     * Gọi https://generativelanguage.googleapis.com/v1beta/models
     * Tự chọn model Pro mạnh nhất + Flash nhanh nhất
     */
    async detectLatestModels() {
        const apiKey = this.getApiKey();
        if (!apiKey) return;

        try {
            const response = await fetch(`${this.API_BASE}?key=${apiKey}`);
            if (!response.ok) {
                console.warn('⚠️ Không thể detect models, dùng fallback');
                return;
            }

            const data = await response.json();
            const models = (data.models || [])
                .filter(m => m.name?.includes('gemini'))
                .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                // Bỏ các model preview, tts, audio, embedding
                .filter(m => !m.name.includes('preview') &&
                    !m.name.includes('tts') &&
                    !m.name.includes('audio') &&
                    !m.name.includes('embedding') &&
                    !m.name.includes('lite'))
                .map(m => m.name.replace('models/', ''));

            if (models.length === 0) {
                console.warn('⚠️ Không tìm thấy model nào, dùng fallback');
                return;
            }

            this.allModels = models;

            // Tìm model Pro mạnh nhất (số version cao nhất)
            const proModels = models.filter(m => m.includes('pro')).sort().reverse();
            const flashModels = models.filter(m => m.includes('flash')).sort().reverse();

            this.detectedProModel = proModels[0] || null;
            this.detectedFlashModel = flashModels[0] || null;

            console.log('🚀 Auto-detect models:');
            console.log(`   📋 Tất cả: ${models.join(', ')}`);
            console.log(`   ⚡ Flash (nhanh): ${this.detectedFlashModel || 'không có'}`);
            console.log(`   💎 Pro (mạnh):   ${this.detectedProModel || 'không có'}`);

        } catch (e) {
            console.warn('⚠️ Auto-detect lỗi:', e.message, '→ dùng fallback');
        }
    },

    /**
     * Lấy danh sách model theo mục đích sử dụng
     * @param {string} purpose - 'fast' (nhanh) hoặc 'quality' (chất lượng cao)
     */
    getModels(purpose = 'fast') {
        if (purpose === 'quality') {
            // Ưu tiên Pro trước, fallback Flash
            const models = [];
            if (this.detectedProModel) models.push(this.detectedProModel);
            if (this.detectedFlashModel) models.push(this.detectedFlashModel);
            return models.length > 0 ? models : this.FALLBACK_MODELS;
        }
        // Ưu tiên Flash trước (nhanh), fallback Pro
        const models = [];
        if (this.detectedFlashModel) models.push(this.detectedFlashModel);
        if (this.detectedProModel) models.push(this.detectedProModel);
        return models.length > 0 ? models : this.FALLBACK_MODELS;
    },

    /**
     * Tạo nội dung với AI
     * @param {string} purpose - 'fast' hoặc 'quality' để chọn model phù hợp
     */
    async generateContent(prompt, systemInstruction = '', options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('Cần có API Key.');

        const purpose = options.purpose || 'fast';
        const models = this.getModels(purpose);
        let lastError = '';

        for (const model of models) {
            try {
                console.log(`🔄 Đang dùng model: ${model} (${purpose})...`);
                const url = `${this.API_BASE}/${model}:generateContent?key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxOutputTokens || 2048,
                            thinkingConfig: { thinkingBudget: 0 },
                            ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {})
                        }
                    })
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Model ${model} thành công!`);
                    // Filter out thinking parts, only return actual text
                    const parts = data?.candidates?.[0]?.content?.parts || [];
                    const textParts = parts.filter(p => p.text && !p.thought);
                    return textParts.map(p => p.text).join('') || '';
                }

                const errResponse = await response.json().catch(() => ({}));
                lastError = errResponse?.error?.message || `HTTP ${response.status}`;
                console.warn(`⚠️ Model ${model} lỗi: ${lastError}`);
            } catch (e) {
                lastError = e.message;
                console.warn(`⚠️ Model ${model} exception: ${lastError}`);
            }
        }

        throw new Error(`Lỗi Google API: ${lastError}`);
    },

    /**
     * Generate content WITH Google Search Grounding (real-time data)
     * Model sẽ tự search Google trước khi trả lời
     */
    async generateWithGrounding(prompt, systemInstruction = '', options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('Cần có API Key.');

        await this.detectLatestModels();

        const purpose = options.purpose || 'quality';
        const models = this.getModels(purpose);
        let lastError = '';

        for (const model of models) {
            try {
                console.log(`🔄🌐 Grounding với model: ${model}...`);
                const url = `${this.API_BASE}/${model}:generateContent?key=${apiKey}`;
                const body = {
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: options.temperature || 0.7,
                        maxOutputTokens: options.maxOutputTokens || 4096,
                        thinkingConfig: { thinkingBudget: 0 },
                        ...(options.responseMimeType ? { responseMimeType: options.responseMimeType } : {})
                    },
                    tools: [{ googleSearchRetrieval: {} }]
                };

                if (systemInstruction) {
                    body.systemInstruction = { parts: [{ text: systemInstruction }] };
                }

                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(body)
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅🌐 Grounding ${model} thành công!`);
                    const parts = data?.candidates?.[0]?.content?.parts || [];
                    const textParts = parts.filter(p => p.text && !p.thought);
                    const groundingMeta = data?.candidates?.[0]?.groundingMetadata;
                    if (groundingMeta) {
                        console.log('🔍 Search queries:', groundingMeta.webSearchQueries);
                    }
                    return {
                        text: textParts.map(p => p.text).join('') || '',
                        groundingMetadata: groundingMeta || null
                    };
                }

                const errResponse = await response.json().catch(() => ({}));
                lastError = errResponse?.error?.message || `HTTP ${response.status}`;
                console.warn(`⚠️ Grounding ${model} lỗi: ${lastError}`);
            } catch (e) {
                lastError = e.message;
                console.warn(`⚠️ Grounding ${model} exception: ${lastError}`);
            }
        }

        throw new Error(`Lỗi Google API (Grounding): ${lastError}`);
    },

    /**
     * Stream content từ Gemini API (hiển thị real-time)
     */
    async streamContent(prompt, systemInstruction, targetElement, options = {}) {
        const apiKey = this.getApiKey();
        if (!apiKey) throw new Error('Cần có API Key.');

        const purpose = options.purpose || 'fast';
        const models = this.getModels(purpose);
        let lastError = '';

        for (const model of models) {
            try {
                console.log(`🔄 Stream với model: ${model} (${purpose})...`);
                const url = `${this.API_BASE}/${model}:streamGenerateContent?alt=sse&key=${apiKey}`;
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ role: 'user', parts: [{ text: prompt }] }],
                        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
                        generationConfig: {
                            temperature: options.temperature || 0.7,
                            maxOutputTokens: options.maxOutputTokens || 2048,
                            thinkingConfig: { thinkingBudget: 0 }
                        }
                    })
                });

                if (response.status === 429 || response.status === 404) {
                    console.warn(`⚠️ ${model} unavailable (${response.status}), thử model tiếp...`);
                    continue;
                }

                if (!response.ok) {
                    const errData = await response.json().catch(() => ({}));
                    lastError = errData?.error?.message || `HTTP ${response.status}`;
                    console.warn(`⚠️ ${model} lỗi: ${lastError}`);
                    continue;
                }

                // Read SSE stream
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
                                    targetElement.innerHTML = this.formatScriptText(fullText);
                                    targetElement.scrollTop = targetElement.scrollHeight;
                                }
                            }
                        } catch (e) { /* skip malformed JSON */ }
                    }
                }

                console.log(`✅ Stream ${model} thành công!`);
                return fullText;
            } catch (e) {
                lastError = e.message;
                console.warn(`⚠️ Stream ${model} exception: ${lastError}`);
            }
        }

        throw new Error(`Lỗi stream: ${lastError}`);
    },

    formatScriptText(text) {
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 style="color:var(--accent);margin:12px 0 8px;">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 style="color:var(--accent);margin:16px 0 8px;">$1</h3>')
            .replace(/[─═]{3,}/g, '<hr style="border-color:rgba(255,255,255,0.1);margin:1rem 0;">')
            .replace(/\n/g, '<br>');
    },

    formatMarkdown(text) {
        if (!text) return '';
        return text
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/^### (.+)$/gm, '<h4 style="color:var(--accent);margin:12px 0 8px;">$1</h4>')
            .replace(/^## (.+)$/gm, '<h3 style="color:var(--accent);margin:16px 0 8px;">$1</h3>')
            .replace(/\n/g, '<br>');
    }
};

GeminiAPI.init();
