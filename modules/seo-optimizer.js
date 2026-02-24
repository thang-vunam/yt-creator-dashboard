/**
 * YouTube Creator Dashboard — SEO Optimizer
 * Generate titles, descriptions, tags, and hashtags
 */
window.SEOOptimizer = {

    results: null,

    SYSTEM_PROMPTS: {
        titles: `Bạn là chuyên gia YouTube SEO hàng đầu Việt Nam.

NHIỆM VỤ: Tạo tiêu đề video YouTube VIRAL.

QUY TẮC:
- Dưới 70 ký tự
- Chứa keyword chính ở đầu
- Tạo tò mò + urgency
- Dùng số, dấu ngoặc [] hoặc ()
- KHÔNG clickbait lố, phải đúng nội dung
- Kết hợp: Power words + Emotion + Benefit

OUTPUT: CHÍNH XÁC 10 tiêu đề, đánh số 1-10, mỗi dòng 1 tiêu đề. Không giải thích.`,

        description: `Bạn là chuyên gia YouTube SEO. Viết mô tả video YouTube tối ưu SEO.

QUY TẮC:
- 2-3 dòng đầu quan trọng nhất (hiển thị trước "Show more")
- Keyword tự nhiên, 3-5 lần
- Timestamps (nếu video dài)
- Links kêu gọi subscribe, playlist
- 200-400 từ
- Emoji vừa phải

OUTPUT: MỘT mô tả hoàn chỉnh, copy-paste được.`,

        tags: `Bạn là chuyên gia YouTube SEO. Tạo tags tối ưu.

QUY TẮC:
- 20-30 tags mix: broad + specific + long-tail
- Tag tiếng Việt + tiếng Anh (nếu phù hợp)
- Gồm keyword chính, variations, related topics

OUTPUT: Danh sách tags, phân cách bằng dấu phẩy. Không giải thích.`,

        hashtags: `Bạn là chuyên gia YouTube SEO. Tạo hashtags.

QUY TẮC:
- 3-5 hashtags (YouTube recommend)
- Mix: 1 broad + 2 specific + 1-2 trending
- Không dấu cách trong hashtag

OUTPUT: Hashtags cách nhau bởi dấu cách. Không giải thích.`,

        filename: `Bạn là chuyên gia SEO. Đề xuất tên file video.

QUY TẮC:
- Chứa keyword chính
- Dùng dấu gạch ngang, không dấu cách
- Không dấu tiếng Việt (ASCII only)
- Dưới 50 ký tự

OUTPUT: CHÍNH XÁC 1 tên file (không kèm extension). Không giải thích.`
    },

    async generateAll(keyword, scriptText = '') {
        const context = scriptText
            ? `\nNội dung kịch bản (tóm tắt):\n${scriptText.substring(0, 500)}...`
            : '';

        const [titles, description, tags, hashtags, filename] = await Promise.all([
            GeminiAPI.generateContent(`Keyword: "${keyword}"${context}`, this.SYSTEM_PROMPTS.titles, { temperature: 0.9 }),
            GeminiAPI.generateContent(`Keyword: "${keyword}"${context}`, this.SYSTEM_PROMPTS.description, { temperature: 0.7 }),
            GeminiAPI.generateContent(`Keyword: "${keyword}"${context}`, this.SYSTEM_PROMPTS.tags, { temperature: 0.6 }),
            GeminiAPI.generateContent(`Keyword: "${keyword}"${context}`, this.SYSTEM_PROMPTS.hashtags, { temperature: 0.6 }),
            GeminiAPI.generateContent(`Keyword: "${keyword}"`, this.SYSTEM_PROMPTS.filename, { temperature: 0.3 })
        ]);

        this.results = { keyword, titles, description, tags, hashtags, filename: filename.trim() };
        return this.results;
    },

    async generateTitlesOnly(keyword) {
        const titles = await GeminiAPI.generateContent(
            `Keyword: "${keyword}"`,
            this.SYSTEM_PROMPTS.titles,
            { temperature: 0.9 }
        );
        return titles;
    },

    renderResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.results) return;

        container.style.display = 'block';
        container.innerHTML = `
            ${this._resultBlock('📁 Tên File', this.results.filename, 'filename')}
            ${this._resultBlock('📝 Tiêu Đề (10 options)', this.results.titles, 'titles')}
            ${this._resultBlock('📄 Mô Tả Video', this.results.description, 'description')}
            ${this._resultBlock('🏷️ Tags', this.results.tags, 'tags')}
            ${this._resultBlock('#️⃣ Hashtags', this.results.hashtags, 'hashtags')}
        `;

        // Show footer
        const footer = document.getElementById('seoFooter');
        if (footer) footer.style.display = 'block';
    },

    _resultBlock(label, content, key) {
        const id = `seo-${key}`;
        return `
            <div class="seo-result">
                <div class="seo-result-header">
                    <span class="seo-result-label">${label}</span>
                    <button class="copy-btn" onclick="app.copySEO('${id}')">📋 Copy</button>
                </div>
                <div class="seo-result-content" id="${id}">${content.replace(/\n/g, '<br>')}</div>
            </div>
        `;
    },

    toJSON() { return { results: this.results }; },
    fromJSON(data) { if (data.results) this.results = data.results; }
};
