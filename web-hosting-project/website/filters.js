/**
 * Fun House Photo Booth - Filters
 * ================================
 * This file contains all the fun house filter implementations
 * and advanced image processing capabilities
 * 
 * The main app (app.js) calls window.applyFilter(canvas, ctx, filterName)
 * This function should modify the canvas in place with the filter effect
 */

(function() {
    'use strict';

    // ============================================
    // PHOTO BOOTH FILTERS API
    // ============================================
    
    window.PhotoBoothFilters = {
        // Existing filter list
        availableFilters: [
            'none', 'mirror', 'kaleidoscope', 'pixelate', 'wavy',
            'cartoon', 'vintage', 'neon', 'fisheye', 'stretch'
        ],
        
        // Image adjustments state
        adjustments: {
            brightness: 0,          // -100 to 100
            contrast: 0,            // -100 to 100
            beautyMode: false,
            beautyIntensity: 0.5,   // 0 to 1
            vignette: false,
            vignetteIntensity: 0.3, // 0 to 1
            grain: false,
            grainIntensity: 0.1     // 0 to 1
        },
        
        // Zoom state
        zoomLevel: 1.0,             // 1.0 to 3.0
        
        // Aspect ratio state
        aspectRatio: '16:9',        // '1:1', '4:3', '16:9', 'golden'
        
        // Grid overlay state
        gridOverlay: null,          // 'thirds', 'golden', 'spiral', 'diagonal', null
        
        // Initialize the filter system
        init: async function() {
            console.log('🎨 PhotoBoothFilters initialized');
            return true;
        },
        
        // Apply the currently selected filter
        applyFilter: async function(canvas, ctx, filterName) {
            window.applyFilter(canvas, ctx, filterName);
        },
        
        // Apply all current adjustments to a canvas
        applyAdjustments: function(ctx, canvas) {
            const adj = this.adjustments;
            
            // Apply brightness and contrast
            if (adj.brightness !== 0 || adj.contrast !== 0) {
                adjustBrightnessContrast(ctx, canvas, adj.brightness, adj.contrast);
            }
            
            // Apply beauty mode
            if (adj.beautyMode) {
                applyBeautyMode(ctx, canvas, adj.beautyIntensity);
            }
            
            // Apply vignette
            if (adj.vignette) {
                applyVignette(ctx, canvas, adj.vignetteIntensity);
            }
            
            // Apply film grain
            if (adj.grain) {
                applyFilmGrain(ctx, canvas, adj.grainIntensity);
            }
        },
        
        // Draw composition grid overlay
        drawGrid: function(ctx, canvas, type) {
            if (type) {
                drawGridOverlay(ctx, canvas, type);
            }
        },
        
        // Apply zoom to video feed
        applyZoom: function(ctx, canvas, video) {
            applyZoom(ctx, canvas, video, this.zoomLevel);
        },
        
        // Get aspect ratio dimensions
        getAspectDimensions: function(width, height) {
            return getAspectRatioDimensions(width, height, this.aspectRatio);
        },
        
        // Create photo strip from array of photos
        createPhotoStrip: function(photos) {
            return createPhotoStrip(photos);
        },
        
        // Create collage from photos
        createCollage: function(photos, layout) {
            return createCollage(photos, layout);
        },
        
        // Get burst capture timing configuration
        prepareBurstCapture: function(count, interval) {
            return prepareBurstCapture(count, interval);
        },
        
        // Reset all adjustments to defaults
        resetAdjustments: function() {
            this.adjustments = {
                brightness: 0,
                contrast: 0,
                beautyMode: false,
                beautyIntensity: 0.5,
                vignette: false,
                vignetteIntensity: 0.3,
                grain: false,
                grainIntensity: 0.1
            };
            this.zoomLevel = 1.0;
            this.gridOverlay = null;
        }
    };

    // ============================================
    // MAIN FILTER APPLICATION FUNCTION
    // ============================================
    
    /**
     * Main filter application function
     * Called by app.js on every frame
     * 
     * @param {HTMLCanvasElement} canvas - The preview canvas
     * @param {CanvasRenderingContext2D} ctx - The 2D context
     * @param {string} filterName - Name of the filter to apply
     */
    window.applyFilter = function(canvas, ctx, filterName) {
        const filters = {
            'none': () => {}, // No filter
            'mirror': () => applyMirrorFilter(canvas, ctx),
            'kaleidoscope': () => applyKaleidoscopeFilter(canvas, ctx),
            'pixelate': () => applyPixelateFilter(canvas, ctx),
            'wavy': () => applyWavyFilter(canvas, ctx),
            'cartoon': () => applyCartoonFilter(canvas, ctx),
            'vintage': () => applyVintageFilter(canvas, ctx),
            'neon': () => applyNeonFilter(canvas, ctx),
            'fisheye': () => applyFisheyeFilter(canvas, ctx),
            'stretch': () => applyStretchFilter(canvas, ctx)
        };

        if (filters[filterName]) {
            filters[filterName]();
        }
    };

    // ============================================
    // NEW IMAGE PROCESSING FUNCTIONS
    // ============================================

    /**
     * Beauty Mode Filter - Subtle skin smoothing
     * Uses a bilateral filter approximation for edge-preserving smoothing
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} intensity - Effect intensity (0 to 1)
     */
    function applyBeautyMode(ctx, canvas, intensity = 0.5) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const originalData = new Uint8ClampedArray(data);
        
        // Radius based on intensity (1-3 pixels for subtle effect)
        const radius = Math.ceil(1 + intensity * 2);
        const sigmaSpace = radius * 0.5;
        const sigmaColor = 30 + intensity * 40; // Color similarity threshold
        
        // Process only skin-tone regions for natural results
        for (let y = radius; y < height - radius; y++) {
            for (let x = radius; x < width - radius; x++) {
                const idx = (y * width + x) * 4;
                const r = originalData[idx];
                const g = originalData[idx + 1];
                const b = originalData[idx + 2];
                
                // Detect skin tones (simplified HSV-based detection)
                const max = Math.max(r, g, b);
                const min = Math.min(r, g, b);
                const isSkinTone = (
                    r > 60 && g > 40 && b > 20 &&
                    r > g && g > b &&
                    (max - min) > 15 &&
                    Math.abs(r - g) <= 15 * 3
                );
                
                if (!isSkinTone) continue;
                
                // Bilateral filter for skin regions
                let sumR = 0, sumG = 0, sumB = 0, sumWeight = 0;
                
                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const nIdx = ((y + ky) * width + (x + kx)) * 4;
                        const nR = originalData[nIdx];
                        const nG = originalData[nIdx + 1];
                        const nB = originalData[nIdx + 2];
                        
                        // Spatial weight
                        const spatialDist = Math.sqrt(kx * kx + ky * ky);
                        const spatialWeight = Math.exp(-(spatialDist * spatialDist) / (2 * sigmaSpace * sigmaSpace));
                        
                        // Color weight (edge preservation)
                        const colorDist = Math.sqrt(
                            (r - nR) * (r - nR) +
                            (g - nG) * (g - nG) +
                            (b - nB) * (b - nB)
                        );
                        const colorWeight = Math.exp(-(colorDist * colorDist) / (2 * sigmaColor * sigmaColor));
                        
                        const weight = spatialWeight * colorWeight;
                        
                        sumR += nR * weight;
                        sumG += nG * weight;
                        sumB += nB * weight;
                        sumWeight += weight;
                    }
                }
                
                // Blend smoothed result with original based on intensity
                const blendFactor = intensity * 0.6; // Keep it subtle
                data[idx] = Math.round(r * (1 - blendFactor) + (sumR / sumWeight) * blendFactor);
                data[idx + 1] = Math.round(g * (1 - blendFactor) + (sumG / sumWeight) * blendFactor);
                data[idx + 2] = Math.round(b * (1 - blendFactor) + (sumB / sumWeight) * blendFactor);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Brightness & Contrast Adjustment
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} brightness - Brightness adjustment (-100 to +100)
     * @param {number} contrast - Contrast adjustment (-100 to +100)
     */
    function adjustBrightnessContrast(ctx, canvas, brightness = 0, contrast = 0) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        // Normalize values
        const brightnessValue = brightness * 2.55; // Convert to 0-255 range
        const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
        
        for (let i = 0; i < data.length; i += 4) {
            // Apply brightness
            let r = data[i] + brightnessValue;
            let g = data[i + 1] + brightnessValue;
            let b = data[i + 2] + brightnessValue;
            
            // Apply contrast
            r = contrastFactor * (r - 128) + 128;
            g = contrastFactor * (g - 128) + 128;
            b = contrastFactor * (b - 128) + 128;
            
            // Clamp values
            data[i] = Math.max(0, Math.min(255, r));
            data[i + 1] = Math.max(0, Math.min(255, g));
            data[i + 2] = Math.max(0, Math.min(255, b));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Grid Overlays for Composition
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {string} type - Grid type: 'thirds', 'golden', 'spiral', 'diagonal'
     */
    function drawGridOverlay(ctx, canvas, type = 'thirds') {
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.save();
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        
        switch (type) {
            case 'thirds':
                // Rule of thirds - classic photography grid
                const thirdW = width / 3;
                const thirdH = height / 3;
                
                // Vertical lines
                ctx.beginPath();
                ctx.moveTo(thirdW, 0);
                ctx.lineTo(thirdW, height);
                ctx.moveTo(thirdW * 2, 0);
                ctx.lineTo(thirdW * 2, height);
                
                // Horizontal lines
                ctx.moveTo(0, thirdH);
                ctx.lineTo(width, thirdH);
                ctx.moveTo(0, thirdH * 2);
                ctx.lineTo(width, thirdH * 2);
                ctx.stroke();
                
                // Draw intersection points
                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                const radius = 4;
                [[thirdW, thirdH], [thirdW * 2, thirdH], 
                 [thirdW, thirdH * 2], [thirdW * 2, thirdH * 2]].forEach(([x, y]) => {
                    ctx.beginPath();
                    ctx.arc(x, y, radius, 0, Math.PI * 2);
                    ctx.fill();
                });
                break;
                
            case 'golden':
                // Golden ratio grid (φ ≈ 1.618)
                const phi = 1.618033988749895;
                const goldenW1 = width / phi;
                const goldenW2 = width - goldenW1;
                const goldenH1 = height / phi;
                const goldenH2 = height - goldenH1;
                
                ctx.beginPath();
                // Vertical lines
                ctx.moveTo(goldenW2, 0);
                ctx.lineTo(goldenW2, height);
                ctx.moveTo(goldenW1, 0);
                ctx.lineTo(goldenW1, height);
                
                // Horizontal lines
                ctx.moveTo(0, goldenH2);
                ctx.lineTo(width, goldenH2);
                ctx.moveTo(0, goldenH1);
                ctx.lineTo(width, goldenH1);
                ctx.stroke();
                break;
                
            case 'spiral':
                // Golden spiral (Fibonacci)
                ctx.beginPath();
                
                const phi2 = 1.618033988749895;
                let spiralWidth = width;
                let spiralHeight = height;
                let x = 0, y = 0;
                let direction = 0;
                
                for (let i = 0; i < 8; i++) {
                    const size = direction % 2 === 0 ? spiralWidth / phi2 : spiralHeight / phi2;
                    
                    // Draw rectangle
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.strokeRect(x, y, 
                        direction % 2 === 0 ? size : spiralWidth,
                        direction % 2 === 0 ? spiralHeight : size);
                    
                    // Draw arc
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    const arcCenterX = direction === 0 ? x + size : 
                                       direction === 1 ? x + spiralWidth :
                                       direction === 2 ? x + spiralWidth - size :
                                       x;
                    const arcCenterY = direction === 0 ? y + spiralHeight :
                                       direction === 1 ? y + size :
                                       direction === 2 ? y :
                                       y + spiralHeight - size;
                    const arcRadius = direction % 2 === 0 ? size : size;
                    const startAngle = direction * Math.PI / 2;
                    
                    ctx.beginPath();
                    ctx.arc(arcCenterX, arcCenterY, arcRadius, startAngle, startAngle + Math.PI / 2);
                    ctx.stroke();
                    
                    // Update position for next iteration
                    if (direction === 0) {
                        x += size;
                        spiralWidth -= size;
                    } else if (direction === 1) {
                        y += size;
                        spiralHeight -= size;
                    } else if (direction === 2) {
                        spiralWidth -= size;
                    } else {
                        spiralHeight -= size;
                    }
                    
                    direction = (direction + 1) % 4;
                }
                break;
                
            case 'diagonal':
                // Diagonal method
                ctx.beginPath();
                
                // Main diagonals
                ctx.moveTo(0, 0);
                ctx.lineTo(width, height);
                ctx.moveTo(width, 0);
                ctx.lineTo(0, height);
                
                // Reciprocal diagonals
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.setLineDash([5, 5]);
                ctx.moveTo(0, height / 2);
                ctx.lineTo(width / 2, 0);
                ctx.moveTo(width / 2, 0);
                ctx.lineTo(width, height / 2);
                ctx.moveTo(width, height / 2);
                ctx.lineTo(width / 2, height);
                ctx.moveTo(width / 2, height);
                ctx.lineTo(0, height / 2);
                ctx.stroke();
                break;
        }
        
        ctx.restore();
    }

    /**
     * Zoom Functionality
     * Center crop and scale the video feed
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {HTMLVideoElement} video - Video element
     * @param {number} zoomLevel - Zoom level (1.0 to 3.0)
     */
    function applyZoom(ctx, canvas, video, zoomLevel = 1.0) {
        if (zoomLevel <= 1.0) return;
        
        const width = canvas.width;
        const height = canvas.height;
        
        // Calculate crop dimensions
        const cropWidth = width / zoomLevel;
        const cropHeight = height / zoomLevel;
        const offsetX = (width - cropWidth) / 2;
        const offsetY = (height - cropHeight) / 2;
        
        // Get the center portion and scale it
        const imageData = ctx.getImageData(offsetX, offsetY, cropWidth, cropHeight);
        
        // Clear and draw scaled
        ctx.clearRect(0, 0, width, height);
        
        // Create temporary canvas for scaling
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = cropWidth;
        tempCanvas.height = cropHeight;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        
        // Draw scaled back to main canvas
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(tempCanvas, 0, 0, width, height);
    }

    /**
     * Aspect Ratio Cropping
     * Calculate dimensions for different aspect ratios
     * 
     * @param {number} containerWidth - Container width
     * @param {number} containerHeight - Container height
     * @param {string} ratio - Aspect ratio: '1:1', '4:3', '16:9', 'golden'
     * @returns {Object} { width, height, offsetX, offsetY }
     */
    function getAspectRatioDimensions(containerWidth, containerHeight, ratio) {
        let targetRatio;
        
        switch (ratio) {
            case '1:1':
                targetRatio = 1;
                break;
            case '4:3':
                targetRatio = 4 / 3;
                break;
            case '16:9':
                targetRatio = 16 / 9;
                break;
            case 'golden':
                targetRatio = 1.618033988749895;
                break;
            default:
                targetRatio = containerWidth / containerHeight;
        }
        
        const containerRatio = containerWidth / containerHeight;
        let width, height, offsetX, offsetY;
        
        if (containerRatio > targetRatio) {
            // Container is wider - fit to height
            height = containerHeight;
            width = height * targetRatio;
            offsetX = (containerWidth - width) / 2;
            offsetY = 0;
        } else {
            // Container is taller - fit to width
            width = containerWidth;
            height = width / targetRatio;
            offsetX = 0;
            offsetY = (containerHeight - height) / 2;
        }
        
        return {
            width: Math.round(width),
            height: Math.round(height),
            offsetX: Math.round(offsetX),
            offsetY: Math.round(offsetY)
        };
    }

    /**
     * Burst Mode Support
     * Returns timing configuration for burst captures
     * 
     * @param {number} count - Number of photos to capture (default 4)
     * @param {number} interval - Interval between captures in ms (default 300)
     * @returns {Object} Burst capture configuration
     */
    function prepareBurstCapture(count = 4, interval = 300) {
        return {
            count: Math.min(Math.max(count, 2), 10), // Clamp between 2-10
            interval: Math.max(interval, 100), // Minimum 100ms
            totalTime: count * interval,
            captureAt: Array.from({ length: count }, (_, i) => i * interval)
        };
    }

    /**
     * Photo Strip Mode
     * Combine photos vertically in a vintage photo strip style
     * 
     * @param {Array<HTMLCanvasElement|HTMLImageElement>} photos - Array of photos
     * @param {HTMLCanvasElement} targetCanvas - Optional target canvas
     * @returns {HTMLCanvasElement} Canvas with photo strip
     */
    function createPhotoStrip(photos, targetCanvas = null) {
        if (!photos || photos.length === 0) return null;
        
        const photoCount = Math.min(photos.length, 4);
        const photoWidth = photos[0].width || 640;
        const photoHeight = photos[0].height || 480;
        
        // Photo strip dimensions with borders
        const padding = 20;
        const stripWidth = photoWidth + padding * 2;
        const stripHeight = (photoHeight * photoCount) + (padding * (photoCount + 1));
        
        const canvas = targetCanvas || document.createElement('canvas');
        canvas.width = stripWidth;
        canvas.height = stripHeight;
        const ctx = canvas.getContext('2d');
        
        // Vintage cream background
        ctx.fillStyle = '#f5f0e6';
        ctx.fillRect(0, 0, stripWidth, stripHeight);
        
        // Add subtle texture
        for (let i = 0; i < stripWidth * stripHeight * 0.001; i++) {
            const x = Math.random() * stripWidth;
            const y = Math.random() * stripHeight;
            ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.03})`;
            ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw photos
        for (let i = 0; i < photoCount; i++) {
            const y = padding + i * (photoHeight + padding);
            
            // Photo shadow
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            ctx.fillRect(padding + 3, y + 3, photoWidth, photoHeight);
            
            // White border
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(padding - 4, y - 4, photoWidth + 8, photoHeight + 8);
            
            // Draw the photo
            ctx.drawImage(photos[i], padding, y, photoWidth, photoHeight);
        }
        
        // Add decorative elements
        ctx.fillStyle = '#c9a959';
        ctx.font = '12px Georgia, serif';
        ctx.textAlign = 'center';
        
        // Timestamp at bottom
        const date = new Date();
        const timestamp = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
        });
        ctx.fillText(timestamp, stripWidth / 2, stripHeight - 5);
        
        return canvas;
    }

    /**
     * Collage Mode
     * Arrange photos in various grid layouts
     * 
     * @param {Array<HTMLCanvasElement|HTMLImageElement>} photos - Array of photos
     * @param {HTMLCanvasElement} targetCanvas - Optional target canvas
     * @param {string} layout - Layout type: '2x2', '3x3', '1+2', '2+1'
     * @returns {HTMLCanvasElement} Canvas with collage
     */
    function createCollage(photos, targetCanvas = null, layout = '2x2') {
        if (!photos || photos.length === 0) return null;
        
        const gap = 4;
        const photoWidth = photos[0].width || 640;
        const photoHeight = photos[0].height || 480;
        
        let canvasWidth, canvasHeight;
        let positions = [];
        
        switch (layout) {
            case '2x2':
                canvasWidth = photoWidth * 2 + gap;
                canvasHeight = photoHeight * 2 + gap;
                positions = [
                    { x: 0, y: 0, w: photoWidth, h: photoHeight },
                    { x: photoWidth + gap, y: 0, w: photoWidth, h: photoHeight },
                    { x: 0, y: photoHeight + gap, w: photoWidth, h: photoHeight },
                    { x: photoWidth + gap, y: photoHeight + gap, w: photoWidth, h: photoHeight }
                ];
                break;
                
            case '3x3':
                const smallW = Math.floor(photoWidth * 2 / 3);
                const smallH = Math.floor(photoHeight * 2 / 3);
                canvasWidth = smallW * 3 + gap * 2;
                canvasHeight = smallH * 3 + gap * 2;
                for (let row = 0; row < 3; row++) {
                    for (let col = 0; col < 3; col++) {
                        positions.push({
                            x: col * (smallW + gap),
                            y: row * (smallH + gap),
                            w: smallW,
                            h: smallH
                        });
                    }
                }
                break;
                
            case '1+2':
                // One large on top, two small below
                canvasWidth = photoWidth * 2 + gap;
                canvasHeight = photoHeight * 1.5 + gap;
                positions = [
                    { x: 0, y: 0, w: photoWidth * 2 + gap, h: photoHeight },
                    { x: 0, y: photoHeight + gap, w: photoWidth, h: photoHeight * 0.5 },
                    { x: photoWidth + gap, y: photoHeight + gap, w: photoWidth, h: photoHeight * 0.5 }
                ];
                break;
                
            case '2+1':
                // Two small on top, one large below
                canvasWidth = photoWidth * 2 + gap;
                canvasHeight = photoHeight * 1.5 + gap;
                positions = [
                    { x: 0, y: 0, w: photoWidth, h: photoHeight * 0.5 },
                    { x: photoWidth + gap, y: 0, w: photoWidth, h: photoHeight * 0.5 },
                    { x: 0, y: photoHeight * 0.5 + gap, w: photoWidth * 2 + gap, h: photoHeight }
                ];
                break;
                
            default:
                return createCollage(photos, targetCanvas, '2x2');
        }
        
        const canvas = targetCanvas || document.createElement('canvas');
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        const ctx = canvas.getContext('2d');
        
        // Dark background for gaps
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        
        // Draw photos
        for (let i = 0; i < Math.min(photos.length, positions.length); i++) {
            const pos = positions[i];
            ctx.drawImage(photos[i], pos.x, pos.y, pos.w, pos.h);
        }
        
        return canvas;
    }

    /**
     * Vignette Effect
     * Subtle darkening around edges to draw focus to center
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} intensity - Effect intensity (0 to 1)
     */
    function applyVignette(ctx, canvas, intensity = 0.3) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Create radial gradient
        const gradient = ctx.createRadialGradient(
            centerX, centerY, 0,
            centerX, centerY, Math.sqrt(centerX * centerX + centerY * centerY)
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.8, `rgba(0, 0, 0, ${intensity * 0.3})`);
        gradient.addColorStop(1, `rgba(0, 0, 0, ${intensity})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }

    /**
     * Film Grain Effect
     * Subtle noise overlay for analog/organic feel
     * 
     * @param {CanvasRenderingContext2D} ctx - Canvas context
     * @param {HTMLCanvasElement} canvas - Canvas element
     * @param {number} intensity - Effect intensity (0 to 1)
     */
    function applyFilmGrain(ctx, canvas, intensity = 0.1) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const grainAmount = intensity * 50; // 0-50 noise range
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * grainAmount;
            
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    // ============================================
    // EXISTING FILTER FUNCTIONS
    // ============================================

    /**
     * Mirror Filter - Creates a symmetrical reflection
     */
    function applyMirrorFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const halfWidth = width / 2;
        
        // Get the left half
        const leftHalf = ctx.getImageData(0, 0, halfWidth, height);
        
        // Create mirrored version
        const mirroredData = ctx.createImageData(halfWidth, height);
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < halfWidth; x++) {
                const sourceIdx = (y * halfWidth + x) * 4;
                const targetIdx = (y * halfWidth + (halfWidth - 1 - x)) * 4;
                
                mirroredData.data[targetIdx] = leftHalf.data[sourceIdx];
                mirroredData.data[targetIdx + 1] = leftHalf.data[sourceIdx + 1];
                mirroredData.data[targetIdx + 2] = leftHalf.data[sourceIdx + 2];
                mirroredData.data[targetIdx + 3] = leftHalf.data[sourceIdx + 3];
            }
        }
        
        // Draw mirrored half on the right
        ctx.putImageData(mirroredData, halfWidth, 0);
    }

    /**
     * Kaleidoscope Filter - Creates a kaleidoscope effect
     */
    function applyKaleidoscopeFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = ctx.createImageData(width, height);
        
        const segments = 8;
        const angleStep = (Math.PI * 2) / segments;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                let angle = Math.atan2(dy, dx);
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                // Normalize angle to first segment
                if (angle < 0) angle += Math.PI * 2;
                const segmentAngle = angle % angleStep;
                
                // Mirror within segment
                const mirroredAngle = segmentAngle > angleStep / 2 
                    ? angleStep - segmentAngle 
                    : segmentAngle;
                
                // Calculate source coordinates
                const sourceX = Math.round(centerX + distance * Math.cos(mirroredAngle));
                const sourceY = Math.round(centerY + distance * Math.sin(mirroredAngle));
                
                if (sourceX >= 0 && sourceX < width && sourceY >= 0 && sourceY < height) {
                    const sourceIdx = (sourceY * width + sourceX) * 4;
                    const targetIdx = (y * width + x) * 4;
                    
                    newData.data[targetIdx] = data[sourceIdx];
                    newData.data[targetIdx + 1] = data[sourceIdx + 1];
                    newData.data[targetIdx + 2] = data[sourceIdx + 2];
                    newData.data[targetIdx + 3] = data[sourceIdx + 3];
                }
            }
        }
        
        ctx.putImageData(newData, 0, 0);
    }

    /**
     * Pixelate Filter - Creates a mosaic/pixelated effect
     */
    function applyPixelateFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const pixelSize = 12;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y += pixelSize) {
            for (let x = 0; x < width; x += pixelSize) {
                // Get average color of the block
                let r = 0, g = 0, b = 0, count = 0;
                
                for (let py = 0; py < pixelSize && y + py < height; py++) {
                    for (let px = 0; px < pixelSize && x + px < width; px++) {
                        const idx = ((y + py) * width + (x + px)) * 4;
                        r += data[idx];
                        g += data[idx + 1];
                        b += data[idx + 2];
                        count++;
                    }
                }
                
                r = Math.round(r / count);
                g = Math.round(g / count);
                b = Math.round(b / count);
                
                // Fill the block with average color
                for (let py = 0; py < pixelSize && y + py < height; py++) {
                    for (let px = 0; px < pixelSize && x + px < width; px++) {
                        const idx = ((y + py) * width + (x + px)) * 4;
                        data[idx] = r;
                        data[idx + 1] = g;
                        data[idx + 2] = b;
                    }
                }
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Wavy Filter - Creates a wavy distortion effect
     */
    function applyWavyFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const time = Date.now() / 1000;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = ctx.createImageData(width, height);
        
        const amplitude = 15;
        const frequency = 0.03;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Calculate wave offset
                const waveX = Math.sin(y * frequency + time * 2) * amplitude;
                const waveY = Math.cos(x * frequency + time * 2) * amplitude;
                
                let sourceX = Math.round(x + waveX);
                let sourceY = Math.round(y + waveY);
                
                // Clamp to bounds
                sourceX = Math.max(0, Math.min(width - 1, sourceX));
                sourceY = Math.max(0, Math.min(height - 1, sourceY));
                
                const sourceIdx = (sourceY * width + sourceX) * 4;
                const targetIdx = (y * width + x) * 4;
                
                newData.data[targetIdx] = data[sourceIdx];
                newData.data[targetIdx + 1] = data[sourceIdx + 1];
                newData.data[targetIdx + 2] = data[sourceIdx + 2];
                newData.data[targetIdx + 3] = data[sourceIdx + 3];
            }
        }
        
        ctx.putImageData(newData, 0, 0);
    }

    /**
     * Cartoon Filter - Creates a cartoon/posterized effect
     */
    function applyCartoonFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        const levels = 5;
        const factor = 255 / levels;
        
        for (let i = 0; i < data.length; i += 4) {
            // Posterize colors
            data[i] = Math.round(Math.round(data[i] / factor) * factor);
            data[i + 1] = Math.round(Math.round(data[i + 1] / factor) * factor);
            data[i + 2] = Math.round(Math.round(data[i + 2] / factor) * factor);
            
            // Boost saturation slightly
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const satBoost = 1.3;
            data[i] = Math.min(255, avg + (data[i] - avg) * satBoost);
            data[i + 1] = Math.min(255, avg + (data[i + 1] - avg) * satBoost);
            data[i + 2] = Math.min(255, avg + (data[i + 2] - avg) * satBoost);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add edge detection overlay
        addEdgeDetection(canvas, ctx, 0.3);
    }

    /**
     * Helper: Add edge detection overlay
     */
    function addEdgeDetection(canvas, ctx, opacity) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const edgeData = ctx.createImageData(width, height);
        
        // Sobel operators
        const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
        const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];
        
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                let gx = 0, gy = 0;
                
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const idx = ((y + ky) * width + (x + kx)) * 4;
                        const gray = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
                        const ki = (ky + 1) * 3 + (kx + 1);
                        gx += gray * sobelX[ki];
                        gy += gray * sobelY[ki];
                    }
                }
                
                const magnitude = Math.sqrt(gx * gx + gy * gy);
                const edge = magnitude > 50 ? 0 : 255;
                
                const idx = (y * width + x) * 4;
                edgeData.data[idx] = edge;
                edgeData.data[idx + 1] = edge;
                edgeData.data[idx + 2] = edge;
                edgeData.data[idx + 3] = edge < 255 ? opacity * 255 : 0;
            }
        }
        
        // Blend edge data
        for (let i = 0; i < data.length; i += 4) {
            if (edgeData.data[i + 3] > 0) {
                const alpha = edgeData.data[i + 3] / 255;
                data[i] = data[i] * (1 - alpha);
                data[i + 1] = data[i + 1] * (1 - alpha);
                data[i + 2] = data[i + 2] * (1 - alpha);
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Vintage Filter - Creates a retro/sepia effect
     */
    function applyVintageFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // Sepia tone
            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
            
            // Add slight yellow tint
            data[i] = Math.min(255, data[i] + 20);
            data[i + 1] = Math.min(255, data[i + 1] + 10);
            
            // Reduce contrast slightly
            data[i] = Math.round((data[i] - 128) * 0.9 + 128);
            data[i + 1] = Math.round((data[i + 1] - 128) * 0.9 + 128);
            data[i + 2] = Math.round((data[i + 2] - 128) * 0.9 + 128);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // Add vignette
        addVignetteLegacy(canvas, ctx, 0.4);
        
        // Add noise
        addNoise(canvas, ctx, 15);
    }

    /**
     * Helper: Add vignette effect (legacy version for vintage filter)
     */
    function addVignetteLegacy(canvas, ctx, strength) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = x - centerX;
                const dy = y - centerY;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const vignette = 1 - (dist / maxDist) * strength;
                
                const idx = (y * width + x) * 4;
                data[idx] *= vignette;
                data[idx + 1] *= vignette;
                data[idx + 2] *= vignette;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Helper: Add noise
     */
    function addNoise(canvas, ctx, amount) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * amount;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    }

    /**
     * Neon Filter - Creates a glowing neon edge effect
     */
    function applyNeonFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = ctx.createImageData(width, height);
        
        // Edge detection with color
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const idxLeft = (y * width + (x - 1)) * 4;
                const idxRight = (y * width + (x + 1)) * 4;
                const idxUp = ((y - 1) * width + x) * 4;
                const idxDown = ((y + 1) * width + x) * 4;
                
                // Calculate edge magnitude for each channel
                const edgeR = Math.abs(data[idxLeft] - data[idxRight]) + 
                              Math.abs(data[idxUp] - data[idxDown]);
                const edgeG = Math.abs(data[idxLeft + 1] - data[idxRight + 1]) + 
                              Math.abs(data[idxUp + 1] - data[idxDown + 1]);
                const edgeB = Math.abs(data[idxLeft + 2] - data[idxRight + 2]) + 
                              Math.abs(data[idxUp + 2] - data[idxDown + 2]);
                
                // Boost colors for neon effect
                const boost = 3;
                newData.data[idx] = Math.min(255, edgeR * boost);
                newData.data[idx + 1] = Math.min(255, edgeG * boost);
                newData.data[idx + 2] = Math.min(255, edgeB * boost);
                newData.data[idx + 3] = 255;
                
                // Add glow by making it brighter
                const brightness = (newData.data[idx] + newData.data[idx + 1] + newData.data[idx + 2]) / 3;
                if (brightness > 30) {
                    newData.data[idx] = Math.min(255, newData.data[idx] * 1.5);
                    newData.data[idx + 1] = Math.min(255, newData.data[idx + 1] * 1.5);
                    newData.data[idx + 2] = Math.min(255, newData.data[idx + 2] * 1.5);
                }
            }
        }
        
        ctx.putImageData(newData, 0, 0);
    }

    /**
     * Fisheye Filter - Creates a barrel distortion effect
     */
    function applyFisheyeFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(centerX, centerY);
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = ctx.createImageData(width, height);
        
        const strength = 2.5;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const dx = (x - centerX) / radius;
                const dy = (y - centerY) / radius;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                let sourceX, sourceY;
                
                if (dist < 1) {
                    // Apply fisheye distortion
                    const distortion = Math.pow(dist, strength);
                    sourceX = Math.round(centerX + dx * distortion * radius);
                    sourceY = Math.round(centerY + dy * distortion * radius);
                } else {
                    sourceX = x;
                    sourceY = y;
                }
                
                // Clamp to bounds
                sourceX = Math.max(0, Math.min(width - 1, sourceX));
                sourceY = Math.max(0, Math.min(height - 1, sourceY));
                
                const sourceIdx = (sourceY * width + sourceX) * 4;
                const targetIdx = (y * width + x) * 4;
                
                newData.data[targetIdx] = data[sourceIdx];
                newData.data[targetIdx + 1] = data[sourceIdx + 1];
                newData.data[targetIdx + 2] = data[sourceIdx + 2];
                newData.data[targetIdx + 3] = data[sourceIdx + 3];
            }
        }
        
        ctx.putImageData(newData, 0, 0);
    }

    /**
     * Stretch Filter - Creates a fun house mirror stretch effect
     */
    function applyStretchFilter(canvas, ctx) {
        const width = canvas.width;
        const height = canvas.height;
        const centerX = width / 2;
        const centerY = height / 2;
        
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const newData = ctx.createImageData(width, height);
        
        const time = Date.now() / 1000;
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Calculate normalized position
                const nx = (x - centerX) / centerX;
                const ny = (y - centerY) / centerY;
                
                // Apply stretch distortion
                const stretchX = nx * (1 + 0.3 * Math.sin(ny * Math.PI + time));
                const stretchY = ny * (1 + 0.5 * Math.cos(nx * Math.PI * 0.5));
                
                // Convert back to pixel coordinates
                let sourceX = Math.round(centerX + stretchX * centerX);
                let sourceY = Math.round(centerY + stretchY * centerY);
                
                // Clamp to bounds
                sourceX = Math.max(0, Math.min(width - 1, sourceX));
                sourceY = Math.max(0, Math.min(height - 1, sourceY));
                
                const sourceIdx = (sourceY * width + sourceX) * 4;
                const targetIdx = (y * width + x) * 4;
                
                newData.data[targetIdx] = data[sourceIdx];
                newData.data[targetIdx + 1] = data[sourceIdx + 1];
                newData.data[targetIdx + 2] = data[sourceIdx + 2];
                newData.data[targetIdx + 3] = data[sourceIdx + 3];
            }
        }
        
        ctx.putImageData(newData, 0, 0);
    }

    // Log that filters are loaded
    console.log('🎨 Fun House filters loaded!');
    console.log('📸 PhotoBoothFilters API ready with advanced image processing');

})();
