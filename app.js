/**
 * YouTube Creator Dashboard — Main Application Controller
 * Orchestrates all modules and handles UI interactions
 */
const app = {

    currentChannel: 'finance',
    currentPanel: 'research',
    breakdownMode: 'auto', // 'auto' or 'manual'

    // ═══════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════

    init() {
        // Load API key to settings input
        const geminiKeyEl = document.getElementById('settingsGeminiKey');
        if (geminiKeyEl && GeminiAPI.isConfigured()) {
            geminiKeyEl.value = GeminiAPI.getApiKey();
        }

        // Render style grid
        SceneManager.renderStyleGrid();

        // Render YouTube API key in settings
        const ytKeyEl = document.getElementById('settingsYoutubeKey');
        if (ytKeyEl && KeywordResearch.getApiKey()) {
            ytKeyEl.value = KeywordResearch.getApiKey();
        }

        // Try to restore previous session (F5-proof)
        const restored = this._restoreSession();
        if (!restored) {
            this._resetAllState();
            const project = ProjectManager.createProject('Video mới', this.currentChannel);
            document.getElementById('projectName').textContent = project.name;
        }

        // Setup drag & drop for watermark
        this._setupDragDrop();

        console.log('✅ YouTube Creator Dashboard initialized', restored ? '(restored from session)' : '(fresh)');
    },

    // ═══════════════════════════════════════════
    // NAVIGATION
    // ═══════════════════════════════════════════

    switchPanel(panelId) {
        this.currentPanel = panelId;

        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.panel === panelId);
        });

        // Update panels
        document.querySelectorAll('.panel').forEach(panel => {
            panel.classList.toggle('active', panel.id === `panel-${panelId}`);
        });

        // Panel-specific init
        if (panelId === 'scenes') SceneManager.renderStyleGrid();
        if (panelId === 'thumbnail') ThumbnailGenerator.renderStyleOptions();
        if (panelId === 'projects') ProjectManager.renderProjectList('projectList');
        if (panelId === 'scenes') {
            SceneManager.renderStyleGrid();
            this.switchBreakdownMode(this.breakdownMode);
        }
        if (panelId === 'seo' && ScriptWriter.currentScript) {
            const kw = document.getElementById('seoKeyword');
            if (kw && !kw.value) kw.value = document.getElementById('scriptTopic')?.value || document.getElementById('researchKeyword')?.value || '';
            // Clear stale results if keyword changed
            if (kw && SEOOptimizer.results && SEOOptimizer.results.keyword !== kw.value) {
                document.getElementById('seoResults').style.display = 'none';
                document.getElementById('seoFooter').style.display = 'none';
            }
        }
    },

    switchChannel(channel) {
        this.currentChannel = channel;
        document.body.setAttribute('data-channel', channel);
        this._updateChannelUI();

        // Auto-select default style for channel
        const defaultStyles = {
            finance: 'stick-crumpled',
            psychology: 'neon-stick'
        };
        if (!SceneManager.selectedStyle || SceneManager.selectedStyle !== defaultStyles[channel]) {
            SceneManager.selectStyle(defaultStyles[channel] || 'stick-crumpled');
        }
    },

    _updateChannelUI() {
        document.querySelectorAll('.channel-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.channel === this.currentChannel);
        });
    },

    // ═══════════════════════════════════════════
    // STEP 1: KEYWORD RESEARCH
    // ═══════════════════════════════════════════

    async runResearch() {
        const keyword = document.getElementById('researchKeyword')?.value?.trim();
        if (!keyword) return this.toast('Nhập từ khóa muốn nghiên cứu!', 'error');

        const btn = document.getElementById('researchBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Đang nghiên cứu...';

        const results = document.getElementById('researchResults');
        results.style.display = 'block';
        results.innerHTML = '<div class="skeleton" style="height: 100px; margin-bottom: 0.75rem;"></div>'.repeat(3);

        try {
            await KeywordResearch.research(keyword, this.currentChannel);
            KeywordResearch.renderResults('researchResults');
            this._markStepCompleted('research');

            // Show footer
            const footer = document.getElementById('researchFooter');
            if (footer) footer.style.display = 'block';

            this.toast('Nghiên cứu từ khóa hoàn tất! 🔍', 'success');
            this.autoSave();
        } catch (error) {
            results.innerHTML = `<div class="card"><span style="color:var(--error);">❌ ${error.message}</span></div>`;
            this.toast(`Lỗi: ${error.message}`, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '🔍 Nghiên Cứu';
    },

    proceedToScript() {
        // Pass keyword + secondary keywords to script panel
        const keyword = document.getElementById('researchKeyword')?.value?.trim();
        if (keyword) {
            const topic = document.getElementById('scriptTopic');
            if (topic) topic.value = keyword;
        }
        this.switchPanel('script');
    },

    // ═══════════════════════════════════════════
    // STEP 2: SCRIPT WRITER
    // ═══════════════════════════════════════════

    async generateScript() {
        const topic = document.getElementById('scriptTopic')?.value?.trim();
        if (!topic) return this.toast('Nhập chủ đề video trước!', 'error');

        const btn = document.getElementById('generateScriptBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Đang tạo kịch bản...';

        const editor = document.getElementById('scriptEditor');
        const output = document.getElementById('scriptOutput');
        editor.style.display = 'block';
        output.innerHTML = '<div class="skeleton" style="height: 200px;"></div>';

        try {
            // Get secondary keywords from research (if available)
            const secondaryKeywords = KeywordResearch?.results?.secondaryKeywords || [];

            await ScriptWriter.generate(topic, {
                style: document.getElementById('scriptStyle')?.value || 'storytelling',
                videoType: document.getElementById('videoType')?.value || 'long',
                lang: document.getElementById('scriptLang')?.value || 'vi',
                notes: document.getElementById('scriptNotes')?.value || '',
                secondaryKeywords,
                targetElement: output
            });

            this._updateScriptStats();
            this._highlightKeywords(output, topic, secondaryKeywords);
            this._markStepCompleted('script');
            this.toast('Kịch bản đã tạo xong! ✨', 'success');
            this.autoSave();

        } catch (error) {
            output.innerHTML = `<span style="color: var(--error);">❌ Lỗi: ${error.message}</span>`;
            this.toast(`Lỗi: ${error.message}`, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '✨ Tạo Kịch Bản';
    },

    _updateScriptStats() {
        const text = ScriptWriter.currentScript;
        const wordCount = ScriptWriter.getWordCount(text);
        const readTime = ScriptWriter.getReadTime(text);
        document.getElementById('wordCount').textContent = `${wordCount} từ`;
        document.getElementById('readTime').textContent = `~${readTime} phút`;
    },

    copyScript() {
        const text = ScriptWriter.currentScript
            || document.getElementById('scriptOutput')?.innerText || '';
        navigator.clipboard.writeText(text).then(() => this.toast('Đã copy kịch bản!', 'success'));
    },

    copyScriptForTTS() {
        const text = ScriptWriter.extractForTTS();
        if (!text) return this.toast('Chưa có kịch bản để copy!', 'error');
        navigator.clipboard.writeText(text).then(() => this.toast('Đã copy lời thoại sạch cho AI Studio! 🎙️', 'success'));
    },

    proceedToScenes() {
        this.switchPanel('scenes');
    },

    // ═══════════════════════════════════════════
    // STEP 3: SCENE MANAGER
    // ═══════════════════════════════════════════

    switchBreakdownMode(mode) {
        this.breakdownMode = mode;
        const autoBtn = document.querySelector('.tab-btn[onclick*="auto"]');
        const manualBtn = document.querySelector('.tab-btn[onclick*="manual"]');
        const manualArea = document.getElementById('manualBreakdownArea');
        const styleGrid = document.getElementById('styleGrid');

        if (autoBtn) autoBtn.classList.toggle('active', mode === 'auto');
        if (manualBtn) manualBtn.classList.toggle('active', mode === 'manual');
        if (manualArea) manualArea.style.display = mode === 'manual' ? 'block' : 'none';

        const btn = document.getElementById('breakdownBtn');
        if (btn) {
            btn.innerHTML = mode === 'manual'
                ? '✨ Tạo Prompt Từ Mô Tả Thủ Công'
                : '🎬 Chia Phân Cảnh & Tạo Prompt Tự Động';
        }
    },

    async breakdownScenes() {
        if (!SceneManager.selectedStyle) {
            return this.toast('Chọn style hình ảnh trước!', 'error');
        }

        const btn = document.getElementById('breakdownBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Đang xử lý...';

        const sceneList = document.getElementById('sceneList');
        sceneList.innerHTML = '<div class="skeleton" style="height: 100px; margin-bottom: 0.75rem;"></div>'.repeat(3);

        try {
            const shotsPerScene = parseInt(document.getElementById('shotsPerScene')?.value || '2');

            if (this.breakdownMode === 'manual') {
                const manualText = document.getElementById('manualScenesInput')?.value?.trim();
                if (!manualText) throw new Error('Vui lòng nhập mô tả phân cảnh!');
                await SceneManager.generateFromManualScenes(manualText, shotsPerScene);
            } else {
                const scriptText = ScriptWriter.currentScript
                    || document.getElementById('scriptOutput')?.innerText || '';
                if (!scriptText || scriptText.length < 50) {
                    throw new Error('Chưa có kịch bản. Hãy quay lại Bước 1 để tạo kịch bản.');
                }
                const videoType = document.getElementById('videoType')?.value || 'long';
                await SceneManager.breakdownScript(scriptText, shotsPerScene, videoType);
            }

            SceneManager.renderScenes();
            this._markStepCompleted('scenes');
            const totalShots = SceneManager.scenes.reduce((sum, s) => sum + (s.imagePrompts?.length || 1), 0);
            this.toast(`Đã xử lý ${SceneManager.scenes.length} phân cảnh = ${totalShots} hình! 🎬`, 'success');
            this.autoSave();

        } catch (error) {
            sceneList.innerHTML = `<div class="card"><span style="color:var(--error);">❌ ${error.message}</span></div>`;
            this.toast(`Lỗi: ${error.message}`, 'error');
        }

        btn.disabled = false;
        this.switchBreakdownMode(this.breakdownMode); // Restore button text
    },

    async regeneratePrompts() {
        if (SceneManager.scenes.length === 0) {
            return this.toast('Chưa có phân cảnh nào!', 'error');
        }

        this.toast('Đang tạo lại tất cả prompt...', 'info');
        for (let i = 0; i < SceneManager.scenes.length; i++) {
            await SceneManager.regenerateSinglePrompt(i);
        }
        SceneManager.renderScenes();
        this.toast('Đã tạo lại tất cả prompt! ✨', 'success');
        this.autoSave();
    },

    async regenerateScene(index) {
        try {
            this.toast(`Đang tạo lại prompt phân cảnh ${index + 1}...`, 'info');
            await SceneManager.regenerateSinglePrompt(index);
            SceneManager.renderScenes();
            this.toast('Đã tạo lại prompt! ✨', 'success');
            this.autoSave();
        } catch (error) {
            this.toast(`Lỗi: ${error.message}`, 'error');
        }
    },

    copyScenePrompt(index) {
        const text = SceneManager.getScenePrompts(index);
        navigator.clipboard.writeText(text).then(() => this.toast(`Đã copy tất cả shots phân cảnh ${index + 1}!`, 'success'));
    },

    copyShotPrompt(sceneIndex, shotIndex) {
        const scene = SceneManager.scenes[sceneIndex];
        const prompt = scene?.imagePrompts?.[shotIndex] || scene?.imagePrompt || '';
        navigator.clipboard.writeText(prompt).then(() => this.toast(`Đã copy Shot ${shotIndex + 1} / PC ${sceneIndex + 1}!`, 'success'));
    },

    copyAllPrompts() {
        const text = SceneManager.getAllPrompts();
        navigator.clipboard.writeText(text).then(() => this.toast('Đã copy tất cả prompt!', 'success'));
    },

    proceedToSEO() {
        this.switchPanel('seo');
    },

    // ═══════════════════════════════════════════
    // STEP 4: SEO OPTIMIZER
    // ═══════════════════════════════════════════

    async generateSEO() {
        const keyword = document.getElementById('seoKeyword')?.value?.trim();
        if (!keyword) return this.toast('Nhập keyword chính!', 'error');

        const seoResults = document.getElementById('seoResults');
        seoResults.style.display = 'block';
        seoResults.innerHTML = '<div class="skeleton" style="height: 80px; margin-bottom: 0.75rem;"></div>'.repeat(4);

        try {
            await SEOOptimizer.generateAll(keyword, ScriptWriter.currentScript);
            SEOOptimizer.renderResults('seoResults');
            this._markStepCompleted('seo');
            this.toast('SEO metadata đã tạo xong! 🔍', 'success');
            this.autoSave();
        } catch (error) {
            seoResults.innerHTML = `<div class="card"><span style="color:var(--error);">❌ ${error.message}</span></div>`;
            this.toast(`Lỗi: ${error.message}`, 'error');
        }
    },

    async generateTitlesOnly() {
        const keyword = document.getElementById('seoKeyword')?.value?.trim();
        if (!keyword) return this.toast('Nhập keyword chính!', 'error');

        try {
            this.toast('Đang tạo tiêu đề...', 'info');
            const titles = await SEOOptimizer.generateTitlesOnly(keyword);
            const container = document.getElementById('seoResults');
            container.style.display = 'block';
            container.innerHTML = `
                <div class="seo-result">
                    <div class="seo-result-header">
                        <span class="seo-result-label">📝 Tiêu Đề (10 options)</span>
                        <button class="copy-btn" onclick="app.copySEO('seo-titles-only')">📋 Copy</button>
                    </div>
                    <div class="seo-result-content" id="seo-titles-only">${titles.replace(/\n/g, '<br>')}</div>
                </div>
            `;
            this.toast('Đã tạo 10 tiêu đề! ✨', 'success');
        } catch (error) {
            this.toast(`Lỗi: ${error.message}`, 'error');
        }
    },

    copySEO(elementId) {
        const el = document.getElementById(elementId);
        if (!el) return;
        navigator.clipboard.writeText(el.innerText).then(() => this.toast('Đã copy!', 'success'));
    },

    copySEOAll() {
        if (!SEOOptimizer.results) return;
        const r = SEOOptimizer.results;
        const text = `FILE NAME: ${r.filename}\n\nTITLES:\n${r.titles}\n\nDESCRIPTION:\n${r.description}\n\nTAGS:\n${r.tags}\n\nHASHTAGS:\n${r.hashtags}`;
        navigator.clipboard.writeText(text).then(() => this.toast('Đã copy tất cả SEO metadata!', 'success'));
    },

    proceedToThumbnail() {
        const videoType = document.getElementById('videoType')?.value || 'long';
        if (videoType === 'short') {
            this.toast('YouTube Shorts không cần thumbnail riêng! Chuyển thẳng sang xóa watermark.', 'info');
            this.switchPanel('watermark');
        } else {
            this.switchPanel('thumbnail');
        }
    },

    // ═══════════════════════════════════════════
    // STEP 5: THUMBNAIL GENERATOR
    // ═══════════════════════════════════════════

    async generateThumbnails() {
        const topic = document.getElementById('scriptTopic')?.value?.trim()
            || document.getElementById('researchKeyword')?.value?.trim() || '';
        if (!topic) return this.toast('Chưa có chủ đề. Quay lại bước Kịch Bản.', 'error');

        const btn = document.getElementById('thumbnailBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="loading-spinner"></span> Đang tạo thumbnail...';

        const results = document.getElementById('thumbnailResults');
        results.style.display = 'block';
        results.innerHTML = '<div class="skeleton" style="height: 120px; margin-bottom: 0.75rem;"></div>'.repeat(3);

        try {
            await ThumbnailGenerator.generatePrompts(topic, ScriptWriter.currentScript);
            ThumbnailGenerator.renderResults('thumbnailResults');
            this._markStepCompleted('thumbnail');
            this.toast('Đã tạo 3 phương án thumbnail! 🖼️', 'success');
            this.autoSave();
        } catch (error) {
            results.innerHTML = `<div class="card"><span style="color:var(--error);">❌ ${error.message}</span></div>`;
            this.toast(`Lỗi: ${error.message}`, 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '🖼️ Tạo 3 Phương Án Thumbnail';
    },

    copyAllThumbnailPrompts() {
        if (!ThumbnailGenerator.results) return;
        const text = ThumbnailGenerator.results.map((t, i) =>
            `--- Phương án ${i + 1}: ${t.concept} ---\nText: ${t.text}\nPrompt: ${t.imagePrompt}`
        ).join('\n\n');
        navigator.clipboard.writeText(text).then(() => this.toast('Đã copy tất cả thumbnail prompt!', 'success'));
    },

    proceedToWatermark() {
        this.switchPanel('watermark');
    },

    // ═══════════════════════════════════════════
    // STEP 6: WATERMARK REMOVER
    // ═══════════════════════════════════════════

    async handleWatermarkFiles(files) {
        if (!files || files.length === 0) return;

        this.toast(`Đang xử lý ${files.length} hình...`, 'info');
        const uploadZone = document.getElementById('uploadZone');
        uploadZone.innerHTML = '<div class="loading-spinner"></div><div style="margin-top:0.5rem;">Đang xử lý...</div>';

        try {
            await WatermarkRemover.processFiles(files);
            this._markStepCompleted('watermark');
            this.toast(`Đã xử lý ${files.length} hình thành công! 🧹`, 'success');
            this.autoSave();
        } catch (error) {
            this.toast(`Lỗi: ${error.message}`, 'error');
        }

        // Reset upload zone
        uploadZone.innerHTML = `
            <div class="upload-icon">📂</div>
            <div class="upload-text">Kéo thả hình ảnh hoặc click để chọn file</div>
            <div class="upload-hint">Hỗ trợ: PNG, JPG, WebP — Tối đa 20 hình</div>
        `;
    },

    downloadImage(index) {
        WatermarkRemover.downloadSingle(index);
    },

    downloadAllProcessed() {
        WatermarkRemover.downloadAll();
    },

    _setupDragDrop() {
        const zone = document.getElementById('uploadZone');
        if (!zone) return;

        zone.addEventListener('dragover', (e) => {
            e.preventDefault();
            zone.style.borderColor = 'var(--accent)';
            zone.style.background = 'var(--accent-dim)';
        });

        zone.addEventListener('dragleave', () => {
            zone.style.borderColor = '';
            zone.style.background = '';
        });

        zone.addEventListener('drop', (e) => {
            e.preventDefault();
            zone.style.borderColor = '';
            zone.style.background = '';
            this.handleWatermarkFiles(e.dataTransfer.files);
        });
    },

    // ═══════════════════════════════════════════
    // PROJECT MANAGEMENT
    // ═══════════════════════════════════════════

    newProject() {
        const name = prompt('Tên dự án:', 'Video mới');
        if (!name) return;
        this._resetAllState();
        const project = ProjectManager.createProject(name, this.currentChannel);
        document.getElementById('projectName').textContent = name;
        this.switchPanel('research');
        this.toast('Đã tạo dự án mới!', 'success');
        ProjectManager.renderProjectList('projectList');
    },

    _resetAllState() {
        // Clear session cache
        sessionStorage.removeItem('ytdash_session');

        // Clear all form fields
        const fields = ['researchKeyword', 'scriptTopic', 'scriptNotes', 'seoKeyword'];
        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });

        // Hide all result panels
        const panels = ['researchResults', 'researchFooter', 'scriptEditor', 'seoResults', 'seoFooter', 'thumbnailResults', 'thumbnailFooter'];
        panels.forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

        // Clear scene list and watermark results
        const sceneList = document.getElementById('sceneList');
        if (sceneList) sceneList.innerHTML = '';
        const wmResults = document.getElementById('processedResults');
        if (wmResults) wmResults.innerHTML = '';

        // Reset script output
        const scriptOutput = document.getElementById('scriptOutput');
        if (scriptOutput) scriptOutput.innerHTML = '';

        // Reset word count & read time
        const wc = document.getElementById('wordCount');
        if (wc) wc.textContent = '0 từ';
        const rt = document.getElementById('readTime');
        if (rt) rt.textContent = '~0 phút';

        // Reset all module states
        ScriptWriter.currentScript = '';
        SceneManager.scenes = [];
        SceneManager.selectedStyle = null;
        SceneManager.renderStyleGrid();
        SEOOptimizer.results = null;
        if (typeof ThumbnailGenerator !== 'undefined') ThumbnailGenerator.results = null;
        if (typeof KeywordResearch !== 'undefined') KeywordResearch.results = null;

        // Reset nav step indicators
        document.querySelectorAll('.nav-item.completed').forEach(el => el.classList.remove('completed'));
        document.getElementById('pipelineStatus').textContent = 'Bước 1 / 6 — Nghiên cứu từ khóa';
    },

    // ═══════════════════════════════════════════
    // SESSION CACHE — Survives F5, cleared on New Project
    // ═══════════════════════════════════════════

    _saveSession() {
        try {
            const session = {
                channel: this.currentChannel,
                panel: this.currentPanel,
                keyword: document.getElementById('researchKeyword')?.value || '',
                topic: document.getElementById('scriptTopic')?.value || '',
                scriptNotes: document.getElementById('scriptNotes')?.value || '',
                scriptStyle: document.getElementById('scriptStyle')?.value || '',
                videoType: document.getElementById('videoType')?.value || '',
                seoKeyword: document.getElementById('seoKeyword')?.value || '',
                // Module data
                researchResults: KeywordResearch?.results || null,
                script: ScriptWriter.currentScript || '',
                scenes: SceneManager.scenes || [],
                sceneStyle: SceneManager.selectedStyle || null,
                seoResults: SEOOptimizer?.results || null,
                thumbnailResults: ThumbnailGenerator?.results || null,
                // Pipeline status
                pipelineStatus: document.getElementById('pipelineStatus')?.textContent || '',
                completedSteps: [...document.querySelectorAll('.nav-item.completed')].map(el => el.dataset.panel),
                projectName: document.getElementById('projectName')?.textContent || 'Video mới',
                timestamp: Date.now()
            };
            sessionStorage.setItem('ytdash_session', JSON.stringify(session));
            console.log('💾 Session saved');
        } catch (e) {
            console.warn('Session save failed:', e.message);
        }
    },

    _restoreSession() {
        try {
            const raw = sessionStorage.getItem('ytdash_session');
            if (!raw) return false;

            const s = JSON.parse(raw);
            // Only restore if session is less than 2 hours old
            if (Date.now() - s.timestamp > 2 * 60 * 60 * 1000) {
                sessionStorage.removeItem('ytdash_session');
                return false;
            }

            console.log('🔄 Restoring session from', new Date(s.timestamp).toLocaleTimeString());

            // Restore channel
            this.currentChannel = s.channel || 'finance';
            document.body.setAttribute('data-channel', this.currentChannel);
            this._updateChannelUI();

            // Restore project name
            document.getElementById('projectName').textContent = s.projectName || 'Video mới';

            // Restore form fields
            const setVal = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
            setVal('researchKeyword', s.keyword);
            setVal('scriptTopic', s.topic);
            setVal('scriptNotes', s.scriptNotes);
            setVal('scriptStyle', s.scriptStyle);
            setVal('videoType', s.videoType);
            setVal('seoKeyword', s.seoKeyword);

            // Restore keyword research
            if (s.researchResults && KeywordResearch) {
                KeywordResearch.results = s.researchResults;
                KeywordResearch.renderResults?.('researchResults');
                const resPanel = document.getElementById('researchResults');
                if (resPanel) resPanel.style.display = 'block';
                const resFooter = document.getElementById('researchFooter');
                if (resFooter) resFooter.style.display = 'flex';
            }

            // Restore script
            if (s.script) {
                ScriptWriter.currentScript = s.script;
                const output = document.getElementById('scriptOutput');
                const editor = document.getElementById('scriptEditor');
                if (output) {
                    output.innerHTML = GeminiAPI.formatMarkdown?.(s.script) || s.script.replace(/\n/g, '<br>');
                }
                if (editor) editor.style.display = 'block';
                this._updateScriptStats();
                // Re-apply highlighting
                if (output && s.keyword) {
                    const secondaryKws = s.researchResults?.secondaryKeywords || [];
                    this._highlightKeywords(output, s.topic || s.keyword, secondaryKws);
                }
            }

            // Restore scenes
            if (s.scenes?.length > 0) {
                SceneManager.scenes = s.scenes;
                SceneManager.selectedStyle = s.sceneStyle;
                SceneManager.renderStyleGrid();
                SceneManager.renderScenes();
            }

            // Restore SEO
            if (s.seoResults && SEOOptimizer) {
                SEOOptimizer.results = s.seoResults;
                SEOOptimizer.renderResults?.('seoResults');
                const seoPanel = document.getElementById('seoResults');
                if (seoPanel) seoPanel.style.display = 'block';
                const seoFooter = document.getElementById('seoFooter');
                if (seoFooter) seoFooter.style.display = 'flex';
            }

            // Restore thumbnail results
            if (s.thumbnailResults && ThumbnailGenerator) {
                ThumbnailGenerator.results = s.thumbnailResults;
                ThumbnailGenerator.renderResults?.('thumbnailResults');
                const thPanel = document.getElementById('thumbnailResults');
                if (thPanel) thPanel.style.display = 'block';
                const thFooter = document.getElementById('thumbnailFooter');
                if (thFooter) thFooter.style.display = 'flex';
            }

            // Restore completed steps
            if (s.completedSteps) {
                s.completedSteps.forEach(panel => {
                    const navItem = document.querySelector(`.nav-item[data-panel="${panel}"]`);
                    if (navItem) navItem.classList.add('completed');
                });
            }

            // Restore pipeline status
            if (s.pipelineStatus) {
                document.getElementById('pipelineStatus').textContent = s.pipelineStatus;
            }

            // Navigate to last panel
            if (s.panel) this.switchPanel(s.panel);

            console.log('✅ Session restored successfully');
            return true;
        } catch (e) {
            console.warn('Session restore failed:', e.message);
            sessionStorage.removeItem('ytdash_session');
            return false;
        }
    },

    saveProject() {
        ProjectManager.saveCurrentState(this);
        this.toast('Đã lưu dự án!', 'success');
    },

    autoSave() {
        ProjectManager.saveCurrentState(this);
        this._saveSession();
    },

    loadProject(projectId) {
        ProjectManager.loadProject(projectId);
        this.currentChannel = document.body.getAttribute('data-channel') || 'finance';
        this._updateChannelUI();
        this.switchPanel('script');
        this.toast('Đã mở dự án!', 'success');
    },

    deleteProject(projectId) {
        if (!confirm('Xóa dự án này?')) return;
        ProjectManager.deleteProject(projectId);
        ProjectManager.renderProjectList('projectList');
        this.toast('Đã xóa dự án.', 'info');
    },

    importProject() {
        document.getElementById('importInput').click();
    },

    handleImportFile(file) {
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                ProjectManager.importProject(e.target.result);
                ProjectManager.renderProjectList('projectList');
                this.toast('Import thành công!', 'success');
            } catch (err) {
                this.toast(`Lỗi import: ${err.message}`, 'error');
            }
        };
        reader.readAsText(file);
    },

    // ═══════════════════════════════════════════
    // SETTINGS
    // ═══════════════════════════════════════════

    showSettings() {
        this.switchPanel('settings');
    },

    saveGeminiKey() {
        const key = document.getElementById('settingsGeminiKey')?.value?.trim();
        if (!key) return this.toast('Nhập API key!', 'error');
        GeminiAPI.setApiKey(key);
        this.toast('Đã lưu Gemini API Key!', 'success');
    },

    saveYoutubeKey() {
        const key = document.getElementById('settingsYoutubeKey')?.value?.trim();
        if (!key) return this.toast('Nhập API key!', 'error');
        localStorage.setItem('ytcd_youtube_api_key', key);
        this.toast('Đã lưu YouTube API Key!', 'success');
    },

    toggleKeyVisibility(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return;
        input.type = input.type === 'password' ? 'text' : 'password';
    },

    // ═══════════════════════════════════════════
    // UI HELPERS
    // ═══════════════════════════════════════════

    _markStepCompleted(panelId) {
        const navItem = document.querySelector(`.nav-item[data-panel="${panelId}"]`);
        if (navItem) navItem.classList.add('completed');

        // Update pipeline status
        const steps = ['research', 'script', 'scenes', 'seo', 'thumbnail', 'watermark'];
        const labels = ['Nghiên cứu', 'Kịch bản', 'Phân cảnh', 'SEO', 'Thumbnail', 'Xóa watermark'];
        const current = steps.indexOf(panelId);
        const statusText = current < steps.length - 1
            ? `Bước ${current + 2} / 6 — ${labels[current + 1]}`
            : '✅ Hoàn thành pipeline!';
        document.getElementById('pipelineStatus').textContent = statusText;
    },

    /**
     * Highlight keywords in script output
     * Main keyword: cyan background (highlighted FIRST)
     * Secondary keywords: orange background (skip already-highlighted text)
     */
    _highlightKeywords(container, mainKeyword, secondaryKeywords = []) {
        if (!container) return;
        console.log('🎨 Highlighting keywords:', { mainKeyword, secondaryKeywords });

        const escRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

        // Helper: wrap matches in text nodes only (skip existing <mark> elements)
        const highlightInTextNodes = (root, pattern, className) => {
            const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
            const textNodes = [];
            while (walker.nextNode()) {
                if (walker.currentNode.parentElement?.tagName === 'MARK') continue;
                textNodes.push(walker.currentNode);
            }

            let matchCount = 0;
            textNodes.forEach(node => {
                const text = node.textContent;
                // Create a fresh regex for each node to avoid lastIndex issues
                const regex = new RegExp(pattern, 'gi');
                const fragment = document.createDocumentFragment();
                let lastIndex = 0;
                let match;
                let hasMatch = false;

                while ((match = regex.exec(text)) !== null) {
                    hasMatch = true;
                    matchCount++;
                    if (match.index > lastIndex) {
                        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
                    }
                    const mark = document.createElement('mark');
                    mark.className = className;
                    mark.textContent = match[0];
                    fragment.appendChild(mark);
                    lastIndex = regex.lastIndex;
                }

                if (!hasMatch) return; // No matches in this node

                if (lastIndex < text.length) {
                    fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
                }

                node.parentNode.replaceChild(fragment, node);
            });
            console.log(`  ✅ ${className}: ${matchCount} matches`);
        };

        // 1. Highlight MAIN keyword FIRST (cyan) — takes priority
        if (mainKeyword && mainKeyword.length >= 2) {
            highlightInTextNodes(container, escRegex(mainKeyword), 'kw-primary');
        }

        // 2. Highlight secondary keywords (orange) — skip already-marked text
        secondaryKeywords.forEach(kw => {
            if (!kw || kw.length < 2) return;
            if (mainKeyword && mainKeyword.toLowerCase().includes(kw.toLowerCase())) return;
            highlightInTextNodes(container, escRegex(kw), 'kw-secondary');
        });
    },

    toast(message, type = 'info') {
        const container = document.getElementById('toastContainer');
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }
};

// ═══ BOOT ═══
document.addEventListener('DOMContentLoaded', () => app.init());
