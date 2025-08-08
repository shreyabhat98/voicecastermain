import { createClient } from '@supabase/supabase-js'

// Get credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to upload audio file with better error handling
export const uploadAudioFile = async (audioBlob: Blob, fileName: string): Promise<string> => {
  try {
    console.log('📤 Starting upload:', fileName, 'Size:', audioBlob.size);
    
    // Ensure we have a valid blob
    if (!audioBlob || audioBlob.size === 0) {
      throw new Error('Invalid audio blob - size is 0');
    }
    
    // Determine content type based on blob type
    let contentType = audioBlob.type;
    if (!contentType || contentType === '') {
      contentType = 'audio/wav'; // Default fallback
    }
    
    console.log('🎵 Content type:', contentType);
    
    // Upload to Supabase storage
    const { error } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, audioBlob, {
        contentType: contentType,
        upsert: false, // Don't overwrite existing files
        cacheControl: '3600' // Cache for 1 hour
      });

    if (error) {
      console.error('❌ Upload error:', error);
      throw new Error(`Upload failed: ${error.message}`);
    }

    console.log('✅ Upload successful');

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(fileName);

    if (!publicUrl) {
      throw new Error('Failed to get public URL');
    }

    console.log('🔗 Public URL:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Supabase upload failed:', error);
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to upload video file (for video option)
export const uploadVideoFile = async (videoBlob: Blob, fileName: string): Promise<string> => {
  try {
    console.log('📤 Starting video upload:', fileName, 'Size:', videoBlob.size);
    
    if (!videoBlob || videoBlob.size === 0) {
      throw new Error('Invalid video blob - size is 0');
    }
    
    const contentType = videoBlob.type || 'video/mp4';
    console.log('🎬 Content type:', contentType);
    
    const { error } = await supabase.storage
      .from('voice-recordings') // Using same bucket
      .upload(fileName, videoBlob, {
        contentType: contentType,
        upsert: false,
        cacheControl: '3600'
      });

    if (error) {
      console.error('❌ Video upload error:', error);
      throw new Error(`Video upload failed: ${error.message}`);
    }

    const { data: { publicUrl } } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(fileName);

    console.log('🔗 Video public URL:', publicUrl);
    return publicUrl;
    
  } catch (error) {
    console.error('❌ Video upload failed:', error);
    throw new Error(`Video upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Function to delete old files (optional cleanup)
export const deleteFile = async (fileName: string): Promise<void> => {
  try {
    const { error } = await supabase.storage
      .from('voice-recordings')
      .remove([fileName]);

    if (error) {
      console.error('❌ Delete error:', error);
      throw error;
    }

    console.log('🗑️ File deleted:', fileName);
  } catch (error) {
    console.error('❌ File deletion failed:', error);
    // Don't throw here - deletion failures shouldn't break the app
  }
};