import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, MessageSquare, Mail, User, Smartphone } from 'lucide-react';
import { Language } from '../types';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
  userEmail?: string | null;
  userId?: string;
  deviceId?: string;
  language?: Language;
  agentName?: string;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ 
  isOpen, 
  onClose, 
  onSubmit,
  userEmail,
  userId,
  deviceId,
  language = 'en',
  agentName
}) => {
  const [feedback, setFeedback] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const isHy = language === 'hy' || language === 'hy-east' || language === 'hy-west';
  const isEs = language === 'es';

  const t = {
    title: isHy ? 'Հետադարձ Կապ' : isEs ? 'Comentarios de Beta' : 'Beta Feedback',
    subtitle: isHy ? `Օգնեք մեզ բարելավել ${agentName || 'Ռիան'}` : isEs ? `Ayúdenos a mejorar ${agentName || 'Ria'}` : `Help us improve ${agentName || 'Ria'}`,
    prompt: isHy ? 'Մենք սիրով կլսենք ձեր կարծիքը:' : isEs ? '¡Nos encantaría escuchar sus comentarios! Escríbalos aquí y nos aseguraremos de que el equipo los vea.' : "We'd love to hear your feedback! Please type it here and we'll make sure the team sees it.",
    placeholder: isHy ? 'Ձեր մտքերը, առաջարկները կամ խնդիրները...' : isEs ? 'Sus pensamientos, sugerencias o problemas...' : 'Your thoughts, suggestions, or issues...',
    success: isHy ? 'Ուղարկված է:' : isEs ? '¡Comentarios Enviados!' : 'Feedback Sent!',
    idInfo: isHy ? 'Ինքնության Տվյալներ' : isEs ? 'Información de Identificación' : 'Identification Info',
    anonymous: isHy ? 'Անանուն Օգտատեր' : isEs ? 'Usuario Anónimo' : 'Anonymous User',
    unknown: isHy ? 'Անհայտ Սարք' : isEs ? 'Dispositivo Desconocido' : 'Unknown Device',
    submit: isHy ? 'Ուղարկել' : isEs ? 'Enviar Comentarios' : 'Submit Feedback',
    sendEmail: isHy ? 'Ուղարկել էլ. փոստով' : isEs ? 'Enviar por correo electrónico en su lugar' : 'Send via Email instead',
    linkedTo: isHy ? 'Կապված է:' : isEs ? 'Vinculado a: beta@ucp-demo.online' : 'Linked to: beta@ucp-demo.online'
  };

  const handleSubmit = async () => {
    if (!feedback.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onSubmit(feedback.trim());
      setIsSuccess(true);
      setFeedback('');
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Feedback submission failed:", error);
      alert("Failed to send feedback. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const mailtoLink = `mailto:beta@ucp-demo.online?subject=${agentName || 'Ria'} Beta Feedback&body=${encodeURIComponent(feedback)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-white w-full max-w-md rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="bg-indigo-600 p-6 text-white flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare size={20} className="text-white" />
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{t.title}</h3>
                  <p className="text-xs text-indigo-100 font-medium uppercase tracking-widest">{t.subtitle}</p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="space-y-2">
                <p className="text-sm text-gray-600 leading-relaxed font-medium">
                  {t.prompt}
                </p>
              </div>

              <div className="relative">
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder={t.placeholder}
                  className="w-full h-40 bg-gray-50 border border-gray-200 rounded-2xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:bg-white transition-all shadow-sm resize-none"
                  disabled={isSubmitting || isSuccess}
                />
                {isSuccess && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 bg-white/90 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl"
                  >
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-2">
                      <Send size={20} className="text-green-600" />
                    </div>
                    <p className="text-sm font-bold text-green-600 uppercase tracking-widest">{t.success}</p>
                  </motion.div>
                )}
              </div>

              {/* Identification Info */}
              <div className="bg-gray-50 rounded-2xl p-4 space-y-2 border border-gray-100">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">{t.idInfo}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <User size={12} className="text-gray-400" />
                  <span className="truncate">{userEmail || t.anonymous}</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Smartphone size={12} className="text-gray-400" />
                  <span className="truncate font-mono text-[10px]">{deviceId || t.unknown}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleSubmit}
                  disabled={!feedback.trim() || isSubmitting || isSuccess}
                  className={`w-full py-4 rounded-2xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 ${
                    feedback.trim() && !isSubmitting && !isSuccess
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    >
                      <Send size={20} />
                    </motion.div>
                  ) : (
                    <Send size={20} />
                  )}
                  <span>{t.submit}</span>
                </button>

                <a
                  href={mailtoLink}
                  className="w-full py-3 text-indigo-600 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-50 rounded-xl transition-all"
                >
                  <Mail size={14} />
                  <span>{t.sendEmail}</span>
                </a>
              </div>
              
              <p className="text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest">
                {t.linkedTo}
              </p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
