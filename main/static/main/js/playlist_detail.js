// Playlist detail page functionality

document.addEventListener('DOMContentLoaded', () => {
    initializePlaylistDetail();
});

function initializePlaylistDetail() {
    // Initialize view toggle
    initializeViewToggle();
    
    // Initialize export functionality
    initializeExport();
    
    // Initialize video interactions
    initializeVideoInteractions();
    
    // Initialize modal functionality
    initializeModal();
    
    // Initialize keyboard shortcuts
    initializeKeyboardShortcuts();
}

// View toggle functionality
function initializeViewToggle() {
    const toggleBtn = document.getElementById('toggle-view');
    const videosContainer = document.getElementById('videos-container');
    
    if (toggleBtn && videosContainer) {
        toggleBtn.addEventListener('click', () => {
            const isListView = videosContainer.classList.contains('list-view');
            
            if (isListView) {
                videosContainer.classList.remove('list-view');
                toggleBtn.innerHTML = '<i class="fas fa-th-list"></i> List View';
            } else {
                videosContainer.classList.add('list-view');
                toggleBtn.innerHTML = '<i class="fas fa-th"></i> Grid View';
            }
            
            // Save preference
            localStorage.setItem('playlist-view', isListView ? 'grid' : 'list');
        });
        
        // Load saved preference
        const savedView = localStorage.getItem('playlist-view');
        if (savedView === 'list') {
            videosContainer.classList.add('list-view');
            toggleBtn.innerHTML = '<i class="fas fa-th"></i> Grid View';
        }
    }
}

// Export functionality
function initializeExport() {
    const exportBtn = document.getElementById('export-summaries');
    
    if (exportBtn) {
        exportBtn.addEventListener('click', exportSummaries);
    }
}

async function exportSummaries() {
    const playlistTitle = document.querySelector('.playlist-title').textContent.trim();
    const videoCards = document.querySelectorAll('.video-card');
    
    let exportText = `${playlistTitle}\n`;
    exportText += '='.repeat(playlistTitle.length) + '\n\n';
    
    videoCards.forEach((card, index) => {
        const title = card.querySelector('.video-title').textContent.trim();
        const summaryElement = card.querySelector('.summary-content p');
        const summary = summaryElement ? summaryElement.textContent.trim() : 'No summary available';
        
        exportText += `${index + 1}. ${title}\n`;
        exportText += '-'.repeat(title.length + 3) + '\n';
        exportText += `${summary}\n\n`;
    });
    
    // Create and download file
    const blob = new Blob([exportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${playlistTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_summaries.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast.show('Summaries exported successfully!', 'success');
}

// Video interactions
function initializeVideoInteractions() {
    // Initialize summary toggles
    document.querySelectorAll('.toggle-summary').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const videoId = e.target.closest('.video-card').dataset.videoId;
            toggleSummary(videoId);
        });
    });
    
    // Initialize lazy loading for thumbnails
    initializeLazyLoading();
    
    // Initialize video hover effects
    initializeVideoHoverEffects();
}

function toggleSummary(videoId) {
    const summaryContent = document.getElementById(`summary-${videoId}`);
    const toggleBtn = summaryContent.parentElement.querySelector('.toggle-summary');
    
    if (summaryContent.classList.contains('collapsed')) {
        summaryContent.classList.remove('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-up"></i>';
    } else {
        summaryContent.classList.add('collapsed');
        toggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
    }
}

function initializeLazyLoading() {
    const images = document.querySelectorAll('.video-thumbnail img[loading="lazy"]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.src; // Trigger loading
                    img.classList.add('loaded');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    }
}

function initializeVideoHoverEffects() {
    document.querySelectorAll('.video-card').forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-3px)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// Modal functionality
function initializeModal() {
    const modal = document.getElementById('transcript-modal');
    
    if (modal) {
        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
        
        // Close modal with escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
                closeModal();
            }
        });
    }
}

async function viewTranscript(videoId) {
    const modal = document.getElementById('transcript-modal');
    const transcriptContent = document.getElementById('transcript-content');
    
    if (!modal || !transcriptContent) return;
    
    // Show loading in modal
    transcriptContent.innerHTML = `
        <div class="loading">
            <div class="spinner"></div>
            <p>Loading transcript...</p>
        </div>
    `;
    
    utils.show(modal);
    
    try {
        // Fetch transcript from API
        const response = await utils.apiRequest(`/api/videos/${videoId}/`);
        
        if (response.full_transcript) {
            transcriptContent.innerHTML = `<pre>${response.full_transcript}</pre>`;
        } else {
            transcriptContent.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-file-text"></i>
                    <h3>No Transcript Available</h3>
                    <p>This video doesn't have a transcript or it couldn't be extracted.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error loading transcript:', error);
        transcriptContent.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle"></i>
                Failed to load transcript. Please try again.
            </div>
        `;
    }
}

function closeModal() {
    const modal = document.getElementById('transcript-modal');
    if (modal) {
        utils.hide(modal);
    }
}

// Utility functions for video interactions
function openVideo(url) {
    window.open(url, '_blank');
}

async function copyToClipboard(text) {
    try {
        const success = await utils.copyToClipboard(text);
        if (success) {
            toast.show('Summary copied to clipboard!', 'success');
        } else {
            toast.show('Failed to copy to clipboard', 'error');
        }
    } catch (error) {
        console.error('Copy failed:', error);
        toast.show('Failed to copy to clipboard', 'error');
    }
}

// Keyboard shortcuts
function initializeKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Don't trigger shortcuts when typing in inputs
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        switch (e.key) {
            case 'v':
                // Toggle view
                document.getElementById('toggle-view')?.click();
                break;
                
            case 'e':
                // Export summaries
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    document.getElementById('export-summaries')?.click();
                }
                break;
                
            case 'Escape':
                // Close modal
                closeModal();
                break;
                
            case 'ArrowDown':
            case 'ArrowUp':
                // Navigate between videos
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    navigateVideos(e.key === 'ArrowDown' ? 1 : -1);
                }
                break;
        }
    });
}

function navigateVideos(direction) {
    const videoCards = Array.from(document.querySelectorAll('.video-card'));
    const currentIndex = videoCards.findIndex(card => card.classList.contains('focused'));
    
    // Remove current focus
    videoCards.forEach(card => card.classList.remove('focused'));
    
    // Calculate new index
    let newIndex = currentIndex + direction;
    if (newIndex < 0) newIndex = videoCards.length - 1;
    if (newIndex >= videoCards.length) newIndex = 0;
    
    // Focus new card
    const newCard = videoCards[newIndex];
    newCard.classList.add('focused');
    newCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// Search functionality
function initializeSearch() {
    const searchInput = document.createElement('input');
    searchInput.type = 'text';
    searchInput.placeholder = 'Search videos...';
    searchInput.className = 'search-input';
    
    const playlistHeader = document.querySelector('.playlist-header');
    if (playlistHeader) {
        playlistHeader.appendChild(searchInput);
        
        searchInput.addEventListener('input', utils.debounce((e) => {
            filterVideos(e.target.value);
        }, 300));
    }
}

function filterVideos(searchTerm) {
    const videoCards = document.querySelectorAll('.video-card');
    const term = searchTerm.toLowerCase();
    
    videoCards.forEach(card => {
        const title = card.querySelector('.video-title').textContent.toLowerCase();
        const summary = card.querySelector('.summary-content p')?.textContent.toLowerCase() || '';
        
        const matches = title.includes(term) || summary.includes(term);
        card.style.display = matches ? '' : 'none';
    });
}

// Performance optimization
function optimizePerformance() {
    // Virtualize long lists if needed
    const videoCards = document.querySelectorAll('.video-card');
    
    if (videoCards.length > 50) {
        // Implement virtual scrolling for large playlists
        console.log('Large playlist detected, consider implementing virtual scrolling');
    }
    
    // Lazy load video thumbnails
    initializeLazyLoading();
}

// Initialize everything
document.addEventListener('DOMContentLoaded', () => {
    initializePlaylistDetail();
    optimizePerformance();
    
    // Add search if there are many videos
    const videoCount = document.querySelectorAll('.video-card').length;
    if (videoCount > 10) {
        initializeSearch();
    }
});

// Add focus styles
const focusStyles = document.createElement('style');
focusStyles.textContent = `
    .video-card.focused {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
    }
    
    .search-input {
        padding: 0.5rem;
        border: 1px solid var(--border-color);
        border-radius: var(--border-radius);
        margin-left: 1rem;
        max-width: 200px;
    }
    
    .search-input:focus {
        outline: none;
        border-color: var(--primary-color);
        box-shadow: 0 0 0 2px rgba(102, 126, 234, 0.1);
    }
`;
document.head.appendChild(focusStyles);

// Export functions for global use
window.toggleSummary = toggleSummary;
window.viewTranscript = viewTranscript;
window.closeModal = closeModal;
window.openVideo = openVideo;
window.copyToClipboard = copyToClipboard; 