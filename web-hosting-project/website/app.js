/**
 * Photo Booth - Redesigned Application
 * =====================================
 * Design Philosophy: Da Vinci + Steve Jobs
 * Golden Ratio | Minimalism | Symmetry
 */

(function() {
    'use strict';

    // ============================================
    // STATE MANAGEMENT
    // ============================================
    const state = {
        // Camera
        stream: null,
        facingMode: 'user',
        availableCameras: [],
        
        // Preview
        isMirrored: true,
        currentZoom: 1.0,
        minZoom: 1.0,
        maxZoom: 4.0,
        
        // Capture
        currentFilter: 'none',
        timerSeconds: 0,
        isCapturing: false,
        captureMode: 'single', // single, burst, strip, collage
        burstCount: 4,
        
        // Effects
        flashEnabled: true,
        soundEnabled: false,
        gridType: 'none',
        aspectRatio: '16:9',
        
        // Adjustments
        brightness: 0,
        contrast: 0,
        
        // Gallery
        gallery: [],
        currentPhotoIndex: null,
        
        // UI
        activePanel: null,
        animationFrameId: null,
        theme: 'dark'
    };

    const config = {
        maxGalleryItems: 50,
        photoQuality: 1.0,
        storageKey: 'photobooth_gallery',
        canvasWidth: 1280,
        canvasHeight: 720
    };

    // ============================================
    // DOM ELEMENTS CACHE
    // ============================================
    const $ = (selector) => document.querySelector(selector);
    const $$ = (selector) => document.querySelectorAll(selector);

    const elements = {
        // Overlays
        permissionOverlay: $('#permission-overlay'),
        enableCameraBtn: $('#enable-camera-btn'),
        errorOverlay: $('#error-overlay'),
        errorText: $('#error-text'),
        retryBtn: $('#retry-btn'),
        
        // Preview
        previewFrame: $('#preview-frame'),
        video: $('#video'),
        canvas: $('#preview-canvas'),
        gridOverlay: $('#grid-overlay'),
        filterIndicator: $('#filter-indicator'),
        filterName: $('#filter-name'),
        
        // Countdown
        countdownOverlay: $('#countdown-overlay'),
        countdownNumber: $('#countdown-number'),
        flashOverlay: $('#flash-overlay'),
        
        // Zoom
        zoomControls: $('#zoom-controls'),
        zoomIn: $('#zoom-in'),
        zoomOut: $('#zoom-out'),
        zoomLevel: $('#zoom-level'),
        
        // Capture
        captureBtn: $('#capture-btn'),
        captureProgress: $('#capture-progress'),
        
        // Toolbar
        filtersBtn: $('#filters-btn'),
        timerBtn: $('#timer-btn'),
        timerLabel: $('#timer-label'),
        modeBtn: $('#mode-btn'),
        modeLabel: $('#mode-label'),
        aspectBtn: $('#aspect-btn'),
        aspectLabel: $('#aspect-label'),
        settingsBtn: $('#settings-btn'),
        galleryBtn: $('#gallery-btn'),
        galleryCount: $('#gallery-count'),
        
        // Panels
        filterPanel: $('#filter-panel'),
        filterPanelClose: $('#filter-panel-close'),
        filterGrid: $('#filter-grid'),
        
        timerPanel: $('#timer-panel'),
        timerPanelClose: $('#timer-panel-close'),
        
        modePanel: $('#mode-panel'),
        modePanelClose: $('#mode-panel-close'),
        
        aspectPanel: $('#aspect-panel'),
        aspectPanelClose: $('#aspect-panel-close'),
        
        settingsPanel: $('#settings-panel'),
        settingsPanelClose: $('#settings-panel-close'),
        
        galleryPanel: $('#gallery-panel'),
        galleryPanelClose: $('#gallery-panel-close'),
        galleryGrid: $('#gallery-grid'),
        clearGalleryBtn: $('#clear-gallery-btn'),
        
        // Settings Controls
        cameraSelect: $('#camera-select'),
        mirrorToggle: $('#mirror-toggle'),
        flashToggle: $('#flash-toggle'),
        soundToggle: $('#sound-toggle'),
        gridSelect: $('#grid-select'),
        themeToggle: $('#theme-toggle'),
        fullscreenBtn: $('#fullscreen-btn'),
        qualitySelect: $('#quality-select'),
        
        // Adjustments
        brightnessSlider: $('#brightness-slider'),
        brightnessValue: $('#brightness-value'),
        contrastSlider: $('#contrast-slider'),
        contrastValue: $('#contrast-value'),
        
        // Modal
        modal: $('#photo-modal'),
        modalClose: $('#modal-close'),
        modalImage: $('#modal-image'),
        downloadBtn: $('#download-btn'),
        shareBtn: $('#share-btn'),
        deleteBtn: $('#delete-btn'),
        
        // Audio
        shutterSound: $('#shutter-sound')
    };

    // ============================================
    // CAMERA FUNCTIONS
    // ============================================
    
    async function startCamera() {
        try {
            stopCamera();
            
            const constraints = {
                video: {
                    facingMode: state.facingMode,
                    width: { ideal: config.canvasWidth },
                    height: { ideal: config.canvasHeight }
                },
                audio: false
            };

            state.stream = await navigator.mediaDevices.getUserMedia(constraints);
            elements.video.srcObject = state.stream;
            
            await new Promise((resolve) => {
                elements.video.onloadedmetadata = () => {
                    elements.video.play();
                    resolve();
                };
            });

            hideElement(elements.permissionOverlay);
            hideElement(elements.errorOverlay);
            
            setupCanvas();
            startRenderLoop();
            await enumerateCameras();
            showElement(elements.zoomControls);
            
        } catch (error) {
            console.error('Camera access error:', error);
            showError(getCameraErrorMessage(error));
        }
    }

    function stopCamera() {
        if (state.stream) {
            state.stream.getTracks().forEach(track => track.stop());
            state.stream = null;
        }
        if (state.animationFrameId) {
            cancelAnimationFrame(state.animationFrameId);
            state.animationFrameId = null;
        }
    }

    async function switchCamera(facingMode) {
        state.facingMode = facingMode;
        await startCamera();
    }

    async function enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            state.availableCameras = devices.filter(d => d.kind === 'videoinput');
            
            if (state.availableCameras.length > 1) {
                elements.cameraSelect.innerHTML = state.availableCameras.map((cam, i) => 
                    `<option value="${cam.deviceId}">${cam.label || `Camera ${i + 1}`}</option>`
                ).join('');
            }
        } catch (error) {
            console.warn('Could not enumerate cameras:', error);
        }
    }

    function getCameraErrorMessage(error) {
        const messages = {
            'NotAllowedError': 'Camera access denied. Please allow camera permissions.',
            'PermissionDeniedError': 'Camera access denied. Please allow camera permissions.',
            'NotFoundError': 'No camera found. Please connect a camera.',
            'DevicesNotFoundError': 'No camera found. Please connect a camera.',
            'NotReadableError': 'Camera is in use. Close other apps using the camera.',
            'TrackStartError': 'Camera is in use. Close other apps using the camera.',
            'OverconstrainedError': 'Camera settings not supported.'
        };
        return messages[error.name] || `Camera error: ${error.message || 'Unknown error'}`;
    }

    function showError(message) {
        elements.errorText.textContent = message;
        showElement(elements.errorOverlay);
        hideElement(elements.permissionOverlay);
    }

    // ============================================
    // CANVAS & RENDERING
    // ============================================
    
    function setupCanvas() {
        const canvas = elements.canvas;
        canvas.width = config.canvasWidth;
        canvas.height = config.canvasHeight;
    }

    function startRenderLoop() {
        const canvas = elements.canvas;
        const ctx = canvas.getContext('2d');
        
        function render() {
            if (!state.stream) return;
            
            // Clear canvas
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Save context for transformations
            ctx.save();
            
            // Apply mirror transform if enabled
            if (state.isMirrored) {
                ctx.translate(canvas.width, 0);
                ctx.scale(-1, 1);
            }
            
            // Apply zoom
            if (state.currentZoom > 1) {
                const zoomCenterX = canvas.width / 2;
                const zoomCenterY = canvas.height / 2;
                ctx.translate(zoomCenterX, zoomCenterY);
                ctx.scale(state.currentZoom, state.currentZoom);
                ctx.translate(-zoomCenterX, -zoomCenterY);
            }
            
            // Draw video frame
            ctx.drawImage(elements.video, 0, 0, canvas.width, canvas.height);
            
            ctx.restore();
            
            // Apply brightness and contrast
            if (state.brightness !== 0 || state.contrast !== 0) {
                applyBrightnessContrast(canvas, ctx);
            }
            
            // Apply current filter
            if (state.currentFilter !== 'none' && typeof window.applyFilter === 'function') {
                window.applyFilter(canvas, ctx, state.currentFilter);
            }
            
            state.animationFrameId = requestAnimationFrame(render);
        }
        
        render();
    }

    function applyBrightnessContrast(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const brightness = state.brightness * 2.55; // Convert to 0-255 scale
        const contrast = (state.contrast + 100) / 100; // Convert to multiplier
        const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            data[i] = Math.max(0, Math.min(255, data[i] + brightness));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + brightness));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + brightness));
            
            // Apply contrast
            data[i] = Math.max(0, Math.min(255, factor * (data[i] - 128) + 128));
            data[i + 1] = Math.max(0, Math.min(255, factor * (data[i + 1] - 128) + 128));
            data[i + 2] = Math.max(0, Math.min(255, factor * (data[i + 2] - 128) + 128));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // ============================================
    // ZOOM CONTROLS
    // ============================================
    
    function setZoom(level) {
        state.currentZoom = Math.max(state.minZoom, Math.min(state.maxZoom, level));
        elements.zoomLevel.textContent = state.currentZoom.toFixed(1) + 'x';
    }

    function zoomIn() {
        setZoom(state.currentZoom + 0.5);
    }

    function zoomOut() {
        setZoom(state.currentZoom - 0.5);
    }

    // ============================================
    // PHOTO CAPTURE
    // ============================================
    
    async function capturePhoto() {
        if (state.isCapturing) return;
        state.isCapturing = true;
        
        try {
            // Handle different capture modes
            switch (state.captureMode) {
                case 'burst':
                    await captureBurst();
                    break;
                case 'strip':
                    await captureStrip();
                    break;
                case 'collage':
                    await captureCollage();
                    break;
                default:
                    await captureSingle();
            }
        } finally {
            state.isCapturing = false;
        }
    }

    async function captureSingle() {
        // Timer countdown
        if (state.timerSeconds > 0) {
            await runCountdown();
        }
        
        // Flash effect
        if (state.flashEnabled) {
            triggerFlash();
        }
        
        // Play shutter sound
        if (state.soundEnabled) {
            playShutterSound();
        }
        
        // Capture the frame
        const photoData = elements.canvas.toDataURL('image/png', config.photoQuality);
        addToGallery(photoData);
    }

    async function captureBurst() {
        showElement(elements.captureProgress);
        const dots = $$('.progress-dot');
        const progressText = $('.progress-text');
        
        for (let i = 0; i < state.burstCount; i++) {
            // Update progress
            dots.forEach((dot, j) => {
                dot.classList.toggle('active', j === i);
                dot.classList.toggle('done', j < i);
            });
            progressText.textContent = `Capturing ${i + 1} of ${state.burstCount}`;
            
            // Wait for first shot if timer is set
            if (i === 0 && state.timerSeconds > 0) {
                await runCountdown();
            } else if (i > 0) {
                await delay(500); // Delay between burst shots
            }
            
            if (state.flashEnabled) triggerFlash();
            if (state.soundEnabled) playShutterSound();
            
            const photoData = elements.canvas.toDataURL('image/png', config.photoQuality);
            addToGallery(photoData, false); // Don't open gallery on each
        }
        
        hideElement(elements.captureProgress);
        updateGalleryCount();
    }

    async function captureStrip() {
        showElement(elements.captureProgress);
        const dots = $$('.progress-dot');
        const progressText = $('.progress-text');
        const photos = [];
        
        for (let i = 0; i < 4; i++) {
            dots.forEach((dot, j) => {
                dot.classList.toggle('active', j === i);
                dot.classList.toggle('done', j < i);
            });
            progressText.textContent = `Photo ${i + 1} of 4`;
            
            if (i === 0 && state.timerSeconds > 0) {
                await runCountdown();
            } else {
                await delay(1500); // 1.5s between strip photos
            }
            
            if (state.flashEnabled) triggerFlash();
            if (state.soundEnabled) playShutterSound();
            
            // Capture frame data
            photos.push(elements.canvas.toDataURL('image/png'));
        }
        
        hideElement(elements.captureProgress);
        
        // Create photo strip
        const stripCanvas = document.createElement('canvas');
        const stripWidth = 400;
        const photoHeight = 300;
        const stripHeight = photoHeight * 4 + 60; // Extra for borders
        
        stripCanvas.width = stripWidth;
        stripCanvas.height = stripHeight;
        const stripCtx = stripCanvas.getContext('2d');
        
        // Background
        stripCtx.fillStyle = '#1c1c1f';
        stripCtx.fillRect(0, 0, stripWidth, stripHeight);
        
        // Load and draw photos
        for (let i = 0; i < photos.length; i++) {
            const img = await loadImage(photos[i]);
            const y = 15 + i * (photoHeight + 10);
            stripCtx.drawImage(img, 15, y, stripWidth - 30, photoHeight - 10);
        }
        
        const stripData = stripCanvas.toDataURL('image/png');
        addToGallery(stripData);
    }

    async function captureCollage() {
        showElement(elements.captureProgress);
        const dots = $$('.progress-dot');
        const progressText = $('.progress-text');
        const photos = [];
        
        for (let i = 0; i < 4; i++) {
            dots.forEach((dot, j) => {
                dot.classList.toggle('active', j === i);
                dot.classList.toggle('done', j < i);
            });
            progressText.textContent = `Photo ${i + 1} of 4`;
            
            if (i === 0 && state.timerSeconds > 0) {
                await runCountdown();
            } else {
                await delay(1500);
            }
            
            if (state.flashEnabled) triggerFlash();
            if (state.soundEnabled) playShutterSound();
            
            photos.push(elements.canvas.toDataURL('image/png'));
        }
        
        hideElement(elements.captureProgress);
        
        // Create 2x2 collage
        const collageCanvas = document.createElement('canvas');
        const collageSize = 800;
        const photoSize = collageSize / 2 - 6;
        
        collageCanvas.width = collageSize;
        collageCanvas.height = collageSize;
        const collageCtx = collageCanvas.getContext('2d');
        
        // Background
        collageCtx.fillStyle = '#1c1c1f';
        collageCtx.fillRect(0, 0, collageSize, collageSize);
        
        // Draw photos in 2x2 grid
        const positions = [
            { x: 4, y: 4 },
            { x: collageSize / 2 + 2, y: 4 },
            { x: 4, y: collageSize / 2 + 2 },
            { x: collageSize / 2 + 2, y: collageSize / 2 + 2 }
        ];
        
        for (let i = 0; i < photos.length; i++) {
            const img = await loadImage(photos[i]);
            const { x, y } = positions[i];
            collageCtx.drawImage(img, x, y, photoSize, photoSize);
        }
        
        const collageData = collageCanvas.toDataURL('image/png');
        addToGallery(collageData);
    }

    function loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    function runCountdown() {
        return new Promise((resolve) => {
            let count = state.timerSeconds;
            
            showElement(elements.countdownOverlay);
            elements.countdownNumber.textContent = count;
            
            const interval = setInterval(() => {
                count--;
                
                if (count > 0) {
                    elements.countdownNumber.textContent = count;
                    // Re-trigger animation
                    elements.countdownNumber.style.animation = 'none';
                    elements.countdownNumber.offsetHeight;
                    elements.countdownNumber.style.animation = 'countdownPop 1s ease-out';
                } else {
                    clearInterval(interval);
                    hideElement(elements.countdownOverlay);
                    resolve();
                }
            }, 1000);
        });
    }

    function triggerFlash() {
        elements.flashOverlay.classList.add('flash');
        setTimeout(() => {
            elements.flashOverlay.classList.remove('flash');
        }, 400);
    }

    function playShutterSound() {
        if (elements.shutterSound) {
            elements.shutterSound.currentTime = 0;
            elements.shutterSound.play().catch(() => {});
        }
    }

    // ============================================
    // GALLERY MANAGEMENT
    // ============================================
    
    function addToGallery(photoData, updateUI = true) {
        const photo = {
            id: Date.now() + Math.random(),
            data: photoData,
            filter: state.currentFilter,
            timestamp: new Date().toISOString()
        };
        
        state.gallery.unshift(photo);
        
        if (state.gallery.length > config.maxGalleryItems) {
            state.gallery.pop();
        }
        
        saveGallery();
        
        if (updateUI) {
            renderGallery();
            updateGalleryCount();
        }
    }

    function removeFromGallery(photoId) {
        state.gallery = state.gallery.filter(p => p.id !== photoId);
        saveGallery();
        renderGallery();
        updateGalleryCount();
        closeModal();
    }

    function clearGallery() {
        if (confirm('Delete all photos?')) {
            state.gallery = [];
            saveGallery();
            renderGallery();
            updateGalleryCount();
        }
    }

    function saveGallery() {
        try {
            localStorage.setItem(config.storageKey, JSON.stringify(state.gallery));
        } catch (error) {
            console.warn('Could not save gallery:', error);
        }
    }

    function loadGallery() {
        try {
            const stored = localStorage.getItem(config.storageKey);
            if (stored) {
                state.gallery = JSON.parse(stored);
                updateGalleryCount();
            }
        } catch (error) {
            console.warn('Could not load gallery:', error);
            state.gallery = [];
        }
    }

    function renderGallery() {
        if (state.gallery.length === 0) {
            elements.galleryGrid.innerHTML = `
                <div class="gallery-empty">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                        <circle cx="8.5" cy="8.5" r="1.5"/>
                        <polyline points="21 15 16 10 5 21"/>
                    </svg>
                    <p>No photos yet</p>
                    <span>Capture your first moment</span>
                </div>
            `;
            return;
        }
        
        elements.galleryGrid.innerHTML = state.gallery.map((photo, index) => `
            <div class="gallery-item new" data-id="${photo.id}" data-index="${index}">
                <img src="${photo.data}" alt="Photo ${index + 1}" loading="lazy">
            </div>
        `).join('');
        
        // Add click handlers
        $$('.gallery-item').forEach(item => {
            item.addEventListener('click', () => {
                openModal(parseInt(item.dataset.index));
            });
        });
    }

    function updateGalleryCount() {
        const count = state.gallery.length;
        if (count > 0) {
            elements.galleryCount.textContent = count > 99 ? '99+' : count;
            showElement(elements.galleryCount);
        } else {
            hideElement(elements.galleryCount);
        }
    }

    // ============================================
    // MODAL FUNCTIONS
    // ============================================
    
    function openModal(index) {
        state.currentPhotoIndex = index;
        const photo = state.gallery[index];
        
        elements.modalImage.src = photo.data;
        showElement(elements.modal);
        
        // Check for Web Share API
        if (!navigator.share) {
            hideElement(elements.shareBtn);
        } else {
            showElement(elements.shareBtn);
        }
    }

    function closeModal() {
        hideElement(elements.modal);
        state.currentPhotoIndex = null;
    }

    function downloadPhoto() {
        if (state.currentPhotoIndex === null) return;
        
        const photo = state.gallery[state.currentPhotoIndex];
        const link = document.createElement('a');
        link.download = `photo-${Date.now()}.png`;
        link.href = photo.data;
        link.click();
    }

    async function sharePhoto() {
        if (state.currentPhotoIndex === null || !navigator.share) return;
        
        const photo = state.gallery[state.currentPhotoIndex];
        
        try {
            const response = await fetch(photo.data);
            const blob = await response.blob();
            const file = new File([blob], 'photo.png', { type: 'image/png' });
            
            await navigator.share({
                title: 'Photo Booth',
                text: 'Check out this photo!',
                files: [file]
            });
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Share failed:', error);
            }
        }
    }

    function deletePhoto() {
        if (state.currentPhotoIndex === null) return;
        
        if (confirm('Delete this photo?')) {
            removeFromGallery(state.gallery[state.currentPhotoIndex].id);
        }
    }

    // ============================================
    // FILTER SELECTION
    // ============================================
    
    function selectFilter(filterName) {
        state.currentFilter = filterName;
        
        // Update UI
        $$('.filter-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filterName);
        });
        
        // Update indicator
        const names = {
            'none': 'Original',
            'mirror': 'Mirror',
            'kaleidoscope': 'Kaleidoscope',
            'pixelate': 'Pixelate',
            'wavy': 'Wavy',
            'cartoon': 'Cartoon',
            'vintage': 'Vintage',
            'neon': 'Neon',
            'fisheye': 'Fisheye',
            'stretch': 'Stretch',
            'beauty': 'Beauty'
        };
        elements.filterName.textContent = names[filterName] || 'Original';
    }

    // ============================================
    // TIMER CONTROLS
    // ============================================
    
    function setTimer(seconds) {
        state.timerSeconds = seconds;
        
        $$('.timer-option').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.seconds) === seconds);
        });
        
        elements.timerLabel.textContent = seconds > 0 ? `${seconds}s` : 'Off';
        elements.timerBtn.dataset.active = seconds > 0;
    }

    // ============================================
    // MODE CONTROLS
    // ============================================
    
    function setCaptureMode(mode) {
        state.captureMode = mode;
        
        $$('.mode-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        const labels = {
            'single': 'Single',
            'burst': 'Burst',
            'strip': 'Strip',
            'collage': 'Collage'
        };
        elements.modeLabel.textContent = labels[mode] || 'Single';
    }

    // ============================================
    // ASPECT RATIO
    // ============================================
    
    function setAspectRatio(ratio) {
        state.aspectRatio = ratio;
        elements.previewFrame.dataset.aspect = ratio;
        
        $$('.aspect-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.aspect === ratio);
        });
        
        elements.aspectLabel.textContent = ratio === 'golden' ? 'φ' : ratio;
    }

    // ============================================
    // GRID OVERLAY
    // ============================================
    
    function setGrid(type) {
        state.gridType = type;
        const overlay = elements.gridOverlay;
        
        overlay.className = 'grid-overlay';
        
        if (type === 'none') {
            hideElement(overlay);
        } else {
            overlay.classList.add(type);
            showElement(overlay);
        }
    }

    // ============================================
    // SETTINGS
    // ============================================
    
    function toggleMirror() {
        state.isMirrored = !state.isMirrored;
        elements.mirrorToggle.classList.toggle('active', state.isMirrored);
        elements.previewFrame.classList.toggle('no-mirror', !state.isMirrored);
    }

    function toggleFlash() {
        state.flashEnabled = !state.flashEnabled;
        elements.flashToggle.classList.toggle('active', state.flashEnabled);
    }

    function toggleSound() {
        state.soundEnabled = !state.soundEnabled;
        elements.soundToggle.classList.toggle('active', state.soundEnabled);
    }

    function setTheme(theme) {
        state.theme = theme;
        document.documentElement.dataset.theme = theme;
        
        $$('.theme-option').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.theme === theme);
        });
        
        localStorage.setItem('photobooth_theme', theme);
    }

    function toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(() => {});
            elements.fullscreenBtn.textContent = 'Exit';
        } else {
            document.exitFullscreen();
            elements.fullscreenBtn.textContent = 'Enter';
        }
    }

    function setQuality(quality) {
        config.photoQuality = parseFloat(quality);
    }

    // ============================================
    // PANEL MANAGEMENT
    // ============================================
    
    function openPanel(panelId) {
        // Close all panels first
        closeAllPanels();
        
        const panel = $(`#${panelId}`);
        if (panel) {
            showElement(panel);
            state.activePanel = panelId;
            
            // Update toolbar button states
            updateToolbarActiveStates(panelId);
        }
    }

    function closeAllPanels() {
        $$('.panel').forEach(p => hideElement(p));
        state.activePanel = null;
        
        // Reset toolbar button states
        $$('.tool-btn').forEach(btn => btn.dataset.active = 'false');
    }

    function togglePanel(panelId) {
        if (state.activePanel === panelId) {
            closeAllPanels();
        } else {
            openPanel(panelId);
        }
    }

    function updateToolbarActiveStates(activePanelId) {
        const mapping = {
            'filter-panel': 'filters-btn',
            'timer-panel': 'timer-btn',
            'mode-panel': 'mode-btn',
            'aspect-panel': 'aspect-btn',
            'settings-panel': 'settings-btn',
            'gallery-panel': 'gallery-btn'
        };
        
        $$('.tool-btn').forEach(btn => btn.dataset.active = 'false');
        
        const btnId = mapping[activePanelId];
        if (btnId) {
            $(`#${btnId}`).dataset.active = 'true';
        }
    }

    // ============================================
    // UTILITY FUNCTIONS
    // ============================================
    
    function showElement(el) {
        if (el) el.classList.remove('hidden');
    }

    function hideElement(el) {
        if (el) el.classList.add('hidden');
    }

    function delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ============================================
    // EVENT LISTENERS
    // ============================================
    
    function setupEventListeners() {
        // Permission & Error
        elements.enableCameraBtn?.addEventListener('click', startCamera);
        elements.retryBtn?.addEventListener('click', startCamera);
        
        // Capture
        elements.captureBtn?.addEventListener('click', capturePhoto);
        
        // Zoom
        elements.zoomIn?.addEventListener('click', zoomIn);
        elements.zoomOut?.addEventListener('click', zoomOut);
        
        // Toolbar buttons
        elements.filtersBtn?.addEventListener('click', () => togglePanel('filter-panel'));
        elements.timerBtn?.addEventListener('click', () => togglePanel('timer-panel'));
        elements.modeBtn?.addEventListener('click', () => togglePanel('mode-panel'));
        elements.aspectBtn?.addEventListener('click', () => togglePanel('aspect-panel'));
        elements.settingsBtn?.addEventListener('click', () => togglePanel('settings-panel'));
        elements.galleryBtn?.addEventListener('click', () => {
            renderGallery();
            togglePanel('gallery-panel');
        });
        
        // Panel close buttons
        elements.filterPanelClose?.addEventListener('click', closeAllPanels);
        elements.timerPanelClose?.addEventListener('click', closeAllPanels);
        elements.modePanelClose?.addEventListener('click', closeAllPanels);
        elements.aspectPanelClose?.addEventListener('click', closeAllPanels);
        elements.settingsPanelClose?.addEventListener('click', closeAllPanels);
        elements.galleryPanelClose?.addEventListener('click', closeAllPanels);
        
        // Filter selection
        $$('.filter-option').forEach(btn => {
            btn.addEventListener('click', () => selectFilter(btn.dataset.filter));
        });
        
        // Timer options
        $$('.timer-option').forEach(btn => {
            btn.addEventListener('click', () => setTimer(parseInt(btn.dataset.seconds)));
        });
        
        // Mode options
        $$('.mode-option').forEach(btn => {
            btn.addEventListener('click', () => setCaptureMode(btn.dataset.mode));
        });
        
        // Aspect ratio options
        $$('.aspect-option').forEach(btn => {
            btn.addEventListener('click', () => setAspectRatio(btn.dataset.aspect));
        });
        
        // Settings
        elements.cameraSelect?.addEventListener('change', (e) => {
            switchCamera(e.target.value);
        });
        
        elements.mirrorToggle?.addEventListener('click', toggleMirror);
        elements.flashToggle?.addEventListener('click', toggleFlash);
        elements.soundToggle?.addEventListener('click', toggleSound);
        
        elements.gridSelect?.addEventListener('change', (e) => {
            setGrid(e.target.value);
        });
        
        $$('.theme-option').forEach(btn => {
            btn.addEventListener('click', () => setTheme(btn.dataset.theme));
        });
        
        elements.fullscreenBtn?.addEventListener('click', toggleFullscreen);
        
        elements.qualitySelect?.addEventListener('change', (e) => {
            setQuality(e.target.value);
        });
        
        // Adjustment sliders
        elements.brightnessSlider?.addEventListener('input', (e) => {
            state.brightness = parseInt(e.target.value);
            elements.brightnessValue.textContent = state.brightness;
        });
        
        elements.contrastSlider?.addEventListener('input', (e) => {
            state.contrast = parseInt(e.target.value);
            elements.contrastValue.textContent = state.contrast;
        });
        
        // Gallery
        elements.clearGalleryBtn?.addEventListener('click', clearGallery);
        
        // Modal
        elements.modalClose?.addEventListener('click', closeModal);
        elements.modal?.querySelector('.modal-backdrop')?.addEventListener('click', closeModal);
        elements.downloadBtn?.addEventListener('click', downloadPhoto);
        elements.shareBtn?.addEventListener('click', sharePhoto);
        elements.deleteBtn?.addEventListener('click', deletePhoto);
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (state.activePanel) {
                    closeAllPanels();
                } else if (!elements.modal.classList.contains('hidden')) {
                    closeModal();
                }
            } else if (e.key === ' ' && elements.modal.classList.contains('hidden')) {
                e.preventDefault();
                capturePhoto();
            }
        });
        
        // Visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
            } else if (!document.hidden && state.stream) {
                startRenderLoop();
            }
        });
        
        // Fullscreen change
        document.addEventListener('fullscreenchange', () => {
            elements.fullscreenBtn.textContent = document.fullscreenElement ? 'Exit' : 'Enter';
        });
    }

    // ============================================
    // INITIALIZATION
    // ============================================
    
    function init() {
        // Load saved data
        loadGallery();
        
        // Load theme preference
        const savedTheme = localStorage.getItem('photobooth_theme') || 'dark';
        setTheme(savedTheme);
        
        // Setup event listeners
        setupEventListeners();
        
        // Set default aspect ratio
        setAspectRatio('16:9');
        
        // Check camera support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            showError('Your browser does not support camera access.');
            hideElement(elements.permissionOverlay);
            return;
        }
        
        console.log('✨ Photo Booth initialized');
    }

    // ============================================
    // BEAUTY FILTER (Additional)
    // ============================================
    
    // Extend filters.js with beauty filter
    const originalApplyFilter = window.applyFilter;
    window.applyFilter = function(canvas, ctx, filterName) {
        if (filterName === 'beauty') {
            applyBeautyFilter(canvas, ctx);
        } else if (originalApplyFilter) {
            originalApplyFilter(canvas, ctx, filterName);
        }
    };

    function applyBeautyFilter(canvas, ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        // Simple skin smoothing effect
        // This is a basic bilateral-like filter
        for (let i = 0; i < data.length; i += 4) {
            // Slight blur simulation by averaging with neighbors
            // and a slight brightness boost
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Detect skin-like tones (very simplified)
            const isSkinTone = (r > 95 && g > 40 && b > 20 && 
                               r > g && r > b && 
                               Math.abs(r - g) > 15);
            
            if (isSkinTone) {
                // Slight smoothing by reducing contrast
                const avg = (r + g + b) / 3;
                data[i] = Math.min(255, r + (avg - r) * 0.1 + 3);
                data[i + 1] = Math.min(255, g + (avg - g) * 0.1 + 2);
                data[i + 2] = Math.min(255, b + (avg - b) * 0.1);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // ============================================
    // EXPOSE API
    // ============================================
    
    window.PhotoBooth = {
        state,
        startCamera,
        stopCamera,
        capturePhoto,
        selectFilter,
        setTimer,
        setCaptureMode,
        setAspectRatio,
        setTheme,
        clearGallery
    };

    // Start the application
    document.addEventListener('DOMContentLoaded', init);

})();
