import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Camera, Upload, X } from 'lucide-react';
import { toast } from 'sonner';

interface ImageCaptureProps {
  onImageCapture: (imageData: string) => void;
  onCancel?: () => void;
}

export function ImageCapture({ onImageCapture, onCancel }: ImageCaptureProps) {
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
        toast.success('Camera activated');
      }
    } catch (error) {
      console.error('Camera access error:', error);
      toast.error('Could not access camera. Try uploading an image instead.');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;

    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0);
      const imageData = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedImage(imageData);
      stopCamera();
      toast.success('Photo captured');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setCapturedImage(imageData);
      toast.success('Image uploaded');
    };
    reader.readAsDataURL(file);
  };

  const confirmImage = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      toast.success('Image saved');
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    if (isCameraActive) {
      stopCamera();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Capture Medical Image</span>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={onCancel}>
              <X className="h-5 w-5" />
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview Area */}
        <div className="aspect-video bg-muted rounded-lg overflow-hidden flex items-center justify-center">
          {capturedImage ? (
            <img 
              src={capturedImage} 
              alt="Captured" 
              className="w-full h-full object-contain"
            />
          ) : isCameraActive ? (
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8">
              <Camera className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">
                Start camera or upload an image
              </p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap gap-2">
          {!capturedImage && !isCameraActive && (
            <>
              <Button onClick={startCamera} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Start Camera
              </Button>
              <Button 
                variant="outline" 
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Image
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileUpload}
              />
            </>
          )}

          {isCameraActive && !capturedImage && (
            <>
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture Photo
              </Button>
              <Button variant="outline" onClick={stopCamera} className="flex-1">
                Cancel
              </Button>
            </>
          )}

          {capturedImage && (
            <>
              <Button onClick={confirmImage} className="flex-1">
                Confirm & Save
              </Button>
              <Button variant="outline" onClick={retakePhoto} className="flex-1">
                Retake
              </Button>
            </>
          )}
        </div>

        {/* Instructions */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded">
          <strong>Instructions:</strong>
          <ul className="mt-1 ml-4 list-disc space-y-1">
            <li>Ensure good lighting for clear images</li>
            <li>Keep the affected area centered in frame</li>
            <li>Avoid shadows and reflections</li>
            <li>Take multiple angles if needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
