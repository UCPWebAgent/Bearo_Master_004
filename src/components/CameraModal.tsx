import React, { useRef, useEffect, useState } from 'react';
import { X, Camera, Square, Circle, Loader2 } from 'lucide-react';

interface CameraModalProps {
  mode: 'photo' | 'video' | 'vin' | 'plate';
  onCapture: (dataUrl: string, type: 'photo' | 'video' | 'vin' | 'plate', thumbnailUrl?: string, ocrText?: string) => void;
  onClose: () => void;
}

export const CameraModal: React.FC<CameraModalProps> = ({ mode, onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [capturedCount, setCapturedCount] = useState(0);
  const [isOcrProcessing, setIsOcrProcessing] = useState(false);

  useEffect(() => {
    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: mode === 'video'
        });
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (err) {
        console.error("Failed to start camera:", err);
        setError("Could not access camera. Please check permissions.");
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [mode]);

  useEffect(() => {
    let interval: number;
    if (isRecording) {
      interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const takePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(video, 0, 0);
      const dataUrl = canvas.toDataURL('image/jpeg');

      if (mode === 'vin' || mode === 'plate') {
        setIsOcrProcessing(true);
        // ARCHITECTURE ONLY: Fail honestly as per Step 17
        console.warn(`OCR requested for ${mode} but no real OCR engine is integrated.`);
        setTimeout(() => {
          setIsOcrProcessing(false);
          setError(`OCR-based ${mode.toUpperCase()} identification is currently unavailable. Please type it manually.`);
        }, 1500);
        return;
      }

      onCapture(dataUrl, mode as 'photo' | 'video');
      setCapturedCount(prev => prev + 1);
      
      // Visual feedback
      if (videoRef.current) {
        videoRef.current.style.opacity = '0.5';
        setTimeout(() => {
          if (videoRef.current) videoRef.current.style.opacity = '1';
        }, 100);
      }
    }
  };

  const startRecording = () => {
    if (stream) {
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      const chunks: Blob[] = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'video/webm' });
        
        // Generate thumbnail from current video frame
        let thumbnailUrl: string | undefined;
        if (videoRef.current && canvasRef.current) {
          const video = videoRef.current;
          const canvas = canvasRef.current;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          thumbnailUrl = canvas.toDataURL('image/jpeg');
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          onCapture(reader.result as string, 'video', thumbnailUrl);
          setCapturedCount(prev => prev + 1);
        };
        reader.readAsDataURL(blob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4 text-white bg-black/50 backdrop-blur-md z-10">
        <div className="flex flex-col">
          <span className="text-xs font-bold uppercase tracking-widest opacity-60">
            {mode === 'photo' ? 'Batch Photo Mode' : 'Batch Video Mode'}
          </span>
          {capturedCount > 0 && (
            <span className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest">
              {capturedCount} {capturedCount === 1 ? 'item' : 'items'} captured
            </span>
          )}
        </div>
        <div className="flex items-center gap-4">
          {capturedCount > 0 && (
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-emerald-600 text-white rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg active:scale-95"
            >
              Done
            </button>
          )}
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-gray-900">
        {error ? (
          <div className="text-white text-center p-6 z-20">
            <p className="mb-4 text-sm font-bold uppercase tracking-widest text-red-400">{error}</p>
            <button 
              onClick={() => setError(null)} 
              className="px-6 py-2 bg-white text-black rounded-lg font-bold uppercase tracking-widest text-xs"
            >
              Try Again
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-contain"
            />
            {isOcrProcessing && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm flex flex-col items-center justify-center text-white z-20">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <span className="text-xs font-bold uppercase tracking-widest">Processing {mode.toUpperCase()}...</span>
              </div>
            )}
            {isRecording && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded-full flex items-center gap-2 animate-pulse">
                <div className="w-2 h-2 bg-white rounded-full" />
                <span className="text-xs font-bold font-mono">{formatTime(recordingTime)}</span>
              </div>
            )}
          </>
        )}
      </div>

      {/* Controls */}
      <div className="h-32 bg-black flex items-center justify-center gap-12">
        {(mode === 'photo' || mode === 'vin' || mode === 'plate') ? (
          <button
            onClick={takePhoto}
            disabled={isOcrProcessing}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-transform ${isOcrProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <div className={`w-16 h-16 rounded-full group-hover:scale-95 transition-transform ${mode === 'vin' ? 'bg-blue-500' : mode === 'plate' ? 'bg-emerald-500' : 'bg-white'}`} />
          </button>
        ) : (
          <button
            onClick={isRecording ? stopRecording : startRecording}
            className={`w-20 h-20 rounded-full border-4 border-white flex items-center justify-center group active:scale-90 transition-transform ${isRecording ? 'border-red-500' : ''}`}
          >
            {isRecording ? (
              <div className="w-8 h-8 bg-red-500 rounded-sm" />
            ) : (
              <div className="w-16 h-16 bg-red-600 rounded-full group-hover:scale-95 transition-transform" />
            )}
          </button>
        )}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};
