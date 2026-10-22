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
  X,
  ChevronRight,
  ChevronLeft,
  Images,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { PointOfInterest } from '../types';
import { soundService } from '../services/soundService';
import { storageService } from '../services/storageService';
import { resolveMediaUrl } from '../lib/api';

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
  onGoToMapLocation,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pois, setPois] = useState<PointOfInterest[]>(() => storageService.getPointsOfInterest());
  const [streamActive, setStreamActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [scannedPOI, setScannedPOI] = useState<PointOfInterest | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPausedPhotos, setIsPausedPhotos] = useState(false);
  const [isPausedSpecies, setIsPausedSpecies] = useState(false);
  const [isFirstScan, setIsFirstScan] = useState(false);
  const [scannedCodesList, setScannedCodesList] = useState<string[]>([]);
  const animationFrameId = useRef<number | null>(null);
  const photoStripRef = useRef<HTMLDivElement>(null);
  const speciesStripRef = useRef<HTMLDivElement>(null);

  // Auto-advancing slow carousel for station trail photos
  useEffect(() => {
    if (!scannedPOI || isPausedPhotos) return;
    const count = (scannedPOI.gallery && scannedPOI.gallery.length > 0) ? scannedPOI.gallery.length : 1;
    if (count <= 1) return;
    const timer = setInterval(() => {
      setActivePhotoIndex(prev => (prev + 1) % count);
    }, 3800);
    return () => clearInterval(timer);
  }, [scannedPOI, isPausedPhotos]);

  // Smooth scroll thumbnail strip to follow active photo
  useEffect(() => {
    if (!photoStripRef.current) return;
    const itemWidth = 120;
    photoStripRef.current.scrollTo({ left: activePhotoIndex * itemWidth - 40, behavior: 'smooth' });
  }, [activePhotoIndex]);

  // Continuous slow gliding carousel for species in scanned totem
  useEffect(() => {
    const el = speciesStripRef.current;
    if (!el || !scannedPOI?.species || scannedPOI.species.length <= 2) return;
    let animId: number;
    let lastTime: number | null = null;
    const speed = 20; // 20 px/sec: smooth, gentle, perfectly readable
    const step = (t: number) => {
      if (lastTime === null) lastTime = t;
      const delta = (t - lastTime) / 1000;
      lastTime = t;
      if (!isPausedSpecies && el) {
        el.scrollLeft += speed * delta;
        if (el.scrollLeft >= el.scrollWidth - el.clientWidth - 2) {
          el.scrollLeft = 0;
        }
      }
      animId = requestAnimationFrame(step);
    };
    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [scannedPOI?.species, isPausedSpecies]);

  useEffect(() => {
    const onSync = () => setPois([...storageService.getPointsOfInterest()]);
    window.addEventListener('angachilla:sync', onSync);
    onSync();
    return () => window.removeEventListener('angachilla:sync', onSync);
  }, []);

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
      setActivePhotoIndex(0);
    }
    return () => {
      stopCamera();
    };
  }, [isOpen, preselectedCode, pois]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Cámara no compatible con este dispositivo/navegador.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
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
      setCameraError(
        error.message ||
          'No se pudo acceder a la cámara. Puedes seleccionar un tótem abajo o subir una foto.'
      );
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
        inversionAttempts: 'dontInvert',
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
            alert(
              'No se detectó ningún código QR válido en la imagen. Intenta con una imagen más nítida o selecciona un tótem directo.'
            );
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
    const list = storageService.getPointsOfInterest();
    const found = list.find(
      p =>
        p.qrCode.toLowerCase() === cleanCode.toLowerCase() ||
        p.id.toLowerCase() === cleanCode.toLowerCase()
    );

    if (found) {
      setScannedPOI(found);
      setActivePhotoIndex(0);
      stopCamera();

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // ignore
      }

      const isNew = storageService.saveScannedQR(found.qrCode);
      setIsFirstScan(isNew);
      setScannedCodesList(storageService.getScannedQRs());

      soundService.playNavChime();
      if (found.soundKey) {
        setTimeout(() => {
          soundService.playBySoundKey(found.soundKey!);
        }, 300);
      }
    } else {
      alert(
        `Código detectado: "${cleanCode}". No corresponde a un tótem oficial de Humedal Angachilla.`
      );
    }
  };

  if (!isOpen) return null;

  const totemPhotos = scannedPOI
    ? (scannedPOI.gallery && scannedPOI.gallery.length > 0
        ? scannedPOI.gallery
        : [scannedPOI.image]
      ).map(url => resolveMediaUrl(url))
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-stone-900 border border-stone-700 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl text-stone-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 border-b border-stone-800 flex items-center justify-between bg-stone-950/60">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-emerald-600/20 text-emerald-400 border border-emerald-500/30">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Tótems Interactivos de la Reserva
              </h2>
              <p className="text-xs text-stone-400">
                Puntos de interés, fotografías del sendero, aves y flora del Humedal Angachilla
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
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {scannedPOI ? (
            /* Scanned Totem Result View with Trail Photos Carousel & Birds/Flora Carousel */
            <div className="space-y-5 animate-scale-up">
              {isFirstScan && (
                <div className="p-3 bg-gradient-to-r from-emerald-950 to-teal-950 border border-emerald-500/50 rounded-2xl flex items-center space-x-3 text-emerald-200">
                  <Award className="w-6 h-6 text-amber-400 flex-shrink-0 animate-bounce" />
                  <div>
                    <h4 className="font-extrabold text-xs text-white">¡Estación Registrada!</h4>
                    <p className="text-[11px] text-emerald-300">
                      Has desbloqueado este tótem en tu recorrido por el humedal.
                    </p>
                  </div>
                </div>
              )}

              {/* 1. CARRUSEL DE FOTOGRAFÍAS DEL SENDERO EN EL TÓTEM */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                    <Images className="w-3.5 h-3.5" />
                    Fotografías de la Estación ({activePhotoIndex + 1}/{totemPhotos.length})
                  </span>
                  {totemPhotos.length > 1 && (
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIndex(
                            (activePhotoIndex - 1 + totemPhotos.length) % totemPhotos.length
                          )
                        }
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center"
                        aria-label="Foto anterior"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActivePhotoIndex((activePhotoIndex + 1) % totemPhotos.length)
                        }
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center"
                        aria-label="Foto siguiente"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Main Active Totem Trail Photo (Carrusel con movimiento lento automático) */}
                <div
                  onMouseEnter={() => setIsPausedPhotos(true)}
                  onMouseLeave={() => setIsPausedPhotos(false)}
                  onTouchStart={() => setIsPausedPhotos(true)}
                  onTouchEnd={() => setIsPausedPhotos(false)}
                  className="relative rounded-2xl overflow-hidden border border-stone-700 aspect-video bg-stone-950 group"
                >
                  <img
                    src={totemPhotos[activePhotoIndex]}
                    alt={`${scannedPOI.name} - Foto ${activePhotoIndex + 1}`}
                    className="w-full h-full object-cover transition-all duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-stone-950/90 via-transparent to-transparent" />
                  <div className="absolute top-2.5 right-2.5">
                    {totemPhotos.length > 1 && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-black/60 text-emerald-300 border border-emerald-500/30">
                        {isPausedPhotos ? 'Pausado' : 'Carrusel en movimiento'}
                      </span>
                    )}
                  </div>
                  <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white uppercase tracking-wider">
                      Estación {scannedPOI.qrCode}
                    </span>
                    {scannedPOI.soundKey && (
                      <button
                        onClick={() => soundService.playBySoundKey(scannedPOI.soundKey!)}
                        className="flex items-center space-x-1.5 px-3 py-1 rounded-xl bg-stone-900/90 text-teal-300 border border-teal-500/40 text-xs font-semibold hover:bg-stone-900"
                      >
                        <Volume2 className="w-4 h-4 text-teal-400" />
                        <span>Escuchar Paisaje Sonoro</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Horizontal Carousel Strip of Station Photos */}
                <div
                  ref={photoStripRef}
                  className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none snap-x snap-mandatory"
                >
                  {totemPhotos.map((photoUrl, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`relative w-28 h-20 rounded-xl overflow-hidden shrink-0 snap-start border-2 transition-all ${
                        idx === activePhotoIndex
                          ? 'border-emerald-400 scale-[1.02] shadow-md'
                          : 'border-stone-700 opacity-65 hover:opacity-100'
                      }`}
                    >
                      <img
                        src={photoUrl}
                        alt={`Miniatura ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div className="bg-stone-800/60 border border-stone-700/80 rounded-2xl p-4">
                <h3 className="text-lg font-extrabold text-white font-display">
                  {scannedPOI.name}
                </h3>
                <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed whitespace-pre-line">
                  {scannedPOI.description}
                </p>
              </div>

              {/* 2. CARRUSEL DE AVES, FAUNA Y FLORA DEL TÓTEM */}
              {scannedPOI.species && scannedPOI.species.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      Aves, Fauna y Flora de esta Estación ({scannedPOI.species.length})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() =>
                          speciesStripRef.current?.scrollBy({ left: -220, behavior: 'smooth' })
                        }
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center"
                        aria-label="Desplazar especies a la izquierda"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          speciesStripRef.current?.scrollBy({ left: 220, behavior: 'smooth' })
                        }
                        className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-white flex items-center justify-center"
                        aria-label="Desplazar especies a la derecha"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div
                    ref={speciesStripRef}
                    onMouseEnter={() => setIsPausedSpecies(true)}
                    onMouseLeave={() => setIsPausedSpecies(false)}
                    onTouchStart={() => setIsPausedSpecies(true)}
                    onTouchEnd={() => setIsPausedSpecies(false)}
                    className="flex items-stretch gap-3 overflow-x-auto pb-2 scrollbar-none snap-x snap-mandatory cursor-grab active:cursor-grabbing"
                  >
                    {scannedPOI.species.map(sp => (
                      <div
                        key={sp.id}
                        className="w-36 shrink-0 snap-start rounded-2xl bg-stone-800/90 border border-stone-700 p-2.5 flex flex-col items-center text-center"
                      >
                        <div className="w-24 h-24 rounded-xl bg-stone-900/90 p-2 flex items-center justify-center overflow-hidden border border-stone-700/70">
                          <img
                            src={resolveMediaUrl(
                              sp.illustrationUrl || sp.image || '/api/media/slug/sp-siete-colores'
                            )}
                            alt={sp.commonName}
                            className="w-full h-full object-contain"
                            loading="lazy"
                          />
                        </div>
                        <span className="mt-2 text-xs font-extrabold text-white line-clamp-1">
                          {sp.commonName}
                        </span>
                        <span className="text-[10px] italic text-emerald-300/90 line-clamp-1">
                          {sp.scientificName}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Norms of the station */}
              {scannedPOI.norms && scannedPOI.norms.length > 0 && (
                <div className="bg-emerald-950/40 border border-emerald-800/60 rounded-2xl p-3.5 space-y-1.5">
                  <h4 className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Recomendaciones de cuidado en este punto
                  </h4>
                  <ul className="space-y-1 text-xs text-emerald-100/90">
                    {scannedPOI.norms.map((norm, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{norm}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

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
                    <span>Ver esta estación en el mapa</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    setScannedPOI(null);
                    startCamera();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-semibold"
                >
                  Escanear otro tótem
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
                      <span className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-emerald-300" />
                      <span className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-emerald-300" />
                      <span className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-emerald-300" />
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-emerald-300" />
                    </div>
                  </div>
                )}

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
                <span>¿Tienes una foto del código QR?</span>
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

              {/* Official Totem Selector */}
              <div className="pt-3 border-t border-stone-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-stone-300 uppercase tracking-wider">
                    Estaciones y Tótems de la Reserva
                  </span>
                  <span className="text-[10px] text-emerald-400 font-semibold">
                    {scannedCodesList.length} de {pois.length} visitados
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {pois.map(poi => {
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
                            <p className="text-xs font-bold text-white truncate max-w-[180px]">
                              {poi.name}
                            </p>
                            <span className="text-[10px] text-stone-400 font-mono">
                              Estación {poi.qrCode}
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
