// src/utils/linkGenerator.ts - COMPLETE UPDATED VERSION

import { uploadAudioFile } from './supabase';

// Simple URL shortener using TinyURL API (free, no key required)
export const shortenUrl = async (longUrl: string): Promise<string> => {
  try {
    console.log('🔗 Shortening URL:', longUrl);
    
    // Use TinyURL API (free, no registration required)
    const response = await fetch(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`);
    
    if (!response.ok) {
      throw new Error('TinyURL API failed');
    }
    
    const shortUrl = await response.text();
    
    // Validate the response
    if (shortUrl.startsWith('http')) {
      console.log('✅ URL shortened:', shortUrl);
      return shortUrl;
    } else {
      throw new Error('Invalid response from TinyURL');
    }
    
  } catch (error) {
    console.error('❌ URL shortening failed:', error);
    // Fallback to original URL if shortening fails
    return longUrl;
  }
};

// Alternative: Use is.gd API (also free, no key required)
export const shortenUrlAlternative = async (longUrl: string): Promise<string> => {
  try {
    console.log('🔗 Shortening URL with is.gd:', longUrl);
    
    const response = await fetch('https://is.gd/create.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `format=simple&url=${encodeURIComponent(longUrl)}`
    });
    
    if (!response.ok) {
      throw new Error('is.gd API failed');
    }
    
    const shortUrl = await response.text();
    
    if (shortUrl.startsWith('http')) {
      console.log('✅ URL shortened with is.gd:', shortUrl);
      return shortUrl;
    } else {
      throw new Error('Invalid response from is.gd');
    }
    
  } catch (error) {
    console.error('❌ is.gd shortening failed:', error);
    return longUrl;
  }
};

// 🎯 MAIN CHANGE: Generate mini app playback links instead of direct audio
export const generateShareableLink = async (
  audioBlob: Blob, 
  previewImageBlob?: Blob
): Promise<string> => {
  try {
    console.log('📤 Uploading audio for mini app link generation...');
    
    // Upload audio to Supabase
    const timestamp = Date.now();
    const audioFileName = `voice-${timestamp}.wav`;
    const audioUrl = await uploadAudioFile(audioBlob, audioFileName);
    
    console.log('✅ Audio uploaded:', audioUrl);
    
    // Upload preview image if provided
    let previewImageUrl = '';
    if (previewImageBlob) {
      try {
        const previewFileName = `preview-${timestamp}.png`;
        previewImageUrl = await uploadAudioFile(previewImageBlob, previewFileName);
        console.log('✅ Preview image uploaded:', previewImageUrl);
      } catch (error) {
        console.log('❌ Preview image upload failed, continuing without preview');
      }
    }
    
    // 🎯 BACK TO ORIGINAL: Use your existing API preview endpoint (for Farcaster frames)
    const baseUrl = window.location.origin;
    const wrapperUrl = `${baseUrl}/api/audio/preview/${timestamp}?audio=${encodeURIComponent(audioUrl)}${previewImageUrl ? `&preview=${encodeURIComponent(previewImageUrl)}` : ''}`;
    
    console.log('🔗 Generated wrapper URL:', wrapperUrl);
    
    // Try to shorten the wrapper URL for better sharing
    let finalUrl = wrapperUrl;
    
    try {
      finalUrl = await shortenUrl(wrapperUrl);
    } catch (error) {
      console.log('TinyURL failed, trying is.gd...');
      try {
        // Fallback to is.gd
        finalUrl = await shortenUrlAlternative(wrapperUrl);
      } catch (error2) {
        console.log('Both shorteners failed, using original URL');
        finalUrl = wrapperUrl;
      }
    }
    
    console.log('🎯 Final mini app shareable URL:', finalUrl);
    
    return finalUrl;
    
  } catch (error) {
    console.error('❌ Link generation failed:', error);
    throw new Error(`Link generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Utility function to validate if a URL is properly shortened
export const isShortUrl = (url: string): boolean => {
  const shortDomains = ['tinyurl.com', 'is.gd', 'bit.ly', 't.co', 'short.link'];
  try {
    const urlObj = new URL(url);
    return shortDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
};

// Generate preview URL for the Farcaster frame image
export const generatePreviewUrl = (audioId: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/api/preview/${audioId}`;
};

// Validate that the generated link works properly
export const validateShareableLink = async (shareUrl: string): Promise<boolean> => {
  try {
    const response = await fetch(shareUrl, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};