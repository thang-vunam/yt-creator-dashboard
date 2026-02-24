/**
 * YouTube Creator Dashboard — Search Analysis Module
 * Handles keyword suggestions and competition analysis.
 * (Renamed from keyword-research to avoid ad-blocker false positives)
 */
window.AnalysisEngine = {

    YT_API_BASE: 'https://www.googleapis.com/youtube/v3',
    STORAGE_KEY: 'ytcd_youtube_api_key',
    // ⬇️ ĐÃ DÁN YOUTUBE API KEY CỦA BẠN VÀO ĐÂY (GIỮ KÍN NẾU SỬ DỤNG CÔNG KHAI)
    DEFAULT_KEY: 'AIzaSyC2OT4SR8wYs6p02xxjcb1SkDTKIB663yc',
    results: null,

    init() {
        if (!this.getApiKey() && this.DEFAULT_KEY) {
            localStorage.setItem(this.STORAGE_KEY, this.DEFAULT_KEY);
        }
    },

    getApiKey() { return localStorage.getItem(this.STORAGE_KEY); },

    // ═══ Keyword Suggestions (Gemini-powered) ═══
    async getAutocompleteSuggestions(query) {
        try {
            const prompt = `Bạn là chuyên gia YouTube SEO. Gợi ý 15 từ khóa tìm kiếm YouTube liên quan đến "${query}".

QUY TẮC:
- Từ khóa phải là cụm từ mà người xem THỰC SỰ gõ trên YouTube
- Bao gồm: long-tail keywords, câu hỏi, từ khóa trend
- Ưu tiên tiếng Việt
- Sắp xếp theo volume ước lượng (cao → thấp)

CHỈ TRẢ VỀ danh sách, mỗi dòng 1 keyword, KHÔNG đánh số, KHÔNG giải thích.`;

            const result = await GeminiAPI.generateContent(prompt, '', { temperature: 0.8, maxOutputTokens: 500 });
            return result.trim().split('\n')
                .map(s => s.replace(/^[\d\.\-\*\s]+/, '').trim())
                .filter(s => s.length > 0)
                .slice(0, 15);
        } catch (e) {
            console.warn('Keyword suggestions error:', e);
            return [];
        }
    },

    // ═══ YouTube Search for competition analysis ═══
    async searchYouTube(query, maxResults = 10) {
        const apiKey = this.getApiKey();
        if (!apiKey) return [];

        try {
            const url = `${this.YT_API_BASE}/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=${maxResults}&order=relevance&key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`YouTube API ${response.status}`);
            const data = await response.json();
            return data.items || [];
        } catch (e) {
            console.warn('YouTube search error:', e);
            return [];
        }
    },

    // ═══ Get video stats for competition analysis ═══
    async getVideoStats(videoIds) {
        const apiKey = this.getApiKey();
        if (!apiKey || videoIds.length === 0) return [];

        try {
            const url = `${this.YT_API_BASE}/videos?part=statistics,snippet&id=${videoIds.join(',')}&key=${apiKey}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error(`YouTube API ${response.status}`);
            const data = await response.json();
            return data.items || [];
        } catch (e) {
            console.warn('Video stats error:', e);
            return [];
        }
    },

    // ═══ Full Research Pipeline ═══
    async research(seedKeyword, channel = 'finance') {
        const channelContext = channel === 'finance'
            ? 'đầu tư, tài chính, chứng khoán, tiền bạc Việt Nam'
            : 'tâm lý học, tâm lý, phát triển bản thân Việt Nam';

        // 1. Get autocomplete suggestions
        const suggestions = await this.getAutocompleteSuggestions(seedKeyword);

        // 2. Search YouTube for competition
        const searchResults = await this.searchYouTube(seedKeyword, 10);
        const videoIds = searchResults.map(r => r.id?.videoId).filter(Boolean);
        const videoStats = videoIds.length > 0 ? await this.getVideoStats(videoIds) : [];

        // 3. AI Analysis via Gemini
        const analysisPrompt = `Phân tích keyword "${seedKeyword}" cho kênh YouTube về ${channelContext}.

Dữ liệu YouTube Autocomplete: ${suggestions.slice(0, 15).join(', ')}

Top 10 video cạnh tranh:
${videoStats.slice(0, 10).map((v, i) => `${i + 1}. "${v.snippet?.title}" — ${Number(v.statistics?.viewCount || 0).toLocaleString()} views, ${Number(v.statistics?.likeCount || 0).toLocaleString()} likes`).join('\n')}

PHÂN TÍCH:
1. **Đánh giá keyword chính**: Volume ước lượng (cao/trung bình/thấp), độ cạnh tranh, phù hợp kênh?
2. **5-8 keyword phụ gợi ý**: Dựa trên autocomplete + gaps
3. **3-5 góc tiếp cận nội dung**: Unique angles chưa ai làm
4. **Đề xuất tiêu đề video**: 3 tiêu đề viral cho keyword này
5. **Phân tích đối thủ**: Top 3 video view cao nhất — điểm mạnh/yếu
6. **Kết luận**: NÊN hay KHÔNG NÊN làm video này, lý do

Trả lời bằng tiếng Việt, format markdown rõ ràng.

QUAN TRỌNG: Cuối cùng, ở DÒNG CUỐI, liệt kê chính xác các keyword phụ đã gợi ý theo format:
SECONDARY_KEYWORDS: keyword1, keyword2, keyword3, keyword4, keyword5`;

        const analysis = await GeminiAPI.generateContent(analysisPrompt, '', { temperature: 0.7 });

        // Extract secondary keywords from the analysis
        let secondaryKeywords = [];
        const kwMatch = analysis.match(/SECONDARY_KEYWORDS:\s*(.+)/i);
        if (kwMatch) {
            secondaryKeywords = kwMatch[1].split(',').map(k => k.trim()).filter(k => k.length > 0);
        }
        // Fallback: use autocomplete suggestions as secondary keywords
        if (secondaryKeywords.length === 0 && suggestions.length > 0) {
            secondaryKeywords = suggestions.slice(0, 8);
        }

        // Clean analysis text (remove the SECONDARY_KEYWORDS line from display)
        const cleanAnalysis = analysis.replace(/\n?SECONDARY_KEYWORDS:.+$/i, '').trim();

        this.results = {
            keyword: seedKeyword,
            secondaryKeywords,
            suggestions,
            searchResults: videoStats.slice(0, 10).map(v => ({
                title: v.snippet?.title,
                views: Number(v.statistics?.viewCount || 0),
                likes: Number(v.statistics?.likeCount || 0),
                comments: Number(v.statistics?.commentCount || 0),
                channel: v.snippet?.channelTitle,
                publishedAt: v.snippet?.publishedAt
            })),
            analysis: cleanAnalysis
        };

        return this.results;
    },

    // ═══ Render ═══
    renderResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.results) return;

        const r = this.results;
        container.style.display = 'block';

        // Autocomplete suggestions
        const suggestionsHtml = r.suggestions.length > 0
            ? r.suggestions.slice(0, 15).map(s =>
                `<span class="badge badge-info" style="cursor:pointer;margin:0.15rem;" onclick="document.getElementById('researchKeyword').value='${s.replace(/'/g, "\\'")}'">🔍 ${s}</span>`
            ).join(' ')
            : '<span style="color:var(--text-muted);">Không có gợi ý</span>';

        // Competition table
        const compHtml = r.searchResults.length > 0
            ? `<table style="width:100%;border-collapse:collapse;font-size:0.8rem;">
                <thead><tr>
                    <th style="text-align:left;padding:0.4rem;border-bottom:1px solid var(--border);color:var(--text-secondary);">#</th>
                    <th style="text-align:left;padding:0.4rem;border-bottom:1px solid var(--border);color:var(--text-secondary);">Video</th>
                    <th style="text-align:right;padding:0.4rem;border-bottom:1px solid var(--border);color:var(--text-secondary);">Views</th>
                    <th style="text-align:right;padding:0.4rem;border-bottom:1px solid var(--border);color:var(--text-secondary);">Likes</th>
                </tr></thead>
                <tbody>${r.searchResults.map((v, i) => `
                    <tr>
                        <td style="padding:0.4rem;border-bottom:1px solid var(--border);">${i + 1}</td>
                        <td style="padding:0.4rem;border-bottom:1px solid var(--border);max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${v.title}</td>
                        <td style="padding:0.4rem;border-bottom:1px solid var(--border);text-align:right;color:var(--success);">${v.views.toLocaleString()}</td>
                        <td style="padding:0.4rem;border-bottom:1px solid var(--border);text-align:right;">${v.likes.toLocaleString()}</td>
                    </tr>
                `).join('')}</tbody></table>`
            : '<span style="color:var(--text-muted);">Không có dữ liệu</span>';

        container.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">🔤 Gợi Ý Từ Khóa (Autocomplete)</div>
                </div>
                <div style="display:flex;flex-wrap:wrap;gap:0.25rem;">${suggestionsHtml}</div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">📊 Phân Tích Đối Thủ (Top 10)</div>
                </div>
                ${compHtml}
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">🤖 Phân Tích AI</div>
                    <button class="copy-btn" onclick="app.copySEO('researchAnalysis')">📋 Copy</button>
                </div>
                <div id="researchAnalysis" style="font-size:0.85rem;line-height:1.7;">
                    ${GeminiAPI.formatMarkdown(r.analysis)}
                </div>
            </div>
        `;
    },

    toJSON() { return { results: this.results }; },
    fromJSON(data) { if (data?.results) this.results = data.results; }
};

AnalysisEngine.init();
