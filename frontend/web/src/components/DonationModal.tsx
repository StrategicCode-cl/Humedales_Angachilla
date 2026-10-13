'use client';

import React, { useState } from 'react';
import {
  Heart,
  X,
  CreditCard,
  Building,
  CheckCircle,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  TreePine,
  Download
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storageService } from '../services/storageService';
import { DonationRecord, User } from '../types';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
}

export const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose, currentUser }) => {
  const [amount, setAmount] = useState<number>(5000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [purpose, setPurpose] = useState<DonationRecord['purpose']>('mantenimiento_pasarelas');
  const [paymentMethod, setPaymentMethod] = useState<'webpay' | 'transferencia'>('webpay');
  const [donorName, setDonorName] = useState(currentUser?.name || '');
  const [donorEmail, setDonorEmail] = useState(currentUser?.email || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedDonation, setCompletedDonation] = useState<DonationRecord | null>(null);
  const [copiedBank, setCopiedBank] = useState(false);

  if (!isOpen) return null;

  const presetAmounts = [2000, 5000, 10000, 20000];

  const handleSelectPreset = (val: number) => {
    setAmount(val);
    setCustomAmount('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setCustomAmount(val);
    if (val) {
      setAmount(parseInt(val, 10));
    }
  };

  const handleCopyBankDetails = () => {
    const details = `Comité Ecológico Bosque Humedal del Santuario Angachilla
RUT: 65.213.206-5
Banco: BancoEstado
Tipo de Cuenta: Cuenta Corriente
N° de Cuenta: 123-45678-90
Email: comitebosquehumedal@gmail.com
Asunto: Aporte Preservación Humedal`;
    navigator.clipboard.writeText(details);
    setCopiedBank(true);
    setTimeout(() => setCopiedBank(false), 2500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 500) {
      alert('Por favor ingresa un monto válido (mínimo $500 CLP).');
      return;
    }
    if (!donorName.trim() || !donorEmail.trim()) {
      alert('Por favor ingresa tu nombre y correo para enviarte el comprobante de donación.');
      return;
    }

    setIsProcessing(true);

    setTimeout(() => {
      const record = storageService.addDonation({
        donorName: donorName.trim(),
        donorEmail: donorEmail.trim(),
        amountClp: amount,
        purpose,
        paymentMethod
      });

      setIsProcessing(false);
      setCompletedDonation(record);

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // Safe fallback
      }
    }, 1200);
  };

  const handleResetAndClose = () => {
    setCompletedDonation(null);
    onClose();
  };

  return (
    <div
      id="donation-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white p-5 sm:p-6 relative select-none">
          <button
            onClick={handleResetAndClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center text-rose-300 backdrop-blur-xs">
              <Heart className="w-5 h-5 fill-current" />
            </div>
            <div>
              <span className="text-[10px] font-bold tracking-widest uppercase bg-emerald-950/40 text-emerald-200 px-2 py-0.5 rounded-full">
                RF-MON-1 • Sostenibilidad
              </span>
              <h2 className="text-lg sm:text-xl font-black font-display mt-0.5">
                Aportes y Donaciones al Humedal
              </h2>
            </div>
          </div>
          <p className="text-xs text-emerald-100/90 mt-2 leading-relaxed">
            Tu contribución apoya directamente al <strong>Comité Ecológico Bosque Humedal del Santuario Angachilla</strong> para reparar pasarelas, reforestar especies nativas y proteger la fauna silvestre de Valdivia.
          </p>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {completedDonation ? (
            /* Success Screen */
            <div className="text-center py-4 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle className="w-10 h-10 stroke-[2.5]" />
              </div>
              <div>
                <h3 className="text-xl font-black font-display text-stone-900">
                  ¡Muchísimas gracias por tu aporte!
                </h3>
                <p className="text-xs text-stone-600 mt-1 max-w-sm mx-auto">
                  Gracias a personas como tú, el Santuario Angachilla continúa siendo un refugio seguro para cisnes, huillines y la biodiversidad valdiviana.
                </p>
              </div>

              {/* Receipt details */}
              <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-2 border-b border-stone-200">
                  <span className="text-stone-500">N° Comprobante:</span>
                  <span className="font-mono font-bold text-stone-900">{completedDonation.receiptNumber}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Donante:</span>
                  <span className="font-semibold text-stone-900">{completedDonation.donorName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Monto Aportado:</span>
                  <span className="font-black text-emerald-700 text-sm">
                    ${completedDonation.amountClp.toLocaleString('es-CL')} CLP
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Destino:</span>
                  <span className="font-medium text-stone-800 capitalize">
                    {completedDonation.purpose.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-stone-500">Medio:</span>
                  <span className="font-medium text-stone-800 uppercase">
                    {completedDonation.paymentMethod}
                  </span>
                </div>
                <div className="flex justify-between items-center pt-2 border-t border-stone-200">
                  <span className="text-stone-500">Fecha:</span>
                  <span className="text-stone-700">{completedDonation.date}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => alert(`Comprobante ${completedDonation.receiptNumber} enviado a ${completedDonation.donorEmail}`)}
                  className="flex-1 py-2.5 rounded-2xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
                >
                  <Download className="w-4 h-4" />
                  Descargar Recibo
                </button>
                <button
                  onClick={handleResetAndClose}
                  className="flex-1 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                >
                  Finalizar
                </button>
              </div>
            </div>
          ) : (
            /* Donation Form */
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Presets */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-2">
                  Selecciona el monto de tu aporte (CLP)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {presetAmounts.map(val => (
                    <button
                      type="button"
                      key={val}
                      onClick={() => handleSelectPreset(val)}
                      className={`py-2 px-1 rounded-2xl text-xs font-black transition-all border ${
                        amount === val && !customAmount
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md scale-102'
                          : 'bg-stone-50 hover:bg-stone-100 text-stone-700 border-stone-200'
                      }`}
                    >
                      ${val.toLocaleString('es-CL')}
                    </button>
                  ))}
                </div>

                {/* Custom amount */}
                <div className="mt-2.5 relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-stone-400">$</span>
                  <input
                    type="text"
                    value={customAmount}
                    onChange={handleCustomChange}
                    placeholder="Otro monto (ej. 15.000)"
                    className="w-full pl-7 pr-12 py-2 text-xs font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                  <span className="absolute right-3 top-2.5 text-[10px] font-bold text-stone-400 uppercase">
                    CLP
                  </span>
                </div>
              </div>

              {/* Purpose Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  ¿A qué proyecto deseas destinar tu aporte?
                </label>
                <select
                  value={purpose}
                  onChange={e => setPurpose(e.target.value as DonationRecord['purpose'])}
                  className="w-full p-2.5 text-xs font-semibold rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="mantenimiento_pasarelas">Mantenimiento de Pasarelas y Miradores</option>
                  <option value="reforestacion">Reforestación con Pitras y Canelos Nativos</option>
                  <option value="totems_qr">Mantenimiento de Tótems QR y Señalética</option>
                  <option value="monitoreo_fauna">Monitoreo y Protección de Cisnes y Huillines</option>
                  <option value="general">Fondo General de Conservación del Humedal</option>
                </select>
              </div>

              {/* Donor Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Nombre o Institución
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={e => setDonorName(e.target.value)}
                    placeholder="Ej. Francisca Silva"
                    className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-stone-700 mb-1">
                    Correo para Comprobante
                  </label>
                  <input
                    type="email"
                    required
                    value={donorEmail}
                    onChange={e => setDonorEmail(e.target.value)}
                    placeholder="ejemplo@correo.cl"
                    className="w-full p-2 text-xs rounded-xl border border-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1.5">
                  Medio de Pago
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('webpay')}
                    className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2.5 transition ${
                      paymentMethod === 'webpay'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <p className="text-xs leading-none">Webpay Plus</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Débito / Crédito</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('transferencia')}
                    className={`p-2.5 rounded-2xl border text-left flex items-center space-x-2.5 transition ${
                      paymentMethod === 'transferencia'
                        ? 'border-emerald-600 bg-emerald-50/70 text-emerald-950 font-bold ring-1 ring-emerald-600'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-600 font-medium'
                    }`}
                  >
                    <Building className="w-5 h-5 text-teal-600 shrink-0" />
                    <div>
                      <p className="text-xs leading-none">Transferencia</p>
                      <p className="text-[10px] text-stone-500 mt-0.5">Cuenta oficial</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Bank Details Display if Transfer is chosen */}
              {paymentMethod === 'transferencia' && (
                <div className="p-3 bg-stone-100 rounded-2xl border border-stone-200 text-xs space-y-1 relative animate-in fade-in duration-150">
                  <div className="flex items-center justify-between font-bold text-stone-800 pb-1 border-b border-stone-200">
                    <span>Datos Bancarios del Comité:</span>
                    <button
                      type="button"
                      onClick={handleCopyBankDetails}
                      className="text-[10px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      {copiedBank ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                      {copiedBank ? 'Copiado' : 'Copiar'}
                    </button>
                  </div>
                  <p className="text-[11px] text-stone-600">
                    <strong>Razón Social:</strong> Comité Ecológico Bosque Humedal del Santuario Angachilla<br />
                    <strong>RUT:</strong> 65.213.206-5<br />
                    <strong>Banco:</strong> BancoEstado (Cuenta Corriente)<br />
                    <strong>N° Cuenta:</strong> 123-45678-90<br />
                    <strong>Email:</strong> comitebosquehumedal@gmail.com
                  </p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black tracking-wide shadow-lg shadow-emerald-900/20 active:scale-98 transition-all flex items-center justify-center space-x-2"
              >
                {isProcessing ? (
                  <span>Procesando aporte solidario...</span>
                ) : (
                  <>
                    <Heart className="w-4 h-4 fill-current text-rose-300" />
                    <span>Donar ${amount.toLocaleString('es-CL')} CLP al Santuario</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
