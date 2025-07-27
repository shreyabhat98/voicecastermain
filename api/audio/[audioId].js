export default function handler(req, res) {
    const { audioId } = req.query;
    const { audio } = req.query; // Direct audio URL from Supabase
    
    if (!audio) {
      return res.status(400).json({ error: 'Audio URL required' });
    }
    
    const wrapperUrl = `https://${req.headers.host}/api/audio/${audioId}?audio=${encodeURIComponent(audio)}`;
    
    const html = `
  <!DOCTYPE html>
  <html lang="en">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      
      <!-- Required Open Graph tags for audio embedding -->
      <meta property="og:title" content="🎤 Voice Message via VoiceCaster" />
      <meta property="og:type" content="website" />
      <meta property="og:description" content="Listen to this voice message created with VoiceCaster" />
      <meta property="og:url" content="${wrapperUrl}" />
      <meta property="og:site_name" content="VoiceCaster" />
      
      <!-- Audio-specific Open Graph tags -->
      <meta property="og:audio" content="${audio}" />
      <meta property="og:audio:url" content="${audio}" />
      <meta property="og:audio:secure_url" content="${audio}" />
      <meta property="og:audio:type" content="audio/wav" />
      
      <!-- Enhanced preview image that looks like VoiceMessageCard -->
      <meta property="og:image" content="https://${req.headers.host}/api/preview/${audioId}" />
      <meta property="og:image:width" content="640" />
      <meta property="og:image:height" content="640" />
      
      <!-- Twitter Card tags -->
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content="🎤 Voice Message via VoiceCaster" />
      <meta name="twitter:description" content="Listen to this voice message created with VoiceCaster" />
      <meta name="twitter:image" content="https://${req.headers.host}/api/preview/${audioId}" />
      
      <!-- Farcaster Frame Meta Tags -->
      <meta property="fc:frame" content="vNext" />
      <meta property="fc:frame:image" content="https://${req.headers.host}/api/preview/${audioId}" />
      <meta property="fc:frame:image:aspect_ratio" content="1:1" />
      <meta property="fc:frame:button:1" content="🔊 Play Audio" />
      <meta property="fc:frame:button:1:action" content="link" />
      <meta property="fc:frame:button:1:target" content="${audio}" />
      <meta property="fc:frame:button:2" content="Create Voice Message" />
      <meta property="fc:frame:button:2:action" content="link" />
      <meta property="fc:frame:button:2:target" content="https://${req.headers.host}" />
      
      <title>🎤 Voice Message via VoiceCaster</title>
      
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
          position: relative;
        }
        
        .speaker-icon {
          position: absolute;
          top: 20px;
          right: 20px;
          font-size: 20px;
          opacity: 0.7;
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
        
        .direct-link {
          margin-top: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .direct-link a {
          color: #60a5fa;
          text-decoration: none;
          word-break: break-all;
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
          <div class="speaker-icon">🔊</div>
          <div class="header-text">🎤 Voice Message</div>
          
          <div class="audio-player">
              <div class="profile-circle" onclick="toggleAudio()">
                  🎤
                  <div class="play-overlay">
                      <div class="play-button"></div>
                  </div>
              </div>
              
              <audio id="audioPlayer" controls preload="metadata">
                  <source src="${audio}" type="audio/wav">
                  <source src="${audio}" type="audio/webm">
                  <source src="${audio}" type="audio/mp4">
                  Your browser does not support the audio element.
              </audio>
              
              <div class="audio-info">
                  <span>🔊</span>
                  <span>Voice</span>
              </div>
          </div>
          
          <a href="/" class="cta-button">Create your own voice message</a>
          
          <div class="direct-link">
              <small style="opacity: 0.7;">Direct audio link:</small><br>
              <a href="${audio}" target="_blank">${audio}</a>
          </div>
      </div>
      
      <script>
          const audio = document.getElementById('audioPlayer');
          const profileCircle = document.querySelector('.profile-circle');
          
          function toggleAudio() {
              if (audio.paused) {
                  audio.play();
              } else {
                  audio.pause();
              }
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
          
          // Add CSS animation
          const style = document.createElement('style');
          style.textContent = \`
              @keyframes pulse {
                  0%, 100% { transform: scale(1); opacity: 1; }
                  50% { transform: scale(1.05); opacity: 0.8; }
              }
          \`;
          document.head.appendChild(style);
          
          // Auto-play functionality (if allowed by browser)
          audio.addEventListener('loadedmetadata', () => {
              // Most browsers block auto-play, but we can try
              audio.play().catch(() => {
                  console.log('Auto-play blocked by browser');
              });
          });
      </script>
  </body>
  </html>`;
  
    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
    res.status(200).send(html);
  }