export default function handler(req, res) {
  const { videoId } = req.query;
  const { video } = req.query; // Direct video URL from Supabase
  
  if (!video) {
    return res.status(400).json({ error: 'Video URL required' });
  }
  
  const wrapperUrl = `https://${req.headers.host}/api/video/${videoId}?video=${encodeURIComponent(video)}`;
  
  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    
    <!-- Required Open Graph tags for video embedding -->
    <meta property="og:title" content="🎤 Voice Cast via VoiceCaster" />
    <meta property="og:type" content="video.other" />
    <meta property="og:description" content="Listen to this voice recording created with VoiceCaster" />
    <meta property="og:url" content="${wrapperUrl}" />
    <meta property="og:site_name" content="VoiceCaster" />
    
    <!-- Video-specific Open Graph tags -->
    <meta property="og:video" content="${video}" />
    <meta property="og:video:url" content="${video}" />
    <meta property="og:video:secure_url" content="${video}" />
    <meta property="og:video:type" content="video/webm" />
    <meta property="og:video:width" content="640" />
    <meta property="og:video:height" content="360" />
    
    <!-- Fallback image (you can replace with your own thumbnail) -->
    <meta property="og:image" content="https://via.placeholder.com/640x360/8B5CF6/FFFFFF?text=🎤+Voice+Cast" />
    <meta property="og:image:width" content="640" />
    <meta property="og:image:height" content="360" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="player" />
    <meta name="twitter:title" content="🎤 Voice Cast via VoiceCaster" />
    <meta name="twitter:description" content="Listen to this voice recording created with VoiceCaster" />
    <meta name="twitter:image" content="https://via.placeholder.com/640x360/8B5CF6/FFFFFF?text=🎤+Voice+Cast" />
    <meta name="twitter:player" content="${video}" />
    <meta name="twitter:player:width" content="640" />
    <meta name="twitter:player:height" content="360" />
    
    <title>🎤 Voice Cast via VoiceCaster</title>
    
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
        margin: 0;
        padding: 50px 20px;
        text-align: center;
        background: linear-gradient(135deg, #8B5CF6, #3B82F6);
        color: white;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
      }
      .container {
        background: rgba(255, 255, 255, 0.1);
        border-radius: 20px;
        padding: 40px;
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        max-width: 700px;
        width: 100%;
      }
      h1 {
        font-size: 2.5rem;
        margin-bottom: 10px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
      }
      p {
        font-size: 1.1rem;
        margin-bottom: 30px;
        opacity: 0.9;
      }
      video {
        max-width: 100%;
        width: 640px;
        border-radius: 12px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        margin-bottom: 30px;
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
        .container {
          padding: 20px;
          margin: 10px;
        }
        h1 {
          font-size: 2rem;
        }
        video {
          width: 100%;
        }
      }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎤 Voice Cast</h1>
        <p>Created with VoiceCaster</p>
        <video controls preload="metadata">
            <source src="${video}" type="video/webm">
            <source src="${video}" type="video/mp4">
            Your browser does not support the video tag.
        </video>
        <br>
        <a href="/" class="cta-button">Create your own voice cast</a>
    </div>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
  res.status(200).send(html);
}