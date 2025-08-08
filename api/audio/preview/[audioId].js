export default function handler(req, res) {
  const { audioId } = req.query;
  const { audio } = req.query; // Direct audio URL from Supabase
  const { preview } = req.query; // Preview image URL from Supabase
  const { avatar } = req.query; // Profile avatar URL
  const { username } = req.query; // Username
  const { name } = req.query; // Display name
  
  if (!audio) {
    return res.status(400).json({ error: 'Audio URL required' });
  }
  
  // Create dynamic title based on available user info
  let pageTitle = 'Voice Message';
  if (name) {
    pageTitle = `Voice message from ${name}`;
  } else if (username) {
    pageTitle = `Voice message from @${username}`;
  }
  
  // Build wrapper URL with ALL parameters
  const wrapperUrl = `https://${req.headers.host}/api/audio/${audioId}?audio=${encodeURIComponent(audio)}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}${username ? `&username=${encodeURIComponent(username)}` : ''}${name ? `&name=${encodeURIComponent(name)}` : ''}`;
  
  // Use preview image if available, otherwise fallback to placeholder
  const previewImageUrl = preview || 'https://via.placeholder.com/640x640/8B5CF6/FFFFFF?text=Voice+Message';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Required Open Graph tags for audio embedding -->
    <meta property="og:title" content="${pageTitle} via VoiceCaster" />
    <meta property="og:type" content="website" />
    <meta property="og:description" content="Listen to this voice message created with VoiceCaster" />
    <meta property="og:url" content="${wrapperUrl}" />
    <meta property="og:site_name" content="VoiceCaster" />
    
    <!-- Audio-specific Open Graph tags -->
    <meta property="og:audio" content="${audio}" />
    <meta property="og:audio:url" content="${audio}" />
    <meta property="og:audio:secure_url" content="${audio}" />
    <meta property="og:audio:type" content="audio/wav" />
    
    <!-- Preview image -->
    <meta property="og:image" content="${previewImageUrl}" />
    <meta property="og:image:width" content="640" />
    <meta property="og:image:height" content="640" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${pageTitle} via VoiceCaster" />
    <meta name="twitter:description" content="Listen to this voice message created with VoiceCaster" />
    <meta name="twitter:image" content="${previewImageUrl}" />
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${previewImageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="Play Audio" />
    <meta property="fc:frame:button:1:action" content="launch_frame" />
    <meta property="fc:frame:button:1:target" content="https://${req.headers.host}/?audio=${encodeURIComponent(audio)}&autoplay=true" />
    <meta property="fc:frame:button:2" content="Create Voice Message" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://${req.headers.host}" />
    
    <title>${pageTitle} via VoiceCaster</title>
    
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        margin: 0;
        padding: 0;
        background: linear-gradient(135deg, #a855f7, #9333ea);
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .voice-card {
        background: rgba(255, 255, 255, 0.1); 
        border-radius: 24px;
        padding: 72px 16px 24px 16px;
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        width: 90%;
        max-width: 420px;
        min-width: 220px;
        min-height: 220px;
        text-align: center;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        position: relative;
        margin: 32px auto 20px auto;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: stretch;
      }
      .header-text {
        font-size: 1.3rem;
        font-weight: 600;
        margin-bottom: 32px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
        text-align: center;
      }
      .audio-player {
        position: relative;
        min-height: 140px;
        width: 100%;
        margin-bottom: 12px;
        height: 180px;
        display: flex;
        flex-direction: column;
        justify-content: flex-start;
        align-items: center;
      }
      .profile-spacer {
        height: 60px;
        flex-shrink: 0;
      }
      .profile-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 auto;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 48px;
        border: 3px solid rgba(255, 255, 255, 0.3);
        position: relative;
        overflow: hidden;
        cursor: pointer;
        transition: transform 0.2s ease;
      }
      
      .profile-circle:hover {
        transform: scale(1.05);
      }
      
      .play-overlay {
        position: absolute;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(0, 0, 0, 0.3);
        border-radius: 50%;
        opacity: 0;
        transition: opacity 0.2s ease;
      }
      
      .profile-circle:hover .play-overlay {
        opacity: 1;
      }
      
      .play-button {
        width: 0;
        height: 0;
        border-left: 20px solid white;
        border-top: 12px solid transparent;
        border-bottom: 12px solid transparent;
        margin-left: 6px;
      }
      
      .profile-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      
      .mic-fallback-container {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 50%;
      }
      
      .mic-fallback {
        width: 48px;
        height: 48px;
        color: white;
        fill: white;
        flex-shrink: 0;
      }
      
      audio {
        width: 100%;
        margin-top: 20px;
        border-radius: 12px;
      }
      
      audio::-webkit-media-controls-time-remaining-display,
      audio::-webkit-media-controls-current-time-display {
        display: none !important;
      }
      
      .custom-time-display {
        color: white;
        font-size: 0.95em;
        font-variant-numeric: tabular-nums;
        background: rgba(0,0,0,0.18);
        border-radius: 6px;
        padding: 2px 8px;
        letter-spacing: 0.5px;
        user-select: none;
        position: absolute;
        left: 24px;
        bottom: 6px;
        z-index: 2;
        min-width: 60px;
        text-align: left;
        display: none;
      }
      .audio-info {
        display: flex;
        align-items: center;
        position: absolute;
        right: 24px;
        bottom: 6px;
        font-size: 0.875rem;
        font-weight: 500;
        font-family: 'Inter', system-ui, -apple-system, sans-serif;
        opacity: 0.8;
        z-index: 2;
      }
      .cta-button {
        display: inline-block;
        background: white;
        color: #8B5CF6;
        padding: 15px 30px;
        border-radius: 12px;
        text-decoration: none;
        font-weight: bold;
        font-size: 1.1rem;
        transition: transform 0.2s, box-shadow 0.2s;
        box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        margin: 0 auto 0 auto;
        width: auto;
        max-width: 320px;
        margin-top: 0;
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
      }
      
      @media (max-width: 768px) {
        .voice-card {
          padding: 44px 3vw 12px 3vw;
          margin: 10px 3vw 10px 3vw;
          min-width: 0;
          min-height: 140px;
          max-width: 98vw;
          border-radius: 18px;
        }
        .header-text {
          font-size: 1rem;
          margin-bottom: 18px;
        }
        .audio-player {
          min-height: 90px;
          height: 120px;
        }
        .profile-circle {
          width: 80px;
          height: 80px;
          font-size: 28px;
          margin: 0 auto;
        }
        .custom-time-display {
          left: 12px;
          bottom: 4px;
        }
        .audio-info {
          right: 12px;
          bottom: 4px;
        }
        .cta-button {
          font-size: 1rem;
          padding: 12px 10px;
          margin-top: 12px;
        }
        .profile-spacer {
          height: 24px;
        }
      }
    </style>
</head>
<body>
        <div class="header-text" style="margin-bottom: 18px; text-align: center;">${pageTitle}</div>
        <div class="voice-card">
            <div class="audio-player" style="min-height: 180px; position: relative;">
                <div class="profile-spacer"></div>
                <div class="profile-circle" id="profileCircle" tabindex="0">
                    ${avatar ? `<img src="${avatar}" alt="Profile" class="profile-image" onerror="showMicFallback()" />` : `
                    <div class="mic-fallback-container">
                      <svg 
                        width="48" 
                        height="48" 
                        viewBox="0 0 24 24" 
                        fill="white" 
                        xmlns="http://www.w3.org/2000/svg"
                        class="mic-fallback"
                      >
                        <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12 V4C14 2.9 13.1 2 12 2Z"/>
                        <path d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"/>
                        <path d="M12 19V22H8V24H16V22H12V19Z"/>
                      </svg>
                    </div>
                    `}
                    <div class="play-overlay" id="playOverlay">
                        <div class="play-button" id="playButton"></div>
                    </div>
                </div>
                <audio preload="auto" id="audioPlayer" webkit-playsinline playsinline style="display:none">
                    <source src="${audio}" type="audio/mpeg">
                    <source src="${audio}" type="audio/mp4">
                    <source src="${audio}" type="audio/wav">
                    <source src="${audio}" type="audio/webm">
                </audio>
                <span class="custom-time-display" id="customTime">&mdash; / &mdash;</span>
                <div class="audio-info">
                    <div style="display: flex; align-items: center; gap: 4px;">
                      <svg 
                        width="16" 
                        height="16" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        xmlns="http://www.w3.org/2000/svg"
                        style="color: white;"
                      >
                        <path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor"/>
                        <path d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z" fill="currentColor"/>
                        <path d="M12 19V22H8V24H16V22H12V19Z" fill="currentColor"/>
                      </svg>
                    </div>
                </div>
            </div>
        </div>
        <div style="width: 100%; display: flex; justify-content: center;">
          <a href="/" class="cta-button">Create your own voice message</a>
        </div>
    
    <script>
        const audio = document.getElementById('audioPlayer');
        const profileCircle = document.getElementById('profileCircle');
        const playOverlay = document.getElementById('playOverlay');
        const playButton = document.getElementById('playButton');
        const customTime = document.getElementById('customTime');
        let isPlaying = false;
        let metadataLoaded = false;
        let hasInteracted = false;
        
        // Force load audio immediately when page loads
        window.addEventListener('load', () => {
            audio.load();
        });
        
        // Safari-specific fixes (minimal, no seeking hack)
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        if (isSafari) {
            audio.removeAttribute('crossorigin');
            // Only reload if metadata fails to load after a short delay
            setTimeout(() => {
                if (audio.readyState === 0) {
                    audio.load();
                }
            }, 1000);
        }
        
        // Simple toggle function
        function toggleAudio() {
            if (audio.paused) {
                audio.play().catch(() => {});
            } else {
                audio.pause();
            }
        }
        
        // Function to show mic fallback if profile image fails
        function showMicFallback() {
            const profileCircle = document.getElementById('profileCircle');
            profileCircle.innerHTML = \`
                <div class="mic-fallback-container">
                  <svg 
                    width="48" 
                    height="48" 
                    viewBox="0 0 24 24" 
                    fill="white" 
                    xmlns="http://www.w3.org/2000/svg"
                    class="mic-fallback"
                  >
                    <path
                      d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12 V4C14 2.9 13.1 2 12 2Z"
                    />
                    <path
                      d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
                    />
                    <path
                      d="M12 19V22H8V24H16V22H12V19Z"
                    />
                  </svg>
                </div>
                <div class="play-overlay">
                    <div class="play-button"></div>
                </div>
            \`;
        }
        
        // Add visual feedback when playing
        audio.addEventListener('play', () => {
            profileCircle.style.animation = 'pulse 1s infinite';
        });
        
        audio.addEventListener('pause', () => {
            profileCircle.style.animation = 'none';
        });
        
        audio.addEventListener('ended', () => {
            profileCircle.style.animation = 'none';
            audio.currentTime = 0;
            updatePlayUI();
            updateCustomTime();
        });
        
        // Debug logging and fix audio display
        audio.addEventListener('loadstart', () => {
            console.log('Audio load started');
        });
        
        audio.addEventListener('canplay', () => {
            console.log('Audio can play');
        });
        
        audio.addEventListener('loadedmetadata', () => {
            console.log('Audio metadata loaded, duration:', audio.duration);
        });
        
        // Custom time display logic
        function formatTime(seconds) {
            if (!isFinite(seconds) || seconds < 0) return '--:--';
            const m = Math.floor(seconds / 60);
            const s = Math.floor(seconds % 60);
            return \`\${m}:\${s.toString().padStart(2, '0')}\`;
        }
        function updateCustomTime() {
            const cur = audio.currentTime;
            const dur = audio.duration;
            customTime.textContent = \`\${formatTime(cur)} / \${formatTime(dur)}\`;
        }
        function showTimeDisplay() {
            if (!hasInteracted) {
                customTime.style.display = 'inline-block';
                updateCustomTime();
                hasInteracted = true;
            }
        }
        profileCircle.addEventListener('click', showTimeDisplay);
        profileCircle.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                showTimeDisplay();
            }
        });
        audio.addEventListener('loadedmetadata', () => {
            metadataLoaded = true;
            updateCustomTime();
            customTime.style.display = 'inline-block';
        });
        audio.addEventListener('canplay', updateCustomTime);
        // If metadata is already loaded (e.g. from cache), update immediately and show
        if (audio.readyState > 0 && isFinite(audio.duration)) {
            metadataLoaded = true;
            updateCustomTime();
            customTime.style.display = 'inline-block';
        }
        // In updatePlayUI, always update time if visible
        function updatePlayUI() {
            if (audio.paused) {
                playOverlay.style.opacity = 1;
                playButton.style.borderLeft = '20px solid white';
                playButton.style.borderTop = '12px solid transparent';
                playButton.style.borderBottom = '12px solid transparent';
                playButton.style.width = 0;
                playButton.style.height = 0;
                profileCircle.style.animation = 'none';
            } else {
                playOverlay.style.opacity = 0;
                playButton.style.borderLeft = '20px solid white';
                playButton.style.borderTop = '12px solid transparent';
                playButton.style.borderBottom = '12px solid transparent';
                playButton.style.width = 0;
                playButton.style.height = 0;
                profileCircle.style.animation = 'pulse 1s infinite';
                showTimeDisplay();
            }
        }
        function toggleAudio() {
            if (audio.paused) {
                audio.play().catch(() => {});
            } else {
                audio.pause();
            }
        }
        profileCircle.addEventListener('click', toggleAudio);
        profileCircle.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Enter') {
                toggleAudio();
            }
        });
        audio.addEventListener('play', updatePlayUI);
        audio.addEventListener('pause', updatePlayUI);
        // audio.addEventListener('ended', updatePlayUI); // now handled above
        audio.addEventListener('timeupdate', updateCustomTime);
        audio.addEventListener('ended', updateCustomTime);
        // Only show time after first play
        let hasPlayed = false;
        audio.addEventListener('play', () => {
            if (!hasPlayed) {
                customTime.style.display = 'inline-block';
                updateCustomTime();
                hasPlayed = true;
            }
        });
        // Initial UI state
        updatePlayUI();
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(html);
}