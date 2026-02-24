/**
 * YouTube Creator Dashboard — Watermark Remover
 * Canvas-based image processing to remove watermarks
 */
window.WatermarkRemover = {

    images: [],
    processedImages: [],

    settings: {
        position: 'bottom-right',  // watermark position
        method: 'crop',            // crop | blur | fill
        sizePercent: 12            // % of image to remove
    },

    loadSettings() {
        this.settings.position = document.getElementById('wmPosition')?.value || 'bottom-right';
        this.settings.method = document.getElementById('wmMethod')?.value || 'crop';
        this.settings.sizePercent = parseInt(document.getElementById('wmSize')?.value || 12);
    },

    async processFiles(fileList) {
        this.loadSettings();
        this.images = [];
        this.processedImages = [];

        const promises = Array.from(fileList).map(file => this._loadImage(file));
        this.images = await Promise.all(promises);

        // Process each image
        for (let i = 0; i < this.images.length; i++) {
            const processed = await this._removeWatermark(this.images[i]);
            this.processedImages.push(processed);
        }

        this.renderResults();
        return this.processedImages;
    },

    _loadImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => resolve({ name: file.name, img, dataUrl: e.target.result });
                img.onerror = reject;
                img.src = e.target.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },

    async _removeWatermark(imageData) {
        const { img, name } = imageData;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const { position, method, sizePercent } = this.settings;

        const wmW = Math.round(img.width * sizePercent / 100);
        const wmH = Math.round(img.height * sizePercent / 100);

        if (method === 'crop') {
            // Crop out the watermark area
            let sx = 0, sy = 0, sw = img.width, sh = img.height;
            switch (position) {
                case 'bottom-right': sh -= wmH; break;
                case 'bottom-left': sh -= wmH; break;
                case 'top-right': sy = wmH; sh -= wmH; break;
                case 'top-left': sy = wmH; sh -= wmH; break;
            }
            canvas.width = sw;
            canvas.height = sh - sy;
            ctx.drawImage(img, sx, sy, sw, sh - sy, 0, 0, sw, sh - sy);

        } else if (method === 'blur') {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            // Get watermark region coords
            const region = this._getWmRegion(img.width, img.height, wmW, wmH, position);

            // Apply blur by drawing scaled-down then scaled-up
            const blurCanvas = document.createElement('canvas');
            const blurCtx = blurCanvas.getContext('2d');
            const scale = 0.05;
            blurCanvas.width = Math.max(1, region.w * scale);
            blurCanvas.height = Math.max(1, region.h * scale);
            blurCtx.drawImage(canvas, region.x, region.y, region.w, region.h, 0, 0, blurCanvas.width, blurCanvas.height);
            ctx.drawImage(blurCanvas, 0, 0, blurCanvas.width, blurCanvas.height, region.x, region.y, region.w, region.h);

        } else if (method === 'fill') {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const region = this._getWmRegion(img.width, img.height, wmW, wmH, position);

            // Sample color from nearby area and fill
            const sampleData = ctx.getImageData(region.x, Math.max(0, region.y - 2), region.w, 1);
            const avgColor = this._avgColor(sampleData.data);
            ctx.fillStyle = `rgb(${avgColor.r}, ${avgColor.g}, ${avgColor.b})`;
            ctx.fillRect(region.x, region.y, region.w, region.h);
        }

        const resultUrl = canvas.toDataURL('image/png');
        const cleanName = name.replace(/\.[^.]+$/, '') + '_clean.png';

        return { name: cleanName, dataUrl: resultUrl, canvas };
    },

    _getWmRegion(imgW, imgH, wmW, wmH, position) {
        switch (position) {
            case 'bottom-right': return { x: imgW - wmW, y: imgH - wmH, w: wmW, h: wmH };
            case 'bottom-left': return { x: 0, y: imgH - wmH, w: wmW, h: wmH };
            case 'top-right': return { x: imgW - wmW, y: 0, w: wmW, h: wmH };
            case 'top-left': return { x: 0, y: 0, w: wmW, h: wmH };
            default: return { x: imgW - wmW, y: imgH - wmH, w: wmW, h: wmH };
        }
    },

    _avgColor(data) {
        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
            r += data[i]; g += data[i + 1]; b += data[i + 2]; count++;
        }
        return { r: Math.round(r / count), g: Math.round(g / count), b: Math.round(b / count) };
    },

    renderResults() {
        const grid = document.getElementById('wmImageGrid');
        if (!grid) return;

        grid.innerHTML = this.processedImages.map((img, i) => `
            <div class="image-item">
                <img src="${img.dataUrl}" alt="${img.name}">
                <div class="image-overlay">
                    <span style="font-size:0.72rem;color:#fff;">${img.name}</span>
                    <button class="btn btn-sm btn-primary" onclick="app.downloadImage(${i})">📥</button>
                </div>
            </div>
        `).join('');

        const footer = document.getElementById('wmFooter');
        if (footer && this.processedImages.length > 0) footer.style.display = 'block';
    },

    downloadSingle(index) {
        const img = this.processedImages[index];
        if (!img) return;
        const a = document.createElement('a');
        a.href = img.dataUrl;
        a.download = img.name;
        a.click();
    },

    async downloadAll() {
        // Download individually (if no JSZip)
        for (let i = 0; i < this.processedImages.length; i++) {
            this.downloadSingle(i);
            await new Promise(r => setTimeout(r, 300));
        }
    }
};
