'use client';

import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import confetti from 'canvas-confetti';
import {
  QrCode,
  Camera,
  Upload,
  Volume2,
  MapPin,
  CheckCircle2,
  Award,
  Sparkles,
  X,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { PointOfInterest } from '../types';
import { POINTS_OF_INTEREST } from '../data/mockData';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedCode?: string | null;
  onGoToMapLocation?: (coords: [number, number]) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  preselectedCode,
  onGoToMapLocation
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedPOI, setScannedPOI] = useState<PointOfInterest | null>(null);
  const [isFirstScan, setIsFirstScan] = useState(false);
  const [scannedCodesList, setScannedCodesList] = useState<string[]>([]);
  const animationFrameId = useRef<number | null>(null);

  // Load scanned badges
  useEffect(() => {
    if (isOpen) {
      setScannedCodesList(storageService.getScannedQRs());
      if (preselectedCode) {
        handleProcessQRCode(preselectedCode);
      } else {
        startCamera();
      }
    } else {
      stopCamera();
      setScannedPOI(null);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, preselectedCode]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no compatible con este dispositivo/navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setStreamActive(true);
        scanFrame();
      }
    } catch (err: unknown) {
      const error = err as Error;
      setCameraError(error.message || 'No se pudo acceder a la cámara. Puedes usar los tótems de prueba o subir una foto.');
      setStreamActive(false);
    }
  };

  const stopCamera = () => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    setStreamActive(false);
  };

  // Frame processing loop using jsQR
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: 'dontInvert'
      });

      if (code && code.data) {
        handleProcessQRCode(code.data);
        return; // Pause scanning once found
      }
    }

    animationFrameId.current = requestAnimationFrame(scanFrame);
  };

  // Handle uploaded image file
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleProcessQRCode(code.data);
          } else {
            alert('No se detectó ningún código QR válido en la imagen. Intenta con una imagen más nítida o selecciona un tótem directo.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // Process detected QR code string
  const handleProcessQRCode = (rawCode: string) => {
    const cleanCode = rawCode.trim();
    // Search POI matching QR code or id
    const found = POINTS_OF_INTEREST.find(
      p => p.qrCode.toLowerCase() === cleanCode.toLowerCase() || p.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setScannedPOI(found);
      stopCamera();

      // Confetti effect
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      // Check if new badge
      const isNew = storageService.saveScannedQR(found.qrCode);
      setIsFirstScan(isNew);
      setScannedCodesList(storageService.getScannedQRs());

      // Play sound
      soundService.playNavChime();
      if (found.soundKey) {
        setTimeout(() => {
          soundService.playBySoundKey(found.soundKey!);
        }, 300);
      }
    } else {
      alert(`Código detectado: "${cleanCode}". No corresponde a un tótem oficial de Humedal Angachilla.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Escáner QR de Tótems Educativos
              </h2>
              <p className="text-xs text-stone-400">
                Puntos de interés y senderos del Humedal Angachilla
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-400 hover:text-white hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {scannedPOI ? (
            /* Scanned Totem Result View */
            <div className="space-y-4 animate-scale-up">
              {isFirstScan && (
                <div className="p-3 bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/50 rounded-xl flex items-center space-x-3 text-emerald-200">
                  <Award className="w-6 h-6 text-amber-400 flex-shrink-0 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">¡Nuevo Hito Desbloqueado!</h4>
                    <p className="text-[11px] text-emerald-300">
                      Has registrado este tótem en tu pasaporte de exploración del humedal.
                    </p>
                  </div>
                </div>
              )}

              {/* Totem Photo */}
              <div className="relative rounded-xl overflow-hidden border border-stone-700 aspect-video group">
                <img
                  src={scannedPOI.image}
                  alt={scannedPOI.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-600 text-white uppercase tracking-wider">
                    {scannedPOI.qrCode}
                  </span>
                  {scannedPOI.soundKey && (
                    <button
                      onClick={() => soundService.playBySoundKey(scannedPOI.soundKey!)}
                      className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-stone-900/90 text-teal-300 border border-teal-500/40 text-xs font-semibold hover:bg-stone-900"
                    >
                      <Volume2 className="w-4 h-4 text-teal-400" />
                      <span>Reproducir Sonido</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-lg font-bold text-white font-display">
                  {scannedPOI.name}
                </h3>
                <p className="text-xs text-stone-300 mt-2 leading-relaxed">
                  {scannedPOI.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-stone-800">
                {onGoToMapLocation && (
                  <button
                    onClick={() => {
                      onGoToMapLocation(scannedPOI.coordinates);
                      onClose();
                    }}
                    className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center space-x-1.5 shadow-md shadow-emerald-950/40"
                  >
                    <MapPin className="w-4 h-4" />
                    <span>Ver este hito en el mapa</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setScannedPOI(null);
                    startCamera();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                >
                  Escanear otro código
                </button>
              </div>
            </div>
          ) : (
            /* Live Camera / Scanner View */
            <div className="space-y-4">
              {/* Camera Feed Container */}
              <div className="relative aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-stone-950 border-2 border-dashed border-emerald-500/40 flex items-center justify-center">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${streamActive ? 'block' : 'hidden'}`}
                />
                <canvas ref={canvasRef} className="hidden" />

                {/* Animated Scanner Reticle */}
                {streamActive && (
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-48 h-48 sm:w-56 sm:h-56 border-2 border-emerald-400/80 rounded-2xl relative">
                      <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent animate-pulse" />
                      {/* Corner Accents */}
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
                    </div>
                  </div>
                )}

                {/* Camera fallback / error message */}
                {!streamActive && (
                  <div className="p-6 text-center max-w-sm">
                    <Camera className="w-10 h-10 text-stone-600 mx-auto mb-2" />
                    <p className="text-xs text-stone-400 font-medium">
                      {cameraError || 'Iniciando sensor de cámara...'}
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-3 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
                    >
                      Reintentar Acceso a Cámara
                    </button>
                  </div>
                )}
              </div>

              {/* Secondary Upload Image Option */}
              <div className="flex items-center justify-between text-xs text-stone-400 pt-1">
                <span>¿No tienes cámara activa?</span>
                <label className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 cursor-pointer font-semibold">
                  <Upload className="w-3.5 h-3.5" />
                  <span>Subir imagen con QR</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {/* Preset QR Totems for instant friction-free testing in preview */}
              <div className="pt-3 border-t border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                    Tótems Oficiales del Humedal (Acceso Rápido de Prueba)
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {scannedCodesList.length} de {POINTS_OF_INTEREST.length} visitados
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {POINTS_OF_INTEREST.map(poi => {
                    const isVisited = scannedCodesList.includes(poi.qrCode);
                    return (
                      <button
                        key={poi.id}
                        onClick={() => handleProcessQRCode(poi.qrCode)}
                        className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isVisited
                            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-200'
                            : 'bg-stone-800/80 border-stone-700 text-stone-300 hover:bg-stone-750 hover:border-stone-600'
                        }`}
                      >
                        <div className="flex items-center space-x-2">
                          <QrCode className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          <div className="truncate">
                            <p className="text-xs font-bold text-white truncate max-w-[170px]">
                              {poi.name}
                            </p>
                            <span className="text-[10px] text-stone-400 font-mono">
                              {poi.qrCode}
                            </span>
                          </div>
                        </div>
                        {isVisited ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-stone-500 flex-shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
