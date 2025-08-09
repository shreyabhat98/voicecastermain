export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // For now, let's just test the redirect mechanism
    // We'll extract the actual audio URL in the next step
    const redirectUrl = 'https://voicecaster.xyz'; // Temporary test URL
    
    console.log('Redirect API called, redirecting to:', redirectUrl);
    
    // Return 302 redirect as required by Farcaster
    res.setHeader('Location', redirectUrl);
    res.status(302).end();
    
  } catch (error) {
    console.error('Redirect API error:', error);
    res.status(500).json({ error: 'Redirect failed' });
  }
}