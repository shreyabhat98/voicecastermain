import { uploadAudioFile } from "./supabase";

export const generateShareableLink = async (
  audioBlob: Blob,
  previewImageBlob?: Blob,
  userProfile?: { avatar?: string; name?: string; username?: string }, // UPDATED: Include name and username
): Promise<string> => {
  try {
    console.log("📤 Uploading audio for link generation...");

    // Upload audio to Supabase
    const timestamp = Date.now();
    const audioFileName = `voice-${timestamp}.wav`;
    const audioUrl = await uploadAudioFile(audioBlob, audioFileName);

    console.log("✅ Audio uploaded:", audioUrl);

    // Upload preview image if provided
    let previewImageUrl = "";
    if (previewImageBlob) {
      try {
        const previewFileName = `preview-${timestamp}.png`;
        previewImageUrl = await uploadAudioFile(previewImageBlob, previewFileName);
        console.log("✅ Preview image uploaded:", previewImageUrl);
      } catch (error) {
        console.log("❌ Preview image upload failed, continuing without preview");
      }
    }

    // Create URL that will show the preview page
    const baseUrl = window.location.origin;
    let wrapperUrl = `${baseUrl}/preview?audio=${encodeURIComponent(audioUrl)}`;

    // Add preview image if available
    if (previewImageUrl) {
      wrapperUrl += `&preview=${encodeURIComponent(previewImageUrl)}`;
    }

    // Add user profile data if available
    if (userProfile?.avatar) {
      wrapperUrl += `&avatar=${encodeURIComponent(userProfile.avatar)}`;
    }
    if (userProfile?.name) {
      wrapperUrl += `&name=${encodeURIComponent(userProfile.name)}`;
    }
    if (userProfile?.username) {
      wrapperUrl += `&username=${encodeURIComponent(userProfile.username)}`;
    }

    console.log("🔗 Generated shareable URL:", wrapperUrl);

    return wrapperUrl;
  } catch (error) {
    console.error("❌ Link generation failed:", error);
    throw new Error(`Link generation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
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
    const response = await fetch(shareUrl, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
};
