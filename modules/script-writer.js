/**
 * YouTube Creator Dashboard — Script Writer
 * AI-powered script generation with hooks, retention patterns, CTA
 */
window.ScriptWriter = {

    currentScript: '',

    SYSTEM_PROMPTS: {
        vi: {
            base: `Bạn là scriptwriter CHUYÊN NGHIỆP cho YouTube Việt Nam, chuyên viết kịch bản viral.

NGUYÊN TẮC CỐT LÕI:
1. Viết kịch bản HOÀN CHỈNH, chi tiết, sẵn sàng đọc. KHÔNG dùng placeholder.
2. Giọng văn: tự nhiên, đời thường, như đang trò chuyện. Dùng "mình" và "bạn".
3. Nội dung CỤ THỂ, CHUYÊN SÂU — không nói chung chung.
4. Dùng ví dụ thực tế, câu chuyện minh họa.
5. Tạo cảm xúc: empathy, surprise, curiosity, inspiration.
6. Giữ nhịp: câu ngắn xen câu dài, có pause tự nhiên.
7. TỪ KHÓA CHÍNH: CẤM lặp lại nguyên xi từ khóa chính quá 2 lần. Hãy linh hoạt dùng các từ đồng nghĩa, rút gọn tự nhiên trong văn nói để tránh cảm giác bị nhồi nhét.
8. HÌNH ẢNH (Visual Cues): BẮT BUỘC cứ mỗi 150-200 chữ ở Phần Thân (BODY) phải chèn 1 ghi chú (ví dụ: *(Hiệu ứng: ...)* hoặc *(Chèn Footage: ...)*) để giữ chân người xem.

QUY TẮC TIMESTAMP NGHIÊM NGẶT:
⚠️ Mỗi PHÚT video = khoảng 130-140 từ kịch bản (tốc độ nói tiếng Việt).
⚠️ Timestamp phải KHỚP với lượng nội dung thực tế:
  - Phần 1 phút → viết ÍT NHẤT 130 từ
  - Phần 2 phút → viết ÍT NHẤT 260 từ  
  - Phần 3 phút → viết ÍT NHẤT 390 từ
⚠️ KHÔNG ĐƯỢC ghi timestamp dài (ví dụ "1:00-3:30") rồi chỉ viết 2-3 đoạn ngắn. Nếu một section có timestamp 2.5 phút, phải có ít nhất 300+ từ.
⚠️ Nếu nội dung một phần ít, thì timestamp cũng phải ngắn tương ứng.

CẤU TRÚC:
- HOOK (0:00-0:05): 1-2 câu gây tò mò, BẮT BUỘC chứa từ khóa chính (~20 từ)
- INTRO (0:05-0:30): Đặt vấn đề, tạo đồng cảm (~50-60 từ)
- BODY: Nội dung chính, chia 3-5 sections, MỖI section tối thiểu 150-200 từ
- CTA (cuối): Like, comment, subscribe — tự nhiên (~40-50 từ)

FORMAT:
- **bold** cho heading
- ─── phân cách sections
- Ghi timestamp mỗi phần (phải khớp với lượng từ thực tế)
- Cuối ghi tổng thời gian ước lượng`,

            styles: {
                'storytelling': `\n\nPHONG CÁCH: KỂ CHUYỆN
- Mở đầu bằng câu chuyện có thật/trải nghiệm
- Xây dựng nhân vật, bối cảnh, xung đột
- Bước ngoặt và bài học rút ra
- Kết nối cảm xúc mạnh`,

                'step-by-step': `\n\nPHONG CÁCH: HƯỚNG DẪN TỪNG BƯỚC
- Chia 5-7 bước rõ ràng
- Mỗi bước giải thích CỤ THỂ + tips/mẹo
- Đề cập sai lầm cần tránh
- Tổng kết cuối video`,

                'myth-buster': `\n\nPHONG CÁCH: PHÁ LẦM TƯỞNG
- 5 sai lầm/lầm tưởng phổ biến
- Mỗi myth: quan niệm sai → tại sao sai → sự thật
- Dữ liệu, ví dụ chứng minh
- Yếu tố gây sốc, kết luận thực tế`
            }
        },
        en: {
            base: `You are a PROFESSIONAL YouTube scriptwriter specializing in viral content.

CORE PRINCIPLES:
1. Write COMPLETE, ready-to-read scripts. NO placeholders.
2. Conversational tone, natural flow. Use "you" and "I".
3. SPECIFIC, in-depth content — no fluff.
4. Real examples, vivid stories.
5. Evoke emotions: empathy, surprise, curiosity.
6. Maintain rhythm: short and long sentences, natural pauses.
7. PRIMARY KEYWORD: Do NOT repeat the exact primary keyword more than twice. Use natural synonyms to avoid robotic keyword stuffing.
8. VISUAL CUES: MANDATORY to insert a visual cue (e.g. *(Visual: ...)* or *(B-roll: ...)*) every 150-200 words in the BODY to guide the video edits and retain viewers.

STRICT TIMESTAMP RULES:
⚠️ Each MINUTE of video = approximately 140-160 words of script.
⚠️ Timestamps MUST match actual content length:
  - 1-minute section → write AT LEAST 140 words
  - 2-minute section → write AT LEAST 280 words
  - 3-minute section → write AT LEAST 420 words
⚠️ NEVER write a long timestamp (e.g. "1:00-3:30") with only 2-3 short paragraphs. If a section spans 2.5 minutes, it MUST have 350+ words.
⚠️ If content is short, the timestamp range must also be short.

STRUCTURE:
- HOOK (0:00-0:05): Extremely curiosity-inducing opener (~25 words)
- INTRO (0:05-0:30): Set the problem, create empathy (~60 words)
- BODY: Main content with 3-5 clear sections, EACH section minimum 150-200 words
- CTA (end): Like, comment, subscribe — natural (~50 words)

FORMAT:
- **bold** for headings
- ─── for section separators
- Timestamps per section (must match actual word count)
- Total estimated duration at end`,

            styles: {
                'storytelling': '\n\nSTYLE: STORYTELLING\n- Open with a real story\n- Build character, setting, conflict\n- Plot twist and lesson learned\n- Strong emotional connection',
                'step-by-step': '\n\nSTYLE: STEP-BY-STEP GUIDE\n- 5-7 clear steps\n- Specific explanation + tips per step\n- Common mistakes to avoid\n- Summary at end',
                'myth-buster': '\n\nSTYLE: MYTH BUSTER\n- 5 common myths/misconceptions\n- Each: wrong belief → why wrong → truth\n- Data and examples\n- Shocking elements, practical conclusion'
            }
        }
    },

    getSystemPrompt(lang, style, videoType) {
        const prompts = this.SYSTEM_PROMPTS[lang] || this.SYSTEM_PROMPTS.vi;
        let prompt = prompts.base;
        prompt += prompts.styles[style] || '';

        if (videoType === 'short') {
            prompt += lang === 'vi'
                ? '\n\nĐÂY LÀ YOUTUBE SHORTS (< 60 giây). Kịch bản 100-150 từ, nhịp cực nhanh, hook ngay câu đầu.'
                : '\n\nTHIS IS A YOUTUBE SHORT (< 60 seconds). Script 100-150 words, ultra-fast pace, hook in first sentence.';
        } else {
            prompt += lang === 'vi'
                ? '\n\nVideo dài 5-10 phút. Kịch bản 1000-1500 từ.'
                : '\n\nLong-form video 5-10 minutes. Script 1000-1500 words.';
        }

        return prompt;
    },

    async generate(topic, options = {}) {
        const {
            style = 'storytelling',
            videoType = 'long',
            lang = 'vi',
            notes = '',
            secondaryKeywords = [],
            targetElement = null
        } = options;

        const systemPrompt = this.getSystemPrompt(lang, style, videoType);

        // Build keyword context
        let keywordContext = '';
        if (secondaryKeywords.length > 0) {
            keywordContext = lang === 'vi'
                ? `\n\nKEYWORD PHỤ CẦN LỒNG GHÉP TỰ NHIÊN TRONG KỊCH BẢN (mỗi keyword xuất hiện ít nhất 1 lần):\n${secondaryKeywords.map(k => `- ${k}`).join('\n')}\n\nLưu ý: Lồng ghép các keyword phụ một cách TỰ NHIÊN, không gượng ép. Mục đích để tăng SEO density.`
                : `\n\nSECONDARY KEYWORDS to naturally incorporate (each at least once):\n${secondaryKeywords.map(k => `- ${k}`).join('\n')}\n\nNote: Weave these naturally for SEO density.`;
        }

        const userPrompt = lang === 'vi'
            ? `Viết kịch bản video YouTube về chủ đề: "${topic}"\n\nTỪ KHÓA CHÍNH: "${topic}" — Lồng ghép ý nghĩa của từ khóa một cách linh hoạt, TỰ NHIÊN như văn nói, tuyệt đối không lặp lại nguyên xi cụm từ này nhiều lần gây nhàm chán.${notes ? `\n\nGhi chú thêm: ${notes}` : ''}${keywordContext}`
            : `Write a YouTube video script about: "${topic}"\n\nPRIMARY KEYWORD: "${topic}" — Weave the meaning naturally, absolutely do NOT copy-paste the exact phrase repeatedly.${notes ? `\n\nAdditional notes: ${notes}` : ''}${keywordContext}`;

        if (targetElement) {
            this.currentScript = await GeminiAPI.streamContent(
                userPrompt, systemPrompt, targetElement,
                { temperature: 1.0, maxOutputTokens: 8192, purpose: 'quality' }
            );
        } else {
            this.currentScript = await GeminiAPI.generateContent(
                userPrompt, systemPrompt,
                { temperature: 1.0, maxOutputTokens: 8192, purpose: 'quality' }
            );
        }

        return this.currentScript;
    },

    getWordCount(text) {
        if (!text) return 0;
        const clean = text.replace(/<[^>]*>/g, '').replace(/[─═*#]/g, '').trim();
        return clean.split(/\s+/).filter(w => w.length > 0).length;
    },

    getReadTime(text) {
        const words = this.getWordCount(text);
        // Vietnamese speaking rate ~120-150 words/min
        return Math.ceil(words / 135);
    },

    /**
     * Extract clean voiceover text for TTS (AI Studio)
     * Strips: timestamps, stage directions, markdown, separators, section labels
     * Keeps: actual spoken text with proper line breaks for pauses
     */
    extractForTTS(text) {
        if (!text) text = this.currentScript;
        if (!text) return '';

        return text
            // Remove HTML tags
            .replace(/<[^>]*>/g, '')
            // Remove timestamps like (0:00-0:30), [0:00], 0:00-0:05:
            .replace(/[\(\[]*\d{1,2}:\d{2}[\s\-–—]*(?:\d{1,2}:\d{2})?[\)\]]*:?\s*/g, '')
            // Remove section separators ───, ═══, ---
            .replace(/[─═\-]{3,}/g, '')
            // Remove markdown bold/italic markers but keep text
            .replace(/\*\*(.+?)\*\*/g, '$1')
            .replace(/\*(.+?)\*/g, '$1')
            // Remove markdown headers # ## ###
            .replace(/^#{1,4}\s*/gm, '')
            // Remove section labels: HOOK, INTRO, BODY, CTA, OUTRO, combined like "KẾT LUẬN & CTA"
            .replace(/^\s*(HOOK|INTRO|BODY|CTA|OUTRO|CONCLUSION|KẾT LUẬN|KẾT|MỞ ĐẦU|NỘI DUNG|PHẦN \d+)(\s*[&+\/]\s*(HOOK|INTRO|BODY|CTA|OUTRO|CONCLUSION|KẾT LUẬN|KẾT|MỞ ĐẦU|NỘI DUNG))?\s*:?\s*$/gmi, '')
            // Remove numbered section headers like "1. Lầm tưởng 1:" or "Phần 2:" (line by itself)
            .replace(/^\s*\d+\.\s*(Lầm tưởng|Phần|Bước|Myth|Part|Step|Section|Tip|Mẹo|Sai lầm|Bí quyết|Nguyên tắc)\s*\d*\s*:.*$/gmi, '')
            // Remove stage directions like [Nhạc nền], (Hiệu ứng), [B-roll]
            .replace(/[\[\(][^\]\)]*(?:nhạc|hiệu ứng|b-roll|sound|music|sfx|effect|transition|cut to|fade|chèn|cắt|zoom)[^\]\)]*[\]\)]/gi, '')
            // Remove instruction lines (lines starting with → or ▶ or 📌 etc.)
            .replace(/^[\s]*[→▶📌🎵🎬💡⚡🔔]\s*.*/gm, '')
            // Remove "Tổng thời gian:" or "Estimated duration:" lines
            .replace(/^.*(tổng thời gian|estimated duration|total time|thời lượng).*$/gmi, '')
            // Remove empty parentheses/brackets
            .replace(/[\(\[]\s*[\)\]]/g, '')
            // Collapse 3+ newlines into 2 (paragraph break = pause)
            .replace(/\n{3,}/g, '\n\n')
            // Trim each line
            .split('\n').map(l => l.trim()).join('\n')
            // Remove lines that are just whitespace
            .replace(/^\s*$/gm, '')
            // Collapse multiple blank lines again
            .replace(/\n{3,}/g, '\n\n')
            .trim();
    },

    toJSON() {
        return { currentScript: this.currentScript };
    },

    fromJSON(data) {
        if (data.currentScript) {
            this.currentScript = data.currentScript;
        }
    }
};
