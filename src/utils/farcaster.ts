export interface FarcasterFrameData {
  videoUrl: string;
  duration: number;
  message: string;
  userProfile?: {
    username?: string;
    avatar?: string;
  };
}

export const generateFarcasterFrame = (data: FarcasterFrameData) => {
  const { videoUrl, duration, message } = data;

  // This generates the HTML meta tags for Farcaster frame
  const frameHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Voice Cast</title>
  
  <!-- Farcaster Frame Meta Tags -->
  <meta property="fc:frame" content="vNext" />
  <meta property="fc:frame:image" content="${videoUrl}" />
  <meta property="fc:frame:image:aspect_ratio" content="1:1" />
  <meta property="fc:frame:video" content="${videoUrl}" />
  <meta property="fc:frame:button:1" content="🔊 Play Audio" />
  <meta property="fc:frame:button:1:action" content="link" />
  <meta property="fc:frame:button:1:target" content="${videoUrl}" />
  
  <!-- Open Graph Meta Tags -->
  <meta property="og:title" content="Voice Cast - Audio Message" />
  <meta property="og:description" content="${message}" />
  <meta property="og:image" content="${videoUrl}" />
  <meta property="og:video" content="${videoUrl}" />
  <meta property="og:video:type" content="video/webm" />
  <meta property="og:video:width" content="720" />
  <meta property="og:video:height" content="720" />
  
  <!-- Twitter Meta Tags -->
  <meta name="twitter:card" content="player" />
  <meta name="twitter:title" content="Voice Cast - Audio Message" />
  <meta name="twitter:description" content="${message}" />
  <meta name="twitter:image" content="${videoUrl}" />
  <meta name="twitter:player" content="${videoUrl}" />
  <meta name="twitter:player:width" content="720" />
  <meta name="twitter:player:height" content="720" />
</head>
<body>
  <div style="display: flex; justify-content: center; align-items: center; min-height: 100vh; background: linear-gradient(135deg, #a855f7, #6366f1); font-family: Arial, sans-serif;">
    <div style="text-align: center; color: white;">
      <h1>🎤 Voice Cast</h1>
      <p>${message}</p>
      <video controls style="max-width: 400px; border-radius: 12px;">
        <source src="${videoUrl}" type="video/webm">
        Your browser does not support the video tag.
      </video>
      <p style="margin-top: 20px; opacity: 0.8;">Duration: ${Math.floor(duration / 60)}:${Math.floor(duration % 60)
        .toString()
        .padStart(2, "0")}</p>
    </div>
  </div>
</body>
</html>`;

  return frameHtml;
};

export const postToFarcasterAPI = async (frameData: FarcasterFrameData) => {
  // This is where you'd integrate with Farcaster's API
  // For now, we'll create a shareable link

  const frameHtml = generateFarcasterFrame(frameData);

  // You could upload this HTML to a hosting service
  // or create an endpoint that serves this HTML

  console.log("Generated Farcaster Frame HTML:", frameHtml);

  return {
    frameHtml,
    shareUrl: `https://your-domain.com/frame/${Date.now()}`, // This would be your actual frame URL
  };
};
