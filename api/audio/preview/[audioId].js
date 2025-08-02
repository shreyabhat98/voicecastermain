// api/audio/preview/[audioId].js - FIXED VERSION

export default function handler(req, res) {
  const { audioId } = req.query;
  const { audio } = req.query; // Direct audio URL from Supabase
  const { preview } = req.query; // Preview image URL from Supabase
  
  if (!audio) {
    return res.status(400).json({ error: 'Audio URL required' });
  }
  
  const wrapperUrl = `https://${req.headers.host}/api/audio/preview/${audioId}?audio=${encodeURIComponent(audio)}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}`;
  
  // 🎯 FIXED: Use preview image if available, otherwise generate one
  const previewImageUrl = preview || `https://${req.headers.host}/api/audio/${audioId}`;
  
  // 🎯 REDIRECT real users to mini app
  const miniAppUrl = `https://${req.headers.host}/play/${audioId}?audio=${encodeURIComponent(audio)}${preview ? `&preview=${encodeURIComponent(preview)}` : ''}`;
  
  // Detect if this is a social media crawler vs real user
  const userAgent = req.headers['user-agent'] || '';
  const isCrawler = /bot|crawler|spider|crawling|facebookexternalhit|twitterbot|linkedinbot|farcaster/i.test(userAgent);
  
  if (isCrawler) {
    // 🎯 FOR CRAWLERS: Serve meta tags for beautiful preview
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
    
    <!-- Preview image for social media -->
    <meta property="og:image" content="${previewImageUrl}" />
    <meta property="og:image:width" content="640" />
    <meta property="og:image:height" content="640" />
    
    <!-- Twitter Card tags -->
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="🎤 Voice Message via VoiceCaster" />
    <meta name="twitter:description" content="Listen to this voice message created with VoiceCaster" />
    <meta name="twitter:image" content="${previewImageUrl}" />
    
    <!-- Farcaster Frame Meta Tags -->
    <meta property="fc:frame" content="vNext" />
    <meta property="fc:frame:image" content="${previewImageUrl}" />
    <meta property="fc:frame:image:aspect_ratio" content="1:1" />
    <meta property="fc:frame:button:1" content="Open Voice Message" />
    <meta property="fc:frame:button:1:action" content="link" />
    <meta property="fc:frame:button:1:target" content="${miniAppUrl}" />
    <meta property="fc:frame:button:2" content="Create Your Own" />
    <meta property="fc:frame:button:2:action" content="link" />
    <meta property="fc:frame:button:2:target" content="https://${req.headers.host}" />
    
    <title>🎤 Voice Message via VoiceCaster</title>
</head>
<body>
    <div style="font-family: Arial, sans-serif; text-align: center; padding: 50px; background: linear-gradient(135deg, #a855f7, #9333ea); color: white; min-height: 100vh;">
        <h1>🎤 Voice Message</h1>
        <p>Redirecting to VoiceCaster...</p>
        <script>
            // Auto-redirect real users who somehow end up here
            setTimeout(() => {
                window.location.href = "${miniAppUrl}";
            }, 1000);
        </script>
    </div>
</body>
</html>`;

    res.setHeader('Content-Type', 'text/html');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.status(200).send(html);
    
  } else {
    // 🎯 FOR REAL USERS: Redirect to mini app immediately
    res.redirect(302, miniAppUrl);
  }
}