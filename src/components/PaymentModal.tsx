import React, { useState } from 'react';
import { X, CreditCard, Youtube, Lock, ChevronDown, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Language } from '../types';

interface PaymentModalProps {
  onClose: () => void;
  onSuccess: (method: string, details?: any) => void;
  totalAmount: number;
  initialMethod?: 'card' | 'paypal';
  language?: Language;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ 
  onClose, 
  onSuccess, 
  totalAmount, 
  initialMethod = 'card',
  language = 'en'
}) => {
  const [method, setMethod] = useState<'card' | 'paypal'>(initialMethod);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // Form states (pre-filled as per user's request for simulation)
  const [cardNumber, setCardNumber] = useState('**** **** **** 4321');
  const [cardholderName, setCardholderName] = useState('JANE DOE');
  const [expiryDate, setExpiryDate] = useState('12/26');
  const [cvc, setCvc] = useState('***');

  const isHy = language === 'hy' || language === 'hy-east' || language === 'hy-west';
  const isEs = language === 'es';

  const t = {
    payment: isHy ? 'Վճարում' : isEs ? 'Pago' : 'Payment',
    success: isHy ? 'Վճարումը Հաջողվեց' : isEs ? 'Pago Exitoso' : 'Payment Successful',
    successMsg: isHy ? '"Լավ է, գործը վերջացավ!"' : isEs ? '"¡Qué bien, el trabajo ha terminado!"' : '"Lav e, gortse verchatsav!"',
    card: isHy ? 'Կրեդիտ կամ Դեբետ Քարտ' : isEs ? 'Tarjeta de Crédito o Débito' : 'Credit or Debit Card',
    cardNumber: isHy ? 'Քարտի Համար' : isEs ? 'Número de Tarjeta' : 'Card Number',
    cardholder: isHy ? 'Քարտապանի Անուն' : isEs ? 'Nombre del Titular' : 'Cardholder Name',
    expiry: isHy ? 'Ժամկետ' : isEs ? 'Fecha de Vencimiento' : 'Expiry Date',
    cvc: isHy ? 'CVC' : isEs ? 'CVC' : 'CVC',
    payWithCard: isHy ? 'Վճարել Քարտով' : isEs ? 'Pagar con Tarjeta' : 'Pay with Credit Card',
    payWithPaypal: isHy ? 'Վճարել PayPal-ով' : isEs ? 'Pagar con PayPal' : 'Pay with PayPal',
    fastSecure: isHy ? 'Արագ և Ապահով' : isEs ? 'Pago Rápido y Seguro' : 'Fast & Secure Checkout',
    connectPaypal: isHy ? 'Միացրեք ձեր PayPal հաշիվը' : isEs ? 'Conecte su cuenta de PayPal para un pago exprés.' : 'Connect your PayPal account for an express payment.',
    secureFooter: isHy ? 'Ապահով Վճարում | Ծածկագրված Կապ' : isEs ? 'Pago Seguro | Conexión Encriptada' : 'Secure Payment | Encrypted Connection'
  };

  const handlePay = () => {
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      setIsDone(true);
      setTimeout(() => {
        onSuccess(method, { cardNumber, cardholderName });
      }, 1500);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-[420px] bg-[#1a1a1a] rounded-[2rem] overflow-hidden shadow-2xl border border-white/5 p-5 flex flex-col gap-3"
      >
        {/* Header with Close */}
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold text-white tracking-tight">{t.payment}</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-gray-400">
            <X size={20} />
          </button>
        </div>

        {isDone ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-[#2c2c2e] rounded-2xl">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center shadow-lg shadow-emerald-500/20"
            >
              <CheckCircle2 size={40} className="text-white" />
            </motion.div>
            <h3 className="text-2xl font-bold text-white">{t.success}</h3>
            <p className="text-gray-400">{t.successMsg}</p>
          </div>
        ) : (
          <>
            {/* Credit Card Section */}
            <div 
              className={`bg-[#2c2c2e] rounded-2xl p-5 transition-all cursor-pointer border ${method === 'card' ? 'border-[#0a84ff]' : 'border-transparent'}`}
              onClick={() => setMethod('card')}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-[10px] text-[18px] font-semibold text-white">
                  <div className="w-9 h-7 bg-[#3a7bd5] rounded-md flex items-center justify-center relative overflow-hidden">
                    <div className="absolute top-2 left-0 right-0 h-[7px] bg-white/90" />
                    <div className="absolute top-[3px] left-[5px] w-3 h-1 bg-white/60 rounded-sm" />
                  </div>
                  {t.card}
                </div>
                <ChevronDown size={18} className={`text-[#8e8e93] transition-transform ${method === 'card' ? 'rotate-180' : ''}`} />
              </div>

              <AnimatePresence>
                {method === 'card' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    {/* Card Logos */}
                    <div className="flex gap-2 mb-[18px]">
                      <div className="bg-white rounded-md px-2 h-8 flex items-center justify-center min-w-[52px] text-[#1a1f71] italic text-base font-black">VISA</div>
                      <div className="bg-white rounded-md h-8 flex items-center justify-center min-w-[52px] relative overflow-hidden">
                        <div className="absolute left-1 top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#eb001b] rounded-full" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[10px] h-[18px] bg-[#ff5f00] z-10" />
                        <div className="absolute right-1 top-1/2 -translate-y-1/2 w-[18px] h-[18px] bg-[#f79e1b] rounded-full" />
                      </div>
                      <div className="bg-[#2671b2] text-white rounded-md px-[6px] h-8 flex flex-col items-center justify-center min-w-[52px] text-[9px] font-extrabold leading-tight">
                        <span>AMERICAN</span>
                        <span>EXPRESS</span>
                      </div>
                      <div className="bg-white rounded-md px-[7px] h-8 flex items-center justify-center min-w-[52px] gap-[3px] text-[#333] text-[10px] font-bold">
                        <span>DISCOVER</span>
                        <div className="w-4 h-4 bg-gradient-to-br from-[#f8a000] to-[#f06000] rounded-full" />
                      </div>
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-[14px]">
                      <div>
                        <label className="text-[13px] color-[#8e8e93] mb-1.5 block text-gray-400">{t.cardNumber}</label>
                        <input 
                          type="text" 
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          className="w-full bg-[#3a3a3c] border border-[#48484a] rounded-[10px] p-[13px_14px] text-white text-base focus:outline-none focus:border-[#0a84ff]"
                          placeholder="**** **** **** ****"
                        />
                      </div>
                      <div>
                        <label className="text-[13px] color-[#8e8e93] mb-1.5 block text-gray-400">{t.cardholder}</label>
                        <input 
                          type="text" 
                          value={cardholderName}
                          onChange={(e) => setCardholderName(e.target.value)}
                          className="w-full bg-[#3a3a3c] border border-[#48484a] rounded-[10px] p-[13px_14px] text-white text-base focus:outline-none focus:border-[#0a84ff]"
                          placeholder="FULL NAME"
                        />
                      </div>
                      <div className="flex gap-[10px]">
                        <div className="flex-1">
                          <label className="text-[13px] color-[#8e8e93] mb-1.5 block text-gray-400">{t.expiry} &nbsp; MM/YY</label>
                          <input 
                            type="text" 
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            className="w-full bg-[#3a3a3c] border border-[#48484a] rounded-[10px] p-[13px_14px] text-white text-base focus:outline-none focus:border-[#0a84ff]"
                            placeholder="MM/YY"
                          />
                        </div>
                        <div className="flex-1">
                          <label className="text-[13px] color-[#8e8e93] mb-1.5 block text-gray-400">{t.cvc}</label>
                          <input 
                            type="text" 
                            value={cvc}
                            onChange={(e) => setCvc(e.target.value)}
                            className="w-full bg-[#3a3a3c] border border-[#48484a] rounded-[10px] p-[13px_14px] text-white text-base focus:outline-none focus:border-[#0a84ff]"
                            placeholder="***"
                          />
                        </div>
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); handlePay(); }}
                        disabled={isProcessing}
                        className="w-full bg-[#0a84ff] hover:bg-[#007aff] text-white p-4 rounded-full text-[17px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98] mt-[6px]"
                      >
                        {isProcessing ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <span className="text-base">🔒</span>
                            <span>{t.payWithCard}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* PayPal Section */}
            <div 
              className={`bg-[#2c2c2e] rounded-2xl p-5 transition-all cursor-pointer border ${method === 'paypal' ? 'border-[#0a84ff]' : 'border-transparent'}`}
              onClick={() => setMethod('paypal')}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-[10px]">
                  <div className="w-9 h-7 bg-[#003087] rounded-md flex items-center justify-center">
                    <span className="text-white text-[18px] font-black italic font-serif leading-none">P</span>
                  </div>
                  <span className="text-[18px] font-semibold text-white">{t.payWithPaypal}</span>
                </div>
                <ChevronDown size={18} className={`text-[#8e8e93] transition-transform ${method === 'paypal' ? 'rotate-180' : ''}`} />
              </div>
              
              <AnimatePresence>
                {method === 'paypal' && (
                  <motion.div 
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-[10px]"
                  >
                    <p className="text-sm font-semibold text-[#ebebeb] mb-1">{t.fastSecure}</p>
                    <p className="text-[13px] text-[#8e8e93] leading-relaxed mb-4">{t.connectPaypal}</p>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handlePay(); }}
                      disabled={isProcessing}
                      className="w-full bg-[#0a84ff] hover:bg-[#007aff] text-white p-4 rounded-full text-[17px] font-semibold flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
                    >
                      {isProcessing ? (
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <>
                          <span className="text-base">🔒</span>
                          <span>{t.payWithPaypal}</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Secure Footer */}
            <div className="flex items-center justify-center gap-1.5 text-[#636366] text-xs py-2">
              <span>🔒</span>
              <span>{t.secureFooter}</span>
              <span className="ml-auto text-[18px] text-[#636366]">✦</span>
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
};
