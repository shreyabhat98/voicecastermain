import { createClient } from '@supabase/supabase-js'

// Get credentials from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Function to upload audio file
export const uploadAudioFile = async (audioBlob: Blob, fileName: string): Promise<string> => {
  try {
    console.log('Starting upload:', fileName)
    
    const { data, error } = await supabase.storage
      .from('voice-recordings')
      .upload(fileName, audioBlob, {
        contentType: 'audio/wav',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      throw error
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('voice-recordings')
      .getPublicUrl(fileName)

    console.log('Upload successful:', publicUrl)
    return publicUrl
    
  } catch (error) {
    console.error('Supabase upload failed:', error)
    throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}