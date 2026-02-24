/**
 * YouTube Creator Dashboard — Thumbnail Generator
 * AI-powered thumbnail prompt generation with style consistency
 * Only for long-form videos (Shorts use auto-frame)
 */
window.ThumbnailGenerator = {

    results: null,

    THUMBNAIL_STYLES: {
        'match-video': {
            name: 'Theo Style Video',
            desc: 'Dùng cùng style đã chọn cho phân cảnh',
            getPrompt: () => {
                const style = SceneManager.getStylePrompt();
                return style.prefix || 'High quality YouTube thumbnail style';
            }
        },
        'dramatic': {
            name: 'Dramatic / Gây Sốc',
            desc: 'Biểu cảm mạnh, tương phản cao',
            getPrompt: () => 'Dramatic YouTube thumbnail, high contrast, bold colors, shocked expression, attention-grabbing composition, cinematic lighting, professional quality'
        },
        'minimal': {
            name: 'Tối Giản / Clean',
            desc: 'Ít chi tiết, text lớn, nền đơn sắc',
            getPrompt: () => 'Minimalist YouTube thumbnail, clean background, bold simple graphics, solid color backdrop, modern typography area, professional and sleek'
        },
        'collage': {
            name: 'Collage / Ghép Hình',
            desc: 'Nhiều ảnh nhỏ ghép lại',
            getPrompt: () => 'YouTube thumbnail collage style, multiple elements arranged in dynamic layout, split composition, before-after or comparison style, visual variety'
        },
        'custom': {
            name: 'Custom',
            desc: 'Nhập mô tả thumbnail riêng',
            getPrompt: () => document.getElementById('thumbnailCustomStyle')?.value?.trim() || ''
        }
    },

    selectedThumbnailStyle: 'match-video',

    selectStyle(styleKey) {
        this.selectedThumbnailStyle = styleKey;
        this.renderStyleOptions();
        const customInput = document.getElementById('thumbnailCustomInput');
        if (customInput) customInput.classList.toggle('visible', styleKey === 'custom');
    },

    renderStyleOptions() {
        const container = document.getElementById('thumbnailStyleOptions');
        if (!container) return;

        container.innerHTML = Object.entries(this.THUMBNAIL_STYLES).map(([key, style]) => `
            <div class="style-card ${this.selectedThumbnailStyle === key ? 'selected' : ''}"
                 data-style="${key}" onclick="ThumbnailGenerator.selectStyle('${key}')"
                 style="padding:0.5rem;">
                <div class="style-name">${style.name}</div>
                <div class="style-desc">${style.desc}</div>
            </div>
        `).join('');
    },

    async generatePrompts(topic, scriptText = '') {
        const stylePrompt = this.THUMBNAIL_STYLES[this.selectedThumbnailStyle]?.getPrompt() || '';

        const systemInstruction = `Bạn là chuyên gia thiết kế thumbnail YouTube viral.

NHIỆM VỤ: Tạo 3 phương án thumbnail cho video.

STYLE: ${stylePrompt}

QUY TẮC THUMBNAIL VIRAL:
- Kích thước 1280x720px (16:9)
- Tối đa 3-5 từ text lớn, dễ đọc trên mobile
- Biểu cảm/hình ảnh kích thích tò mò
- Tương phản màu cao (text nổi bật trên nền)
- Không quá rối, focus vào 1 subject chính
- Text bằng TIẾNG VIỆT (dấu đúng)

OUTPUT FORMAT (JSON):
[
  {
    "id": 1,
    "concept": "Mô tả concept thumbnail ngắn gọn",
    "text": "TEXT TRÊN THUMBNAIL (3-5 từ tiếng Việt)",
    "imagePrompt": "Detailed image prompt in English for generating the thumbnail background/scene. ${stylePrompt}. YouTube thumbnail 1280x720, 16:9 aspect ratio.",
    "colorScheme": "Ví dụ: Red & Yellow, Dark Blue & Gold..."
  }
]

CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH.`;

        const context = scriptText
            ? `\nTóm tắt kịch bản:\n${scriptText.substring(0, 500)}...`
            : '';

        const result = await GeminiAPI.generateContent(
            `Tạo 3 phương án thumbnail cho video YouTube về: "${topic}"${context}`,
            systemInstruction,
            { temperature: 0.9, maxOutputTokens: 4096 }
        );

        // Parse JSON
        let jsonStr = result.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');
        try {
            this.results = JSON.parse(jsonStr);
        } catch {
            const match = jsonStr.match(/\[[\s\S]*\]/);
            if (match) this.results = JSON.parse(match[0]);
            else throw new Error('Không thể parse kết quả thumbnail.');
        }

        return this.results;
    },

    renderResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.results) return;

        container.style.display = 'block';
        container.innerHTML = this.results.map((thumb, i) => `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🖼️ Phương án ${thumb.id || i + 1}</div>
                    <span class="badge badge-accent">${thumb.colorScheme || ''}</span>
                </div>
                <div style="font-size:0.85rem;margin-bottom:0.5rem;">
                    <strong>Concept:</strong> ${thumb.concept}
                </div>
                <div style="font-size:0.85rem;margin-bottom:0.5rem;">
                    <strong>Text overlay:</strong> <span style="color:var(--accent);font-weight:700;font-size:1.1rem;">${thumb.text}</span>
                </div>
                <div class="scene-prompt">${thumb.imagePrompt}</div>
                <div class="btn-row" style="margin-top:0.75rem;">
                    <button class="copy-btn" onclick="navigator.clipboard.writeText(\`${thumb.imagePrompt.replace(/`/g, '\\`')}\`); app.toast('Đã copy prompt!','success');">📋 Copy Prompt</button>
                </div>
            </div>
        `).join('');

        const footer = document.getElementById('thumbnailFooter');
        if (footer) footer.style.display = 'block';
    },

    toJSON() { return { results: this.results, selectedStyle: this.selectedThumbnailStyle }; },
    fromJSON(data) {
        if (data?.results) this.results = data.results;
        if (data?.selectedStyle) this.selectedThumbnailStyle = data.selectedStyle;
    }
};
