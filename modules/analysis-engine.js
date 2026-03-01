/**
 * YouTube Creator Dashboard — Search Analysis Module
 */
window.AnalysisEngine = {
    YT_API_BASE: 'https://www.googleapis.com/youtube/v3',
    STORAGE_KEY: 'ytcd_youtube_api_key',
    results: null,

    init() {
        // YouTube API Key được nhập qua UI Settings
        console.log('🔑 YouTube API:', this.getApiKey() ? 'Key đã sẵn sàng' : 'Chưa có key - vào Settings để nhập');
    },

    getApiKey() { return localStorage.getItem(this.STORAGE_KEY); },

    async research(keyword) {
        const apiKey = this.getApiKey();

        // 1. Gợi ý từ khóa
        let suggestions = [];
        try {
            const prompt = `Gợi ý 15 từ khóa YouTube liên quan đến "${keyword}". Chỉ trả về danh sách, mỗi dòng 1 từ khóa tiếng Việt.`;
            const res = await GeminiAPI.generateContent(prompt);
            suggestions = res.trim().split('\n').map(s => s.replace(/^[\d\.\-\*\s]+/, '').trim()).filter(Boolean);
        } catch (e) { console.warn("Gemini Error:", e); }

        // 2. Tìm kiếm đối thủ
        let videos = [];
        try {
            const url = `${this.YT_API_BASE}/search?part=snippet&q=${encodeURIComponent(keyword)}&type=video&maxResults=5&key=${apiKey}`;
            const response = await fetch(url);
            const data = await response.json();
            videos = (data.items || []).map(v => ({ title: v.snippet.title, views: 0 })); // Đơn giản hóa
        } catch (e) { console.warn("YouTube Error:", e); }

        // 3. Phân tích AI
        const analysisPrompt = `Phân tích từ khóa "${keyword}". Danh sách video cạnh tranh: ${videos.map(v => v.title).join(', ')}. Đề xuất 3 tiêu đề viral và chiến lược SEO. Trả về tiếng Việt. Kết thúc bằng SECONDARY_KEYWORDS: k1, k2...`;
        const analysis = await GeminiAPI.generateContent(analysisPrompt);

        this.results = {
            keyword,
            suggestions,
            searchResults: videos,
            analysis: analysis.replace(/\n?SECONDARY_KEYWORDS:.+$/i, '').trim(),
            secondaryKeywords: suggestions.slice(0, 5)
        };
        return this.results;
    },

    renderResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.results) return;
        const r = this.results;
        container.style.display = 'block';
        container.innerHTML = `
            <div class="card"><div class="card-header"><div class="card-title">🔍 Gợi ý</div></div>
            <div style="display:flex;flex-wrap:wrap;gap:5px;">${r.suggestions.map(s => `<span class="badge badge-info">${s}</span>`).join('')}</div></div>
            <div class="card"><div class="card-header"><div class="card-title">🤖 Phân tích AI</div></div>
            <div style="line-height:1.6">${GeminiAPI.formatMarkdown(r.analysis)}</div></div>
        `;
    },

    // ═══════════════════════════════════════════
    // TRENDING KEYWORDS DISCOVERY
    // ═══════════════════════════════════════════

    trendingResults: null,

    NICHE_CONTEXT: {
        finance: {
            name: 'Đầu tư & Tài chính',
            icon: '💰',
            topics: 'đầu tư chứng khoán, tài chính cá nhân, crypto, bất động sản, quản lý tiền, kinh tế vĩ mô, startup, passive income, ETF, cổ phiếu, forex, tiết kiệm, lãi suất, ngân hàng, fintech',
            isDefault: true
        },
        psychology: {
            name: 'Giải mã Tâm lý',
            icon: '🧠',
            topics: 'tâm lý học, phát triển bản thân, mối quan hệ, stress, EQ, ngôn ngữ cơ thể, tâm lý đám đông, manipulation, thao túng tâm lý, self-help, mindset, thói quen, NLP, tâm lý tội phạm, dark psychology',
            isDefault: true
        }
    },

    // Load custom channels from localStorage and merge with defaults
    _initChannels() {
        try {
            const saved = localStorage.getItem('yt_custom_channels');
            if (saved) {
                const custom = JSON.parse(saved);
                Object.assign(this.NICHE_CONTEXT, custom);
            }
        } catch (e) { console.warn('Failed to load custom channels:', e); }
    },

    _saveCustomChannels() {
        const custom = {};
        for (const [key, val] of Object.entries(this.NICHE_CONTEXT)) {
            if (!val.isDefault) custom[key] = val;
        }
        localStorage.setItem('yt_custom_channels', JSON.stringify(custom));
    },

    addChannel(id, name, icon, topics) {
        if (!id || !name || !topics) throw new Error('Cần có ID, tên và chủ đề cho kênh.');
        if (this.NICHE_CONTEXT[id]) throw new Error(`Kênh "${id}" đã tồn tại.`);
        this.NICHE_CONTEXT[id] = { name, icon: icon || '📺', topics, isDefault: false };
        this._saveCustomChannels();
        return this.NICHE_CONTEXT[id];
    },

    removeChannel(id) {
        if (!this.NICHE_CONTEXT[id]) return;
        if (this.NICHE_CONTEXT[id].isDefault) throw new Error('Không thể xóa kênh mặc định.');
        delete this.NICHE_CONTEXT[id];
        this._saveCustomChannels();
    },

    updateChannel(id, data) {
        if (!this.NICHE_CONTEXT[id]) return;
        Object.assign(this.NICHE_CONTEXT[id], data);
        this._saveCustomChannels();
    },

    getChannels() {
        return { ...this.NICHE_CONTEXT };
    },

    async discoverTrending(channel) {
        const niche = this.NICHE_CONTEXT[channel] || this.NICHE_CONTEXT.finance;

        // ══════════════════════════════════════
        // STEP 1: Fetch real YouTube data
        // ══════════════════════════════════════
        let ytData = '';
        try {
            const ytVideos = await this._fetchYouTubeTrending(niche);
            if (ytVideos.length > 0) {
                ytData = `\n\nDỮ LIỆU THỰC TẾ TỪ YOUTUBE (${new Date().toLocaleDateString('vi-VN')}):\n`;
                ytData += ytVideos.map((v, i) =>
                    `${i + 1}. "${v.title}" — ${v.views} views, ${v.publishedAt}`
                ).join('\n');
                console.log(`📊 YouTube data: ${ytVideos.length} videos fetched`);
            }
        } catch (e) {
            console.warn('⚠️ YouTube trending fetch failed:', e.message);
        }

        // ══════════════════════════════════════
        // STEP 2: Gemini + Google Search Grounding
        // ══════════════════════════════════════
        const today = new Date().toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });

        const prompt = `Ngày hôm nay là ${today}.

Bạn là chuyên gia phân tích xu hướng YouTube tại Việt Nam.

Kênh: ${niche.name}
Các chủ đề liên quan: ${niche.topics}
${ytData}

Nhiệm vụ: Dựa trên DỮ LIỆU THỰC TẾ ở trên VÀ kết quả tìm kiếm Google, hãy tìm 10 từ khóa/chủ đề đang TRENDING hoặc có tiềm năng cao trên YouTube Việt Nam NGAY BÂY GIỜ (${today}) cho niche "${niche.name}".

QUAN TRỌNG:
- CHỈ đề xuất chủ đề dựa trên SỰ KIỆN THỰC TẾ đang xảy ra, KHÔNG bịa đặt
- Dữ liệu phải phản ánh đúng thời điểm ${today}
- Nếu không chắc chắn về một sự kiện, KHÔNG đưa vào danh sách
- Ưu tiên tin tức và sự kiện có thể xác minh được

Trả về CHÍNH XÁC theo format JSON sau, KHÔNG có text nào khác:
[
  {
    "keyword": "từ khóa/chủ đề cụ thể (chính xác, dựa trên dữ liệu thực)",
    "viralScore": 4,
    "reason": "lý do CỤ THỂ tại sao trending (dẫn chứng thực tế)",
    "videoAngle": "gợi ý góc tiếp cận video cụ thể",
    "competition": "thấp",
    "category": "trending | evergreen | gap | news"
  }
]

Quy tắc:
- viralScore: 1-5 (5 = viral nhất)
- competition: "thấp" | "trung bình" | "cao"
- category: "trending" (đang hot), "evergreen" (luôn được tìm), "gap" (ít người làm), "news" (tin mới)
- Keyword phải cụ thể, có thể dùng làm tiêu đề video ngay
- Ưu tiên keyword tiếng Việt`;

        let response;
        let usedGrounding = false;

        try {
            // Try with Google Search Grounding first
            response = await GeminiAPI.generateWithGrounding(prompt, '', {
                purpose: 'quality',
                temperature: 0.7,
                maxOutputTokens: 4096
            });
            usedGrounding = true;
            console.log('🌐 Used Google Search Grounding');
        } catch (e) {
            console.warn('⚠️ Grounding failed, falling back to standard:', e.message);
            // Fallback to standard generateContent
            const text = await GeminiAPI.generateContent(prompt, '', {
                purpose: 'quality',
                temperature: 0.7,
                maxOutputTokens: 4096
            });
            response = { text, groundingMetadata: null };
        }

        // ══════════════════════════════════════
        // STEP 3: Parse JSON
        // ══════════════════════════════════════
        const rawText = response.text;
        let keywords = [];
        try {
            const jsonMatch = rawText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                keywords = JSON.parse(jsonMatch[0]);
            }
        } catch (e) {
            console.warn('⚠️ JSON parse error:', e.message);
            keywords = [];
        }

        if (keywords.length === 0) {
            throw new Error('Không thể phân tích kết quả. Vui lòng thử lại.');
        }

        keywords.sort((a, b) => (b.viralScore || 0) - (a.viralScore || 0));

        this.trendingResults = {
            channel,
            niche: niche.name,
            keywords,
            timestamp: Date.now(),
            sources: {
                youtube: ytData ? true : false,
                googleGrounding: usedGrounding,
                searchQueries: response.groundingMetadata?.webSearchQueries || []
            }
        };

        return this.trendingResults;
    },

    /**
     * Fetch real YouTube trending/popular videos for a niche
     */
    async _fetchYouTubeTrending(niche) {
        const apiKey = this.getApiKey();
        if (!apiKey) return [];

        const videos = [];

        try {
            // 1. Get trending videos in Vietnam
            const trendingUrl = `${this.YT_API_BASE}/videos?part=snippet,statistics&chart=mostPopular&regionCode=VN&maxResults=10&key=${apiKey}`;
            const trendingRes = await fetch(trendingUrl);
            if (trendingRes.ok) {
                const data = await trendingRes.json();
                (data.items || []).forEach(v => {
                    videos.push({
                        title: v.snippet.title,
                        views: this._formatViews(v.statistics?.viewCount),
                        publishedAt: new Date(v.snippet.publishedAt).toLocaleDateString('vi-VN'),
                        source: 'trending'
                    });
                });
            }
        } catch (e) { console.warn('Trending fetch error:', e.message); }

        try {
            // 2. Search for recent popular videos in niche
            const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
            const nicheKeywords = niche.topics.split(',').slice(0, 3).map(t => t.trim()).join('|');
            const searchUrl = `${this.YT_API_BASE}/search?part=snippet&q=${encodeURIComponent(nicheKeywords)}&type=video&order=viewCount&publishedAfter=${weekAgo}&regionCode=VN&maxResults=10&key=${apiKey}`;
            const searchRes = await fetch(searchUrl);
            if (searchRes.ok) {
                const data = await searchRes.json();
                (data.items || []).forEach(v => {
                    videos.push({
                        title: v.snippet.title,
                        views: 'N/A',
                        publishedAt: new Date(v.snippet.publishedAt).toLocaleDateString('vi-VN'),
                        source: 'niche-search'
                    });
                });
            }
        } catch (e) { console.warn('Niche search error:', e.message); }

        return videos;
    },

    _formatViews(count) {
        if (!count) return 'N/A';
        const n = parseInt(count);
        if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
        if (n >= 1000) return `${(n / 1000).toFixed(0)}K`;
        return count;
    },

    renderTrendingResults(containerId) {
        const container = document.getElementById(containerId);
        if (!container || !this.trendingResults) return;

        const { keywords, niche, sources } = this.trendingResults;

        const categoryIcons = {
            trending: '🔥', evergreen: '🌲', gap: '💎', news: '📰'
        };
        const categoryLabels = {
            trending: 'Đang Hot', evergreen: 'Evergreen', gap: 'Cơ hội', news: 'Tin mới'
        };

        // Source badges
        const sourceBadges = [];
        if (sources?.youtube) sourceBadges.push('<span class="badge badge-info" style="font-size:0.7rem;">📊 YouTube Data</span>');
        if (sources?.googleGrounding) sourceBadges.push('<span class="badge badge-info" style="font-size:0.7rem;">🌐 Google Search</span>');
        const sourceHTML = sourceBadges.length > 0
            ? `<div style="margin-bottom:0.75rem;display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
                <span style="font-size:0.75rem;color:var(--text-muted);">Nguồn dữ liệu:</span>
                ${sourceBadges.join('')}
                <span style="font-size:0.7rem;color:var(--text-muted);">— ${new Date().toLocaleString('vi-VN')}</span>
               </div>`
            : '';

        const cardsHTML = keywords.map((kw, i) => {
            const fires = '🔥'.repeat(Math.min(kw.viralScore || 1, 5));
            const catIcon = categoryIcons[kw.category] || '🔥';
            const catLabel = categoryLabels[kw.category] || 'Trending';
            const compClass = kw.competition === 'thấp' ? 'comp-low' : kw.competition === 'cao' ? 'comp-high' : 'comp-mid';

            return `
                <div class="trending-card" style="animation-delay: ${i * 0.06}s">
                    <div class="trending-card-header">
                        <span class="trending-rank">#${i + 1}</span>
                        <span class="trending-category badge badge-${kw.category || 'trending'}">${catIcon} ${catLabel}</span>
                    </div>
                    <div class="trending-keyword">${kw.keyword}</div>
                    <div class="trending-viral">${fires} <span class="viral-score">${kw.viralScore}/5</span></div>
                    <div class="trending-reason">💡 ${kw.reason}</div>
                    <div class="trending-angle">🎬 ${kw.videoAngle}</div>
                    <div class="trending-footer">
                        <span class="trending-comp ${compClass}">Cạnh tranh: ${kw.competition}</span>
                        <button class="btn btn-sm btn-primary" onclick="app.useTrendingKeyword('${kw.keyword.replace(/'/g, "\\'")}')">
                            ✨ Dùng keyword này
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        container.style.display = 'block';
        container.innerHTML = `
            ${sourceHTML}
            <div class="trending-grid">${cardsHTML}</div>
        `;
    }
};

AnalysisEngine.init();
