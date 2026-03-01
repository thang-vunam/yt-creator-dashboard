/**
 * YouTube Creator Dashboard — Scene Manager
 * Handles scene breakdown and multi-style image prompt generation
 */
window.SceneManager = {

    // ═══════════════════════════════════════════
    // STYLE DEFINITIONS — 9 Presets + Custom
    // ═══════════════════════════════════════════
    STYLES: {
        'stick-crumpled': {
            name: 'Stick Figure (Giấy Nhàu)',
            icon: '✏️',
            desc: 'Mực đen trên giấy nhàu',
            promptPrefix: 'Simple stick figure characters drawn in black ink on crumpled yellowish paper texture background. Minimalist hand-drawn illustration style, clean lines, educational feel.',
            promptSuffix: 'Hand-drawn on crumpled paper, stick figure art style, no realistic humans.'
        },
        'neon-stick': {
            name: 'Neon Stick Figure',
            icon: '💡',
            desc: 'Phát sáng neon trên nền tối',
            promptPrefix: 'Glowing neon stick figure characters on dark background. Vibrant cyan, purple and pink neon glow effects. Cyberpunk aesthetic with subtle grid lines.',
            promptSuffix: 'Neon glow effect, dark background, stick figure style, luminous outlines.'
        },
        'paper-cutout': {
            name: 'Cắt Giấy Thủ Công',
            icon: '✂️',
            desc: 'Nghệ thuật cắt giấy lớp',
            promptPrefix: 'Paper cutout art style with layered paper craft aesthetic. Multiple layers of colored paper creating depth and dimension. Handmade craft feel with subtle shadows between layers.',
            promptSuffix: 'Paper craft, paper cutout, layered paper art, handmade craft style, soft shadows.'
        },
        'anime': {
            name: 'Anime',
            icon: '🎌',
            desc: 'Hoạt hình Nhật Bản',
            promptPrefix: 'Japanese anime art style, vibrant colors, expressive characters with large eyes. Clean cel-shaded illustration with dynamic composition.',
            promptSuffix: 'Anime style, cel shading, vibrant, Japanese animation aesthetic.'
        },
        '3d-render': {
            name: '3D Render',
            icon: '🧊',
            desc: 'Nhân vật 3D kiểu Pixar',
            promptPrefix: '3D rendered characters in Pixar-like style. Smooth surfaces, soft lighting, colorful and friendly character design. High quality 3D animation look.',
            promptSuffix: '3D render, Pixar style, soft lighting, smooth surfaces, family-friendly.'
        },
        'cinematic': {
            name: 'Cinematic',
            icon: '🎬',
            desc: 'Phong cách điện ảnh',
            promptPrefix: 'Cinematic photorealistic style with dramatic lighting, depth of field, and film-like color grading. High production value, movie scene aesthetic.',
            promptSuffix: 'Cinematic, dramatic lighting, film grain, shallow depth of field, movie quality.'
        },
        'watercolor': {
            name: 'Watercolor',
            icon: '🎨',
            desc: 'Tranh màu nước mềm mại',
            promptPrefix: 'Beautiful watercolor painting style with soft gradients, flowing colors, and delicate brushstrokes. Artistic and dreamy atmosphere with paper texture showing through.',
            promptSuffix: 'Watercolor painting, soft colors, flowing gradients, paper texture, artistic.'
        },
        'comic': {
            name: 'Comic / Manga',
            icon: '💬',
            desc: 'Truyện tranh, đường nét đậm',
            promptPrefix: 'Bold comic book style with thick outlines, dynamic action lines, halftone dots, and vivid colors. Pop art inspired with speech bubbles and dramatic expressions.',
            promptSuffix: 'Comic book style, bold outlines, halftone, pop art, dynamic composition.'
        },
        'pixel-art': {
            name: 'Pixel Art',
            icon: '👾',
            desc: 'Phong cách game retro',
            promptPrefix: 'Retro pixel art style inspired by classic 16-bit video games. Chunky pixels, limited color palette, nostalgic gaming aesthetic.',
            promptSuffix: 'Pixel art, 16-bit, retro gaming, limited palette, crisp pixels.'
        },
        'custom': {
            name: 'Custom',
            icon: '🎯',
            desc: 'Nhập mô tả style riêng',
            promptPrefix: '',
            promptSuffix: ''
        }
    },

    selectedStyle: null,
    scenes: [],

    // ═══════════════════════════════════════════
    // STYLE SELECTION
    // ═══════════════════════════════════════════

    renderStyleGrid() {
        const grid = document.getElementById('styleGrid');
        if (!grid) return;

        grid.innerHTML = Object.entries(this.STYLES).map(([key, style]) => `
            <div class="style-card ${this.selectedStyle === key ? 'selected' : ''}"
                 data-style="${key}" onclick="SceneManager.selectStyle('${key}')">
                <span class="style-icon">${style.icon}</span>
                <div class="style-name">${style.name}</div>
                <div class="style-desc">${style.desc}</div>
            </div>
        `).join('');
    },

    selectStyle(styleKey) {
        this.selectedStyle = styleKey;
        this.renderStyleGrid();

        // Toggle custom input
        const customInput = document.getElementById('customStyleInput');
        if (customInput) {
            customInput.classList.toggle('visible', styleKey === 'custom');
        }

        // Update badge
        const badge = document.getElementById('selectedStyleBadge');
        if (badge && this.STYLES[styleKey]) {
            badge.textContent = `${this.STYLES[styleKey].icon} ${this.STYLES[styleKey].name}`;
        }
    },

    getStylePrompt() {
        if (!this.selectedStyle) return { prefix: '', suffix: '' };

        if (this.selectedStyle === 'custom') {
            const customDesc = document.getElementById('customStyleDesc')?.value?.trim() || '';
            return {
                prefix: customDesc,
                suffix: customDesc ? `Style: ${customDesc}` : ''
            };
        }

        const style = this.STYLES[this.selectedStyle];
        return {
            prefix: style.promptPrefix,
            suffix: style.promptSuffix
        };
    },

    // ═══════════════════════════════════════════
    // SCENE BREAKDOWN
    // ═══════════════════════════════════════════

    async breakdownScript(scriptText, maxShotsPerScene = 3, videoType = 'long') {
        if (!scriptText || scriptText.trim().length < 50) {
            throw new Error('Kịch bản quá ngắn để chia phân cảnh.');
        }

        // Store videoType for regeneration
        this._videoType = videoType;

        // Clean script text - remove HTML tags if any
        const cleanScript = scriptText.replace(/<[^>]*>/g, '').trim();
        const isShort = videoType === 'short';
        console.log('🎬 Scene breakdown —', isShort ? 'SHORTS' : 'LONG', '— Script length:', cleanScript.length, 'chars, max', maxShotsPerScene, 'shots/scene');

        const stylePrompt = this.getStylePrompt();

        // Estimate scene count based on script length and video type
        const wordCount = cleanScript.split(/\s+/).length;
        let minScenes, maxScenes;
        if (isShort) {
            minScenes = 4;
            maxScenes = 5;
        } else {
            const estimatedMinutes = Math.ceil(wordCount / 150);
            minScenes = Math.max(8, estimatedMinutes * 2);
            maxScenes = Math.min(30, estimatedMinutes * 4);
        }

        // Aspect ratio instruction for Shorts vs Long
        const aspectRatio = isShort
            ? '9:16 vertical portrait orientation (1080x1920). CRITICAL: ALL images must be VERTICAL 9:16 ratio for YouTube Shorts.'
            : '16:9 landscape orientation (1920x1080).';

        const systemInstruction = `You are a YouTube video scene breakdown expert AND a master image prompt engineer. Output ONLY a valid JSON array.

TASK: Break the Vietnamese YouTube script into ${minScenes}-${maxScenes} scenes.

VIDEO FORMAT: ${isShort ? 'YouTube SHORTS (vertical 9:16, < 60 seconds)' : 'Long-form YouTube video (horizontal 16:9, 5-15 minutes)'}
ASPECT RATIO: ${aspectRatio}
IMAGE STYLE: ${stylePrompt.prefix}

DYNAMIC SHOTS PER SCENE (CRITICAL):
Each scene should have a VARIABLE number of image prompts (shots) based on the voiceover LENGTH of that scene:
- Very short voiceover (< 50 words, ~20 seconds): 1 shot only
- Medium voiceover (50-150 words, 20-60 seconds): 2 shots  
- Long voiceover (150-250 words, 60-120 seconds): 3 shots
- Very long voiceover (250+ words, 2+ minutes): ${maxShotsPerScene} shots (max ${maxShotsPerScene})
Each shot must show a DIFFERENT visual angle, moment, or perspective within the same scene.
The number of shots should feel PROPORTIONAL to the content — do NOT give 3 shots to a 1-sentence scene.

═══ IMAGE PROMPT ENGINEERING GUIDE ═══
Each image prompt MUST include ALL of these elements (40+ words each):

1. SUBJECT & ACTION: What is happening? Who/what is in the scene? Be specific.
2. CAMERA ANGLE: Choose one per shot (vary between shots in same scene):
   - Close-up / Extreme close-up (for emotion, detail)
   - Medium shot (waist-up, for dialogue/interaction)
   - Wide shot / Establishing shot (for context, environment)
   - Bird's eye view / Top-down (for overview, maps, data)
   - Low angle (for power, authority)
   - Over-the-shoulder (for perspective, POV)
   - Dutch angle / Tilted (for tension, unease)
3. LIGHTING: Choose appropriate mood lighting:
   - Soft diffused light (calm, informative)
   - Dramatic side lighting / Rim light (tension, reveal)
   - Golden hour warm light (hope, nostalgia)
   - Cool blue/teal tones (technology, sadness)
   - High contrast chiaroscuro (mystery, drama)
   - Neon glow (modern, cyberpunk)
   - Backlit silhouette (spiritual, dramatic)
4. MOOD/ATMOSPHERE: emotional tone (tense, hopeful, mysterious, energetic, contemplative)
5. COMPOSITION: rule of thirds, centered, symmetrical, leading lines, negative space
6. COLOR PALETTE: dominant colors that match the emotional tone

PROMPT STRUCTURE TEMPLATE:
"[Style prefix]. [Subject doing action], [camera angle], [lighting description], [mood/atmosphere], [composition detail], [color palette]. ${aspectRatio}"

EXAMPLE (good prompt):
"Simple stick figure on crumpled paper. A worried stick figure staring at a falling stock chart on a large screen, medium shot from slightly below, dramatic side lighting casting long shadows, tense and anxious atmosphere, rule of thirds composition with figure on left and chart on right, warm amber and deep red tones. 16:9 landscape orientation."

❌ BAD (too vague): "A person looking at stocks. 16:9."
✅ GOOD (detailed): Include camera, lighting, mood, composition, colors.
═══════════════════════════════════════

RULES:
- MINIMUM ${minScenes} scenes, MAXIMUM ${maxScenes} scenes
- Image prompts MUST be in ENGLISH, detailed (40+ words each)
- EVERY image prompt MUST end with "${aspectRatio}"
- Titles, descriptions in VIETNAMESE
- voiceover = ACTUAL text from the script for that section (copy exact words)
- Do NOT include any text outside the JSON array
- VARY camera angles between shots in the same scene (never repeat same angle)

OUTPUT FORMAT:
[{"id":1,"title":"Tiêu đề","description":"Mô tả ngắn","voiceover":"Lời thoại trích từ kịch bản","imagePrompts":["Detailed shot 1...", "Detailed shot 2..."]}]

CRITICAL: "imagePrompts" is an ARRAY of 1-${maxShotsPerScene} strings (variable per scene). Your response must start with [ and end with ]`;

        const result = await GeminiAPI.generateContent(
            `Chia phân cảnh cho kịch bản YouTube sau:\n\n${cleanScript}`,
            systemInstruction,
            { temperature: 0.4, maxOutputTokens: 32768 }
        );

        // Parse JSON from response
        let scenes = this._parseJSON(result);

        // Normalize: ensure each scene has imagePrompts array
        scenes = scenes.map(scene => {
            if (!scene.imagePrompts && scene.imagePrompt) {
                // Backward compat: single imagePrompt → array
                scene.imagePrompts = [scene.imagePrompt];
            }
            if (!Array.isArray(scene.imagePrompts)) {
                scene.imagePrompts = [scene.imagePrompt || 'No prompt generated'];
            }
            // Keep imagePrompt for legacy compatibility (first shot)
            scene.imagePrompt = scene.imagePrompts[0];
            return scene;
        });

        this.scenes = scenes;

        // Validate
        if (this.scenes.length < 3) {
            throw new Error(`Gemini chỉ tạo ${this.scenes.length} phân cảnh (cần ${minScenes}+). Hãy bấm thử lại.`);
        }

        const totalShots = this.scenes.reduce((sum, s) => sum + (s.imagePrompts?.length || 1), 0);
        console.log('✅ Scenes:', this.scenes.length, '| Total shots:', totalShots);
        return this.scenes;
    },

    async generateFromManualScenes(manualText, shotsPerScene = 2) {
        if (!this.selectedStyle) throw new Error('Vui lòng chọn style hình ảnh trước.');

        const lines = manualText.split('\n').map(l => l.trim()).filter(l => l.length > 5);
        if (lines.length === 0) throw new Error('Vui lòng nhập ít nhất một dòng mô tả phân cảnh.');

        const style = this.getStylePrompt();
        const systemInstruction = this._getManualPromptSystemInstruction(style, shotsPerScene);

        const prompt = `Dưới đây là các phân cảnh tôi muốn tạo prompt:
${lines.map((line, i) => `Phân cảnh ${i + 1}: ${line}`).join('\n')}

Hãy tạo prompt chi tiết cho từng phân cảnh này.`;

        const result = await GeminiAPI.generateContent(prompt, systemInstruction, { temperature: 0.7 });
        const parsed = this._parseJSON(result);

        this.scenes = parsed.map(s => ({
            ...s,
            id: s.id || Math.random().toString(36).substr(2, 9)
        }));

        return this.scenes;
    },

    _getManualPromptSystemInstruction(style, shotsPerScene) {
        return `Bạn là MASTER IMAGE PROMPT ENGINEER chuyên viết prompt cho AI tạo hình ảnh (Banana Pro, Grok, Imagen).
Cụ thể bạn tạo prompt cho video YouTube.

STYLE CỦA KÊNH:
- Prefix: ${style.prefix}
- Suffix: ${style.suffix}

NHIỆM VỤ:
- Tôi sẽ cung cấp danh sách tóm tắt các phân cảnh.
- Bạn hãy "phóng tác" từng tóm tắt đó thành 1-${shotsPerScene} prompt hình ảnh (shots) chi tiết bằng TIẾNG ANH.
- Số shots tùy thuộc vào độ phức tạp nội dung: đơn giản → 1 shot, phức tạp → ${shotsPerScene} shots.

MỖI PROMPT PHẢI CÓ (40+ từ):
1. SUBJECT & ACTION: Ai/cái gì đang làm gì?
2. CAMERA ANGLE: close-up, medium shot, wide shot, bird's eye, low angle, over-the-shoulder, Dutch angle
3. LIGHTING: soft diffused, dramatic side light, golden hour, cool blue tones, rim light, backlit, neon glow
4. MOOD: tense, hopeful, mysterious, energetic, contemplative, dramatic
5. COMPOSITION: rule of thirds, centered, symmetrical, leading lines, negative space
6. COLOR PALETTE: dominant colors matching emotional tone

Giữ vững style cốt lõi của kênh. VARY camera angles giữa các shots.

FORMAT OUTPUT (JSON ARRAY):
[
  {
    "scene": "Nội dung tóm tắt tiếng Việt",
    "imagePrompts": [
       "[Style]. [Subject + action], [camera angle], [lighting], [mood], [composition], [colors]. [Aspect ratio]"
    ]
  }
]

CHỈ TRẢ VỀ JSON, KHÔNG GIẢI THÍCH.`;
    },

    /**
     * Robust JSON parser that handles common Gemini output issues:
     * - Unescaped newlines inside string values
     * - Control characters
     * - Trailing commas
     * - Markdown code blocks
     * - Partial/broken JSON
     */
    _parseJSON(raw) {
        console.log('📋 Raw Gemini response length:', raw.length);
        console.log('📋 First 200 chars:', raw.substring(0, 200));

        // Pre-clean: remove markdown code blocks
        let cleaned = raw.trim();
        cleaned = cleaned.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '');

        // Try to extract JSON array
        const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrayMatch) cleaned = arrayMatch[0];

        // Attempt 1: Direct parse
        try {
            const result = JSON.parse(cleaned);
            console.log('✅ JSON parsed directly, scenes:', result.length);
            return result;
        } catch (e) {
            console.warn('Attempt 1 failed:', e.message);
        }

        // Attempt 2: Sanitize control characters and fix strings
        try {
            let sanitized = cleaned;
            sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');
            sanitized = sanitized.replace(/"(?:[^"\\]|\\.)*"/g, (match) => {
                return match
                    .replace(/\r\n/g, '\\n')
                    .replace(/\r/g, '\\n')
                    .replace(/\n/g, '\\n')
                    .replace(/\t/g, '\\t');
            });
            sanitized = sanitized.replace(/,\s*([\]}])/g, '$1');
            const result = JSON.parse(sanitized);
            console.log('✅ JSON parsed after sanitization, scenes:', result.length);
            return result;
        } catch (e) {
            console.warn('Attempt 2 failed:', e.message);
        }

        // Attempt 3: Flatten all whitespace
        try {
            let fixed = cleaned
                .replace(/\r\n/g, ' ')
                .replace(/\r/g, ' ')
                .replace(/\n/g, ' ')
                .replace(/\t/g, ' ')
                .replace(/\s{2,}/g, ' ')
                .replace(/,\s*([\]}])/g, '$1');
            const result = JSON.parse(fixed);
            console.log('✅ JSON parsed after flattening, scenes:', result.length);
            return result;
        } catch (e) {
            console.warn('Attempt 3 failed:', e.message);
        }

        // Attempt 4: Extract individual JSON objects and rebuild array
        try {
            const objects = [];
            // Match each {...} block
            const objRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
            let match;
            const source = cleaned.replace(/\r?\n/g, ' ');
            while ((match = objRegex.exec(source)) !== null) {
                try {
                    const obj = JSON.parse(match[0]);
                    if (obj.title || obj.id || obj.imagePrompt) {
                        objects.push(obj);
                    }
                } catch (innerE) {
                    // Try fixing this individual object
                    try {
                        const fixedObj = match[0].replace(/,\s*}/g, '}');
                        const obj = JSON.parse(fixedObj);
                        if (obj.title || obj.id || obj.imagePrompt) {
                            objects.push(obj);
                        }
                    } catch (_) { /* skip broken object */ }
                }
            }
            if (objects.length > 0) {
                console.log('✅ Rebuilt array from individual objects, scenes:', objects.length);
                return objects;
            }
        } catch (e) {
            console.warn('Attempt 4 failed:', e.message);
        }

        // Attempt 5: Use Function constructor (safe eval alternative)
        try {
            const flat = cleaned.replace(/\r?\n/g, ' ').replace(/\s{2,}/g, ' ');
            const result = new Function(`return ${flat}`)();
            if (Array.isArray(result) && result.length > 0) {
                console.log('✅ JSON parsed via Function constructor, scenes:', result.length);
                return result;
            }
        } catch (e) {
            console.warn('Attempt 5 failed:', e.message);
        }

        console.error('❌ All parse attempts failed. Raw:', cleaned.substring(0, 500));
        throw new Error('Không thể parse kết quả phân cảnh. Gemini trả về format không hợp lệ. Hãy thử lại.');
    },

    async regenerateSinglePrompt(sceneIndex) {
        const scene = this.scenes[sceneIndex];
        if (!scene) return;

        const stylePrompt = this.getStylePrompt();
        const shotsCount = scene.imagePrompts?.length || 2;
        const isShort = this._videoType === 'short';
        const aspectRatio = isShort
            ? '9:16 vertical portrait orientation (1080x1920)'
            : '16:9 landscape orientation (1920x1080)';

        const result = await GeminiAPI.generateContent(
            `Tạo ${shotsCount} image prompt CHUYÊN NGHIỆP bằng tiếng Anh cho phân cảnh sau:
Title: ${scene.title}
Description: ${scene.description}
Voiceover: ${scene.voiceover}

Style: ${stylePrompt.prefix}
${stylePrompt.suffix}
Aspect ratio: ${aspectRatio}

Mỗi prompt phải:
1. Mô tả một góc nhìn/khoảnh khắc KHÁC NHAU trong cùng phân cảnh
2. Có 40+ từ, bao gồm: subject + action, camera angle, lighting, mood, composition, color palette
3. Kết thúc bằng "${aspectRatio}"
4. Dùng camera angles khác nhau giữa các shots (close-up, medium, wide, bird's eye, low angle...)
5. Chọn lighting phù hợp cảm xúc (dramatic side light, soft diffused, golden hour, cool tones...)

Trả về dạng JSON array of ${shotsCount} strings. Chỉ trả về JSON array, không giải thích.`,
            '',
            { temperature: 0.7, maxOutputTokens: 4000 }
        );

        try {
            let prompts = JSON.parse(result.trim().replace(/^```json?\s*/i, '').replace(/\s*```$/i, ''));
            if (Array.isArray(prompts) && prompts.length > 0) {
                this.scenes[sceneIndex].imagePrompts = prompts;
                this.scenes[sceneIndex].imagePrompt = prompts[0];
            }
        } catch {
            // Fallback: treat as single prompt
            this.scenes[sceneIndex].imagePrompts = [result.trim()];
            this.scenes[sceneIndex].imagePrompt = result.trim();
        }

        return this.scenes[sceneIndex];
    },

    // ═══════════════════════════════════════════
    // RENDERING
    // ═══════════════════════════════════════════

    renderScenes() {
        const container = document.getElementById('sceneList');
        if (!container) return;

        if (this.scenes.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted); text-align: center; padding: 2rem;">Chưa có phân cảnh. Hãy chia phân cảnh từ kịch bản.</p>';
            return;
        }

        const totalShots = this.scenes.reduce((sum, s) => sum + (s.imagePrompts?.length || 1), 0);

        container.innerHTML = `
            <div class="scene-summary">
                <span>🎬 <strong>${this.scenes.length}</strong> phân cảnh</span>
                <span>🖼️ <strong>${totalShots}</strong> hình tổng cộng</span>
                <span>⏱️ ~${Math.round(totalShots * 7)}s (${(totalShots * 7 / 60).toFixed(1)} phút) visual</span>
            </div>
        ` + this.scenes.map((scene, i) => {
            const prompts = scene.imagePrompts || [scene.imagePrompt || ''];
            const shotsHtml = prompts.map((prompt, si) => `
                <div class="shot-item">
                    <span class="shot-badge">Shot ${si + 1}</span>
                    <span class="shot-prompt">${prompt}</span>
                    <button class="btn btn-sm btn-ghost shot-copy-btn" title="Copy shot" onclick="app.copyShotPrompt(${i}, ${si})">📋</button>
                </div>
            `).join('');

            return `
                <div class="scene-card" data-scene-index="${i}">
                    <div class="scene-header">
                        <div class="scene-num">${scene.id || i + 1}</div>
                        <h4 class="scene-title">${scene.title}</h4>
                        <div class="scene-actions">
                            <button class="btn btn-sm btn-ghost" title="Copy tất cả shots" onclick="app.copyScenePrompt(${i})">📋 All</button>
                            <button class="btn btn-sm btn-ghost" title="Tạo lại shots" onclick="app.regenerateScene(${i})">🔄</button>
                        </div>
                    </div>
                    <div class="scene-desc">${scene.description}</div>
                    ${scene.voiceover ? `<div class="scene-voiceover">"${scene.voiceover.substring(0, 200)}${scene.voiceover.length > 200 ? '...' : ''}"</div>` : ''}
                    <div class="shots-list">${shotsHtml}</div>
                </div>
            `;
        }).join('');

        // Show footer
        const footer = document.getElementById('scenesFooter');
        if (footer) footer.style.display = 'block';
    },

    getAllPrompts() {
        return this.scenes.map((s, i) => {
            const prompts = s.imagePrompts || [s.imagePrompt || ''];
            const header = `=== Phân cảnh ${i + 1}: ${s.title} ===`;
            const shots = prompts.map((p, si) => `Shot ${si + 1}: ${p}`).join('\n');
            return `${header}\n${shots}`;
        }).join('\n\n');
    },

    getScenePrompts(sceneIndex) {
        const scene = this.scenes[sceneIndex];
        if (!scene) return '';
        const prompts = scene.imagePrompts || [scene.imagePrompt || ''];
        return prompts.map((p, i) => `Shot ${i + 1}: ${p}`).join('\n');
    },

    toJSON() {
        return {
            selectedStyle: this.selectedStyle,
            customStyleDesc: document.getElementById('customStyleDesc')?.value || '',
            scenes: this.scenes
        };
    },

    fromJSON(data) {
        if (data.selectedStyle) {
            this.selectStyle(data.selectedStyle);
            if (data.selectedStyle === 'custom' && data.customStyleDesc) {
                const el = document.getElementById('customStyleDesc');
                if (el) el.value = data.customStyleDesc;
            }
        }
        if (data.scenes) {
            this.scenes = data.scenes;
            this.renderScenes();
        }
    }
};
