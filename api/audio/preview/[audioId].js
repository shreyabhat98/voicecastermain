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
    <meta property="fc:frame:button:1:target" content="https://${req.headers.host}" />
    <meta property="fc:frame:button:2" content="Create Voice Message" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://${req.headers.host}" />
    
    <title>${pageTitle} via VoiceCaster</title>
    
    <style>
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
      
      .speaker-icon {
        position: absolute;
        top: 20px;
        right: 20px;
        font-size: 20px;
        opacity: 0.7;
      }
      
      .voice-card {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 24px;
        padding: 40px;
        backdrop-filter: blur(16px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 400px;
        width: 90%;
        text-align: center;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
        position: relative;
      }
      
      .header-text {
        font-size: 1.5rem;
        font-weight: 600;
        margin-bottom: 30px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      
      .audio-player {
        background: rgba(255, 255, 255, 0.05);
        border-radius: 20px;
        padding: 30px;
        margin-bottom: 30px;
        border: 1px solid rgba(255, 255, 255, 0.1);
      }
      
      .profile-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.1);
        margin: 0 auto 20px;
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
      
      .audio-info {
        display: flex;
        justify-content: flex-end; /* Move to bottom right */
        align-items: center;
        margin-top: 15px;
        font-size: 0.9rem;
        opacity: 0.8;
      }
      
      .custom-time-display {
        color: white;
        font-size: 0.95em;
        font-variant-numeric: tabular-nums;
        margin-left: 10px;
        background: rgba(0,0,0,0.18);
        border-radius: 6px;
        padding: 2px 8px;
        letter-spacing: 0.5px;
        user-select: none;
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
      }
      
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 25px rgba(0, 0, 0, 0.3);
      }
      
      @media (max-width: 768px) {
        .voice-card {
          padding: 25px;
          margin: 20px;
        }
        .header-text {
          font-size: 1.25rem;
        }
        .profile-circle {
          width: 100px;
          height: 100px;
          font-size: 40px;
        }
      }
    </style>
</head>
<body>
    <div class="voice-card">
        <div class="speaker-icon"></div>
        <div class="header-text">${pageTitle}</div>
        
        <div class="audio-player">
            <div class="profile-circle" id="profileCircle" onclick="toggleAudio()">
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
                `}
                <div class="play-overlay">
                    <div class="play-button"></div>
                </div>
            </div>
            
            <audio controls preload="auto" id="audioPlayer" webkit-playsinline playsinline>
                <source src="${audio}" type="audio/mpeg">
                <source src="${audio}" type="audio/mp4">
                <source src="${audio}" type="audio/wav">
                <source src="${audio}" type="audio/webm">
                Your browser does not support the audio element.
            </audio>
            
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
                    <path
                      d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                      fill="currentColor"
                    />
                    <path
                      d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
                      fill="currentColor"
                    />
                    <path
                      d="M12 19V22H8V24H16V22H12V19Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span>Voice</span>
                  <span class="custom-time-display" id="customTime">0:00 / --:--</span>
                </div>
            </div>
        </div>
        
        <a href="/" class="cta-button">Create your own voice message</a>
    </div>
    
    <script>
        const audio = document.getElementById('audioPlayer');
        const profileCircle = document.querySelector('.profile-circle');
        const customTime = document.getElementById('customTime');
        
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
        audio.addEventListener('timeupdate', updateCustomTime);
        audio.addEventListener('loadedmetadata', updateCustomTime);
        audio.addEventListener('ended', updateCustomTime);
        // Initial update
        updateCustomTime();
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(html);
}