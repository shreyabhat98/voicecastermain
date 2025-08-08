import { ArrowLeft, Copy, Volume2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

// Voice Message Card Component
const VoiceMessageCard = ({
  isPlaying,
  duration,
  currentTime,
  onPlayPause,
  userProfile,
  recordedDuration,
}: {
  isPlaying: boolean;
  duration: number;
  currentTime: number;
  onPlayPause: () => void;
  userProfile?: {
    name?: string;
    username?: string;
    avatar?: string;
  };
  recordedDuration: number;
}) => {
  const [imgError, setImgError] = useState(false);

  const formatTime = (seconds: number) => {
    if (typeof seconds !== "number" || isNaN(seconds) || !isFinite(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Always prefer duration if available, else recordedDuration
  const totalDuration =
    duration && duration > 0 ? duration : recordedDuration && recordedDuration > 0 ? recordedDuration : undefined;

  return (
    <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl p-6 relative overflow-hidden">
      {/* Speaker icon in top right corner */}
      <div className="absolute top-4 right-4">
        <Volume2 className="w-5 h-5 text-white/70" />
      </div>
      <div className="text-white mb-4">
        <p className="text-lg font-medium"></p>
      </div>
      <div className="relative">
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center group">
          {/* Avatar or fallback */}
          <div className="flex items-center justify-center w-20 h-20 mx-auto">
            {!imgError && userProfile?.avatar ? (
              <img
                src={userProfile.avatar}
                alt={userProfile.name || "User Profile"}
                className="w-full h-full object-cover"
                onError={() => setImgError(true)}
              />
            ) : (
              <svg
                width="64"
                height="64"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="text-white"
              >
                <path
                  d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
                  fill="currentColor"
                />
                <path
                  d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
                  fill="currentColor"
                />
                <path d="M12 19V22H8V24H16V22H12V19Z" fill="currentColor" />
              </svg>
            )}
          </div>
          {/* Play/Pause button overlay - custom style */}
          <div
            className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${isPlaying ? "opacity-0" : "opacity-100 group-hover:opacity-100"}`}
            style={{ pointerEvents: "none" }}
          >
            <div
              className="w-0 h-0 border-l-[24px] border-l-white border-y-[16px] border-y-transparent ml-1 drop-shadow-lg"
              style={{ pointerEvents: "auto" }}
            ></div>
          </div>
          <button
            onClick={onPlayPause}
            className="absolute inset-0 flex items-center justify-center focus:outline-none"
            style={{ background: "transparent", border: "none", zIndex: 10 }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying && (
              <div className="flex space-x-1">
                <div className="w-1.5 h-6 bg-white rounded-full"></div>
                <div className="w-1.5 h-6 bg-white rounded-full"></div>
              </div>
            )}
          </button>
        </div>
        <div className="flex items-center justify-between mt-4 text-white">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-mono">
              {formatTime(currentTime)}
              {totalDuration && totalDuration > 0 ? `/${formatTime(totalDuration)}` : ""}
            </span>
          </div>
          <div className="flex items-center text-white/80">
            <img src="/mic-white.svg" alt="Microphone" width="18" height="18" />
          </div>
        </div>
      </div>
    </div>
  );
};

function Preview() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [linkCopied, setLinkCopied] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Extract parameters from URL
  const audioUrl = searchParams.get("audio") || "";
  const avatarUrl = searchParams.get("avatar") || "";
  const name = searchParams.get("name") || "";
  const username = searchParams.get("username") || "";

  const userProfile = {
    name,
    username,
    avatar: avatarUrl,
  };

  // Create page title
  let pageTitle = "Voice Message";
  if (name) {
    pageTitle = `Voice message from ${name}`;
  } else if (username) {
    pageTitle = `Voice message from @${username}`;
  }

  useEffect(() => {
    // Set loading to false after a short delay
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Play/pause audio
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Handle audio events
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioUrl) return;

    const handleLoadedMetadata = () => {
      console.log("Audio metadata loaded, duration:", audio.duration);
      if (
        audio.duration &&
        !isNaN(audio.duration) &&
        isFinite(audio.duration) &&
        audio.duration !== Number.POSITIVE_INFINITY
      ) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleCanPlayThrough = () => {
      // Additional check when audio is fully loaded
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("canplaythrough", handleCanPlayThrough);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("ended", handleEnded);
    audio.load();

    return () => {
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("canplaythrough", handleCanPlayThrough);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [audioUrl]);

  // Copy link function
  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch (error) {
      console.error("Copy failed:", error);
    }
  };

  if (!audioUrl) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
        <div className="text-center text-white">
          <h1 className="text-2xl font-bold mb-4">Invalid Audio Link</h1>
          <p className="mb-6">No audio URL provided in the link.</p>
          <button
            onClick={() => navigate("/")}
            className="bg-white text-purple-600 px-6 py-3 rounded-full font-semibold hover:bg-gray-100 transition-all"
          >
            Create Your Own Voice Message
          </button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center">
        <div className="flex justify-center items-center">
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="text-white animate-bounce"
            style={{ animationDuration: "0.6s" }}
          >
            <path
              d="M12 2C10.9 2 10 2.9 10 4V12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12V4C14 2.9 13.1 2 12 2Z"
              fill="currentColor"
            />
            <path
              d="M19 10V12C19 15.9 15.9 19 12 19C8.1 19 5 15.9 5 12V10H7V12C7 14.8 9.2 17 12 17C14.8 17 17 14.8 17 12V10H19Z"
              fill="currentColor"
            />
            <path d="M12 19V22H8V24H16V22H12V19Z" fill="currentColor" />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-purple-500 to-indigo-600 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">VoiceCaster</h1>
          <p className="text-white/90 text-lg font-medium drop-shadow">{pageTitle}</p>
        </div>

        {/* Voice Card */}
        <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 shadow-2xl border border-white/20 mb-6">
          <VoiceMessageCard
            isPlaying={isPlaying}
            duration={duration}
            currentTime={currentTime}
            onPlayPause={togglePlayback}
            userProfile={userProfile}
            recordedDuration={0}
          />

          {/* Action Buttons */}
          <div className="mt-6 space-y-3">
            <button
              onClick={copyLink}
              className="w-full bg-white/10 hover:bg-white/20 border border-white/20 text-white py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
            >
              {linkCopied ? (
                <>✓ Link Copied!</>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  Copy Link
                </>
              )}
            </button>

            <button
              onClick={() => navigate("/")}
              className="w-full bg-white hover:bg-gray-100 text-purple-700 py-3 px-4 rounded-xl font-semibold transition-all flex items-center justify-center"
            >
              Create Your Own Voice Message
            </button>
          </div>
        </div>

        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white/80 hover:text-white transition-colors mx-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Go Back
        </button>

        {/* Hidden audio element */}
        <audio ref={audioRef} src={audioUrl} className="hidden" />
      </div>
    </div>
  );
}

export default Preview;
