export default function handler(req, res) {
  console.log('🚀 REDIRECT API CALLED!');
  console.log('Method:', req.method);
  console.log('Headers:', req.headers);
  console.log('Body:', req.body);
  
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const redirectUrl = 'https://voicecaster.xyz';
  console.log('📍 Redirecting to:', redirectUrl);
  
  res.setHeader('Location', redirectUrl);
  res.status(302).end();
}