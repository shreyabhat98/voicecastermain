import { uploadAudioFile } from './supabase';

export const generateShareableLink = async (audioBlob: Blob): Promise<string> => {
  try {
    console.log('📤 Uploading audio for link generation...');
    
    // Upload audio to Supabase
    const timestamp = Date.now();
    const fileName = `voice-${timestamp}.wav`;
    const audioUrl = await uploadAudioFile(audioBlob, fileName);
    
    console.log('✅ Audio uploaded:', audioUrl);
    
    // Create wrapper URL that will show preview
    const baseUrl = window.location.origin;
    const shareUrl = `${baseUrl}/api/audio/${timestamp}?audio=${encodeURIComponent(audioUrl)}`;
    
    console.log('🔗 Generated shareable URL:', shareUrl);
    
    return shareUrl;
    
  } catch (error) {
    console.error('❌ Link generation failed:', error);
    throw new Error(`Link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Optional: URL shortening service integration
export const shortenUrl = async (longUrl: string): Promise<string> => {
  try {
    // You can integrate with services like:
    // - Bitly API
    // - TinyURL API  
    // - Your own URL shortener
    
    // For now, return the original URL
    return longUrl;
    
  } catch (error) {
    console.error('URL shortening failed:', error);
    return longUrl; // Fallback to original URL
  }
};