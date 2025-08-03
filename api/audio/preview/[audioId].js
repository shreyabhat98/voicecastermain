export default function handler(req, res) {
  const { audioId } = req.query;
  const { audio } = req.query; // Direct audio URL from Supabase
  const { preview } = req.query; // Preview image URL from Supabase
  const { avatar } = req.query; // NEW: Profile avatar URL
  const { username } = req.query; // NEW: Username
  const { name } = req.query; // NEW: Display name
  
  if (!audio) {
    return res.status(400).json({ error: 'Audio URL required' });
  }
  
  const wrapperUrl = `https://${req.headers.host}/api/audio/preview/${audioId}?audio=${encodeURIComponent(audio)}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}${avatar ? `&avatar=${encodeURIComponent(avatar)}` : ''}`;
  
  let pageTitle = '🎤 Voice Message';
  if (name) {
    pageTitle = `🎤 Voice message from ${name}`;
  } else if (username) {
    pageTitle = `🎤 Voice message from @${username}`;
  }
  
  // Use preview image if available, otherwise fallback to placeholder
  const previewImageUrl = preview || 'https://via.placeholder.com/640x640/8B5CF6/FFFFFF?text=Voice+Message';
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Required Open Graph tags for audio embedding -->
    <meta property="og:title" content="Voice Message via VoiceCaster" />
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
    <meta name="twitter:title" content="Voice Message via VoiceCaster" />
    <meta name="twitter:description" content="Listen to this voice message created with VoiceCaster" />
    <meta name="twitter:image" content="${previewImageUrl}" />
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${previewImageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="Open in App" />
    <meta property="fc:frame:button:1:action" content="launch_frame" />
    <meta property="fc:frame:button:1:target" content="https://${req.headers.host}" />
    
    <title>Voice Message via VoiceCaster</title>
    
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
      }
      
      .profile-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        border-radius: 50%;
      }
      
      .mic-fallback {
        width: 48px;
        height: 48px;
        color: white;
      }
      
      audio {
        width: 100%;
        margin-top: 20px;
        border-radius: 12px;
      }
      
      .audio-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 15px;
        font-size: 0.9rem;
        opacity: 0.8;
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
        <div class="header-text">Voice Message</div>
        
        <div class="audio-player">
            <div class="profile-circle" id="profileCircle">
                ${avatar ? `<img src="${avatar}" alt="Profile" class="profile-image" onerror="showMicFallback()" />` : `
                <svg 
                  width="48" 
                  height="48" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                  class="mic-fallback"
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
                `}
            </div>
            
            <audio controls preload="none" id="audioPlayer" webkit-playsinline playsinline>
                <source src="${audio}" type="audio/wav">
                <source src="${audio}" type="audio/mpeg">
                <source src="${audio}" type="audio/mp4">
                <source src="${audio}" type="audio/webm">
                Your browser does not support the audio element.
            </audio>
            
            <div class="audio-info">
                <span></span>
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
                </div>
            </div>
        </div>
        
        <a href="/" class="cta-button">Create your own voice message</a>
    </div>
    
    <script>
        // Function to show mic fallback if profile image fails
        function showMicFallback() {
            const profileCircle = document.getElementById('profileCircle');
            if (profileCircle) {
                profileCircle.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" class="mic-fallback">' +
                  '<path d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z" fill="currentColor" />' +
                  '<path d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z" fill="currentColor" />' +
                  '<path d="M12 19V22H8V24H16V22H12V19Z" fill="currentColor" />' +
                '</svg>';
            }
        }
        
        // Auto-play functionality (if allowed by browser)
        const audio = document.querySelector('audio');
        
        // Safari-specific audio handling
        const audio = document.getElementById('audioPlayer');
        const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
        let isErrorLooping = false;
        let audioLoaded = false;
        
        if (isSafari) {
            console.log('Safari detected - using Safari-specific audio handling');
            
            // Remove crossorigin for Safari
            audio.removeAttribute('crossorigin');
            
            // Force load audio when user first interacts with ANY part of the page
            const forceLoadAudio = () => {
                if (!audioLoaded) {
                    console.log('Safari: Force loading audio...');
                    audio.load();
                    audioLoaded = true;
                }
            };
            
            // Add click listeners to trigger audio loading
            document.addEventListener('click', forceLoadAudio, { once: true });
            document.addEventListener('touchstart', forceLoadAudio, { once: true });
            
            // Also try to load when audio controls are clicked
            audio.addEventListener('click', forceLoadAudio);
            audio.addEventListener('play', () => {
                if (!audioLoaded) {
                    forceLoadAudio();
                    // Try to play again after loading
                    setTimeout(() => {
                        audio.play().catch(err => console.log('Safari delayed play failed:', err));
                    }, 100);
                }
            });
        }
        
        // Override the play button behavior for Safari
        const playButton = audio.querySelector('button, [role="button"]') || audio;
        
        // Custom play function that ensures loading first
        const safePlay = () => {
            console.log('Safe play triggered');
            
            if (isSafari && (!audioLoaded || audio.readyState < 2)) {
                console.log('Safari: Loading audio before play...');
                audio.load();
                
                // Wait for audio to be ready, then play
                const tryPlay = () => {
                    if (audio.readyState >= 2) {
                        console.log('Safari: Audio ready, playing...');
                        audio.play().catch(err => {
                            console.log('Safari play failed:', err);
                        });
                    } else {
                        console.log('Safari: Waiting for audio to load...');
                        setTimeout(tryPlay, 100);
                    }
                };
                
                audio.addEventListener('canplay', tryPlay, { once: true });
                setTimeout(tryPlay, 500); // Fallback timeout
                
            } else {
                // Non-Safari or already loaded
                audio.play().catch(err => {
                    console.log('Play failed:', err);
                });
            }
        };
        
        // Intercept clicks on the audio element for Safari
        audio.addEventListener('click', (e) => {
            if (isSafari && e.target === audio) {
                e.preventDefault();
                safePlay();
            }
        });
        
        // Prevent error loops (especially on Safari)
        audio.addEventListener('error', (e) => {
            if (isErrorLooping) return;
            isErrorLooping = true;
            console.error('Audio error:', e);
            
            if (isSafari) {
                console.log('Safari audio error - trying to reload...');
                // Reset and try again
                audioLoaded = false;
                setTimeout(() => {
                    audio.load();
                    audioLoaded = true;
                }, 1000);
            }
            
            // Show user-friendly error message after multiple failures
            setTimeout(() => {
                if (isErrorLooping) {
                    const audioContainer = audio.parentElement;
                    audioContainer.innerHTML =
                        '<div style="padding: 20px; text-align: center; color: rgba(255,255,255,0.8);">' +
                        '<p>🎵 ' + (isSafari ? 'Audio needs manual activation' : 'Audio temporarily unavailable') + '</p>' +
                        '<button onclick="window.open(\'' + audio.src + '\', \'_blank\')" ' +
                        'style="background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: white; padding: 10px 20px; border-radius: 8px; margin-top: 10px; cursor: pointer;">' +
                        '📱 Open Audio File' +
                        '</button>' +
                        '</div>';
                }
            }, 3000);
        });
        
        // Success handlers
        audio.addEventListener('canplay', () => {
            console.log('Audio can play');
            isErrorLooping = false;
            audioLoaded = true;
        });
        
        audio.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
            audioLoaded = true;
        });
        
        // Visual feedback
        audio.addEventListener('play', () => {
            if (!isErrorLooping) {
                console.log('Audio started playing');
                document.querySelector('.profile-circle').style.animation = 'pulse 1s infinite';
            }
        });
        
        audio.addEventListener('pause', () => {
            document.querySelector('.profile-circle').style.animation = 'none';
        });
        
        audio.addEventListener('ended', () => {
            document.querySelector('.profile-circle').style.animation = 'none';
        });
        
        // Force load when user clicks profile circle (additional Safari workaround)
        document.querySelector('.profile-circle').addEventListener('click', () => {
            safePlay();
        });
        
        // Add CSS animation
        const style = document.createElement('style');
        style.textContent = \`
            @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
            }
        \`;
        document.head.appendChild(style);
    </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(html);
}