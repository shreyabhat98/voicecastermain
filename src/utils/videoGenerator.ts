interface GenerateVideoOptions {
  audioBlob: Blob;
  duration: number;
}

export async function generateVideoFromAudio({
  audioBlob,
  duration
}: GenerateVideoOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    canvas.width = 640;
    canvas.height = 640;
    
    const audio = document.createElement('audio');
    audio.src = URL.createObjectURL(audioBlob);
    
    audio.addEventListener('loadedmetadata', () => {
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/webm';
      }
      
      const stream = canvas.captureStream(30);
      
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audio);
      const destination = audioContext.createMediaStreamDestination();
      
      source.connect(destination);
      source.connect(audioContext.destination);
      
      destination.stream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 500000,
        audioBitsPerSecond: 128000
      });
      
      const chunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunks, { type: mimeType });
        audioContext.close();
        URL.revokeObjectURL(audio.src);
        resolve(videoBlob);
      };
      
      mediaRecorder.onerror = reject;
      
      // Static purple background + mic
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, '#8B5CF6');
      gradient.addColorStop(1, '#3B82F6');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      ctx.font = '72px system-ui';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'white';
      ctx.fillText('🎤', centerX, centerY + 25);
      
      mediaRecorder.start();
      audio.play();
      
      setTimeout(() => {
        mediaRecorder.stop();
        audio.pause();
      }, duration * 1000);
      
    });
    
    audio.addEventListener('error', reject);
    audio.load();
  });
}