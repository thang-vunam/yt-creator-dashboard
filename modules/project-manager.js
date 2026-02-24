/**
 * YouTube Creator Dashboard — Project Manager
 * Save/load projects to localStorage
 */
window.ProjectManager = {

    STORAGE_KEY: 'ytcd_projects',
    CURRENT_KEY: 'ytcd_current_project',

    getProjects() {
        try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || []; }
        catch { return []; }
    },

    saveProjects(projects) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(projects));
    },

    getCurrentId() {
        return localStorage.getItem(this.CURRENT_KEY);
    },

    setCurrentId(id) {
        localStorage.setItem(this.CURRENT_KEY, id);
    },

    createProject(name = 'Dự án mới', channel = 'finance') {
        const project = {
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name,
            channel,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',     // draft | scripted | scenes-ready | seo-done | published
            data: {
                topic: '',
                videoType: 'long',
                scriptStyle: 'storytelling',
                scriptLang: 'vi',
                scriptNotes: '',
                script: '',
                scenes: null,
                seo: null
            }
        };

        const projects = this.getProjects();
        projects.unshift(project);
        this.saveProjects(projects);
        this.setCurrentId(project.id);
        return project;
    },

    saveCurrentState(app) {
        const id = this.getCurrentId();
        if (!id) return;

        const projects = this.getProjects();
        const idx = projects.findIndex(p => p.id === id);
        if (idx === -1) return;

        const p = projects[idx];
        p.updatedAt = new Date().toISOString();

        // Collect state from modules
        p.data.topic = document.getElementById('scriptTopic')?.value || '';
        p.data.videoType = document.getElementById('videoType')?.value || 'long';
        p.data.scriptStyle = document.getElementById('scriptStyle')?.value || 'storytelling';
        p.data.scriptLang = document.getElementById('scriptLang')?.value || 'vi';
        p.data.scriptNotes = document.getElementById('scriptNotes')?.value || '';
        p.data.script = ScriptWriter.currentScript;
        p.data.scenes = SceneManager.toJSON();
        p.data.seo = SEOOptimizer.toJSON();
        p.name = document.getElementById('projectName')?.textContent || p.name;

        // Update status
        if (p.data.seo?.results) p.status = 'seo-done';
        else if (p.data.scenes?.scenes?.length > 0) p.status = 'scenes-ready';
        else if (p.data.script) p.status = 'scripted';
        else p.status = 'draft';

        projects[idx] = p;
        this.saveProjects(projects);
    },

    loadProject(projectId) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId);
        if (!project) return null;

        this.setCurrentId(projectId);

        // Restore form values
        const d = project.data;
        const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
        set('scriptTopic', d.topic || '');
        set('videoType', d.videoType || 'long');
        set('scriptStyle', d.scriptStyle || 'storytelling');
        set('scriptLang', d.scriptLang || 'vi');
        set('scriptNotes', d.scriptNotes || '');

        // Restore script
        if (d.script) {
            ScriptWriter.fromJSON({ currentScript: d.script });
            const editor = document.getElementById('scriptEditor');
            const output = document.getElementById('scriptOutput');
            if (editor) editor.style.display = 'block';
            if (output) output.innerHTML = GeminiAPI.formatMarkdown(d.script);
        }

        // Restore scenes
        if (d.scenes) SceneManager.fromJSON(d.scenes);

        // Restore SEO
        if (d.seo) {
            SEOOptimizer.fromJSON(d.seo);
            SEOOptimizer.renderResults('seoResults');
            const kw = document.getElementById('seoKeyword');
            if (kw) kw.value = d.topic || '';
        }

        // Update UI
        document.getElementById('projectName').textContent = project.name;
        document.body.setAttribute('data-channel', project.channel);

        return project;
    },

    deleteProject(projectId) {
        let projects = this.getProjects();
        projects = projects.filter(p => p.id !== projectId);
        this.saveProjects(projects);
        if (this.getCurrentId() === projectId) {
            localStorage.removeItem(this.CURRENT_KEY);
        }
    },

    exportProject(projectId) {
        const projects = this.getProjects();
        const project = projects.find(p => p.id === projectId) || projects.find(p => p.id === this.getCurrentId());
        if (!project) return;
        const json = JSON.stringify(project, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `project_${project.name.replace(/\s+/g, '_')}.json`;
        a.click();
    },

    importProject(jsonStr) {
        try {
            const project = JSON.parse(jsonStr);
            project.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
            project.updatedAt = new Date().toISOString();
            const projects = this.getProjects();
            projects.unshift(project);
            this.saveProjects(projects);
            return project;
        } catch (e) {
            throw new Error('File JSON không hợp lệ');
        }
    },

    renderProjectList(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const projects = this.getProjects();
        const currentId = this.getCurrentId();

        if (projects.length === 0) {
            container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:2rem;">Chưa có dự án nào.</p>';
            return;
        }

        const statusLabel = { draft: '📝 Nháp', scripted: '✍️ Có kịch bản', 'scenes-ready': '🎬 Có phân cảnh', 'seo-done': '🔍 SEO xong', published: '✅ Đã xuất bản' };
        const channelLabel = { finance: '💰 Tài chính', psychology: '🧠 Tâm lý' };

        container.innerHTML = projects.map(p => `
            <div class="card ${p.id === currentId ? 'style="border-color: var(--accent);"' : ''}">
                <div class="card-header">
                    <div>
                        <div class="card-title">${p.name}</div>
                        <div style="font-size:0.75rem;color:var(--text-muted);margin-top:0.2rem;">
                            ${channelLabel[p.channel] || p.channel} · ${new Date(p.updatedAt).toLocaleDateString('vi-VN')}
                        </div>
                    </div>
                    <div style="display:flex;gap:0.5rem;align-items:center;">
                        <span class="badge badge-info">${statusLabel[p.status] || p.status}</span>
                        ${p.id === currentId ? '<span class="badge badge-accent">Hiện tại</span>' : ''}
                    </div>
                </div>
                <div class="btn-row">
                    <button class="btn btn-sm btn-primary" onclick="app.loadProject('${p.id}')">📂 Mở</button>
                    <button class="btn btn-sm btn-secondary" onclick="ProjectManager.exportProject('${p.id}')">📤 Export</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deleteProject('${p.id}')">🗑️ Xóa</button>
                </div>
            </div>
        `).join('');
    }
};
