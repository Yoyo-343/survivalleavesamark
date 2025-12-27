// Global state
let originalImage = null;
let currentThreshold = 15;

// DOM Elements
const imageUpload = document.getElementById('imageUpload');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });
const thresholdSlider = document.getElementById('threshold');
const thresholdValue = document.getElementById('thresholdValue');
const downloadBtn = document.getElementById('downloadBtn');
const shareBtn = document.getElementById('shareBtn');
const resetBtn = document.getElementById('resetBtn');
const controls = document.getElementById('controls');
const canvasSection = document.getElementById('canvasSection');
const placeholder = document.getElementById('placeholder');
const presetBtns = document.querySelectorAll('.preset-btn');

// Colors
const NEON_GREEN = { r: 0, g: 240, b: 0 };
const BLACK = { r: 0, g: 0, b: 0 };

// Event Listeners
imageUpload.addEventListener('change', handleImageUpload);
thresholdSlider.addEventListener('input', handleThresholdChange);
downloadBtn.addEventListener('click', downloadImage);
shareBtn.addEventListener('click', shareToX);
resetBtn.addEventListener('click', resetApp);

presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const threshold = parseInt(btn.dataset.threshold);
        thresholdSlider.value = threshold;
        handleThresholdChange({ target: { value: threshold } });
    });
});

/**
 * Handle image upload
 */
function handleImageUpload(event) {
    const file = event.target.files[0];
    
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        alert('Please upload a valid image file');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        const img = new Image();
        
        img.onload = function() {
            originalImage = img;
            
            // Set canvas size to match image
            canvas.width = img.width;
            canvas.height = img.height;
            
            // Show UI elements
            placeholder.style.display = 'none';
            controls.style.display = 'block';
            canvasSection.style.display = 'block';
            
            // Apply initial filter
            applyFilter();
        };
        
        img.src = e.target.result;
    };
    
    reader.readAsDataURL(file);
}

/**
 * Handle threshold slider change
 */
function handleThresholdChange(event) {
    currentThreshold = parseInt(event.target.value);
    thresholdValue.textContent = currentThreshold;
    
    if (originalImage) {
        applyFilter();
    }
}

/**
 * Calculate luminance from RGB values
 * Uses standard perceptual luminance formula
 */
function getLuminance(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}

/**
 * Apply neon green dungeon filter to the image
 */
function applyFilter() {
    if (!originalImage) return;
    
    // Draw original image to canvas
    ctx.drawImage(originalImage, 0, 0);
    
    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Process each pixel
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        
        // Calculate luminance
        const luminance = getLuminance(r, g, b);
        
        // Apply threshold
        // Threshold 0 = full black, Threshold 255 = full green
        // Lower luminance pixels become green first as threshold increases
        if (luminance < currentThreshold) {
            // Below threshold → Neon green
            data[i] = NEON_GREEN.r;
            data[i + 1] = NEON_GREEN.g;
            data[i + 2] = NEON_GREEN.b;
        } else {
            // Above threshold → Black
            data[i] = BLACK.r;
            data[i + 1] = BLACK.g;
            data[i + 2] = BLACK.b;
        }
        // Alpha channel (data[i + 3]) remains unchanged
    }
    
    // Put processed image data back to canvas
    ctx.putImageData(imageData, 0, 0);
}

/**
 * Download the filtered image as PNG
 */
function downloadImage() {
    if (!originalImage) return;
    
    canvas.toBlob(function(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        const timestamp = new Date().getTime();
        
        link.download = `loot-survivor-${timestamp}.png`;
        link.href = url;
        link.click();
        
        // Clean up
        URL.revokeObjectURL(url);
    }, 'image/png');
}

/**
 * Share to X (Twitter)
 */
async function shareToX() {
    if (!originalImage) return;
    
    try {
        // Convert canvas to blob
        canvas.toBlob(async function(blob) {
            const shareText = 'Check out my Loot Survivor filtered image! 🎮⚔️\n\nGet yours now: https://survivalleavesamark.vercel.app/';
            
            try {
                // Try to copy image to clipboard
                await navigator.clipboard.write([
                    new ClipboardItem({
                        'image/png': blob
                    })
                ]);
                
                // Show success message
                alert('✅ Image copied to clipboard!\n\nPaste it in your X post.');
                
            } catch (clipboardErr) {
                // If clipboard fails, just show a message
                console.log('Clipboard API not available');
                alert('📸 Ready to share!\n\nYour filtered image will open in a new tab.');
            }
            
            // Always open X compose window with the pre-written text
            const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
            window.open(twitterUrl, '_blank', 'width=550,height=420');
            
        }, 'image/png');
    } catch (err) {
        console.error('Share failed:', err);
        alert('Unable to copy image. Please use the Download button instead.');
    }
}

/**
 * Reset the app to initial state
 */
function resetApp() {
    originalImage = null;
    currentThreshold = 15;
    thresholdSlider.value = 15;
    thresholdValue.textContent = 15;
    imageUpload.value = '';
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Reset UI
    controls.style.display = 'none';
    canvasSection.style.display = 'none';
    placeholder.style.display = 'block';
}
