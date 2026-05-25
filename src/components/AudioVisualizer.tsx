import React, { useState } from 'react';
import { Mic, Send, HelpCircle, Camera, Video, DollarSign, Phone, Save, ChevronDown, Globe, Loader2, Car, CheckCircle2, AlertTriangle, XCircle, RefreshCw, MapPin } from 'lucide-react';
import { Language, MediaItem, VehicleInfo, VehicleIdentityLock } from '../types';
import { US_STATES } from '../constants';
import { motion, AnimatePresence } from 'framer-motion';

interface InputSectionProps {
  isListening: boolean;
  isConnecting?: boolean;
  isSpeaking: boolean;
  onToggleMic: () => void;
  selectedLanguage: Language;
  onLanguageChange: (lang: Language) => void;
  media: MediaItem[];
  onCapture: (type: 'photo' | 'video') => void;
  isConfirmed: boolean;
  onToggleConfirm: () => void;
  onSubmit: () => void;
  onSave: () => void;
  onReset: () => void;
  onFeedback: () => void;
  onHelp: () => void;
  onPay: (method: 'card' | 'paypal') => void;
  onSendText: (text: string) => void;
  hasApiKey: boolean;
  onSelectKey: () => void;
  onSelectMedia: (item: MediaItem) => void;
  transcription?: string;
  vehicle?: VehicleInfo;
  vehicleIdentityLock?: VehicleIdentityLock;
  plateState?: string;
  onPlateStateChange?: (state: string) => void;
  onUpdateVehicle?: (vehicle: VehicleInfo) => void;
  onUpdateState?: (update: Partial<any>) => void;
  agentName?: string;
}

const FlagArmenia = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0">
    <div className="absolute top-0 left-0 w-full h-1/3 bg-[#FF0000]" />
    <div className="absolute top-1/3 left-0 w-full h-1/3 bg-[#0033A0]" />
    <div className="absolute top-2/3 left-0 w-full h-1/3 bg-[#F2A800]" />
  </div>
);

const FlagUSA = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0 bg-[#002868]">
    <div className="absolute top-0 left-0 w-1/2 h-1/2 bg-[#002868]" />
    <div className="flex flex-col h-full w-full">
      {[...Array(7)].map((_, i) => (
        <div key={i} className={`h-[14.28%] w-full ${i % 2 === 0 ? 'bg-[#BF0A30]' : 'bg-white'}`} />
      ))}
    </div>
  </div>
);

const FlagSpain = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0 flex flex-col">
    <div className="h-1/4 bg-[#AA151B]" />
    <div className="h-1/2 bg-[#F1BF00]" />
    <div className="h-1/4 bg-[#AA151B]" />
  </div>
);

const FlagArabic = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0 flex flex-col bg-[#006C35]">
    <div className="flex h-full w-full items-center justify-center">
      <div className="w-3 h-0.5 bg-white rotate-[-20deg]" />
    </div>
  </div>
);

const FlagFarsi = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0 flex flex-col">
    <div className="h-1/3 bg-[#239B56]" />
    <div className="h-1/3 bg-white flex items-center justify-center">
      <div className="w-1.5 h-1.5 rounded-full bg-[#DA291C]" />
    </div>
    <div className="h-1/3 bg-[#DA291C]" />
  </div>
);

const FlagTagalog = () => (
  <div className="w-5 h-3.5 relative overflow-hidden rounded-sm shrink-0 flex flex-col">
    <div className="h-1/2 bg-[#0038A8]" />
    <div className="h-1/2 bg-[#CE1126]" />
    <div className="absolute top-0 left-0 h-full w-2/5 bg-white [clip-path:polygon(0%_0%,100%_50%,0%_100%)] flex items-center justify-center">
      <div className="w-1 h-1 rounded-full bg-[#FCD116] ml-[-2px]" />
    </div>
  </div>
);

export const AudioVisualizer: React.FC<InputSectionProps> = ({ 
  isListening, 
  isConnecting,
  isSpeaking, 
  onToggleMic,
  selectedLanguage,
  onLanguageChange,
  media,
  onCapture,
  isConfirmed,
  onToggleConfirm,
  onSubmit,
  onSave,
  onReset,
  onFeedback,
  onHelp,
  onPay,
  onSendText,
  hasApiKey,
  onSelectKey,
  onSelectMedia,
  transcription,
  vehicle,
  vehicleIdentityLock,
  plateState,
  onPlateStateChange,
  onUpdateVehicle,
  onUpdateState,
  agentName
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showVehicleEditor, setShowVehicleEditor] = useState(false);
  const [galleryType, setGalleryType] = useState<'photo' | 'video'>('photo');
  const [inputText, setInputText] = useState('');
  const [paymentView, setPaymentView] = useState<'default' | 'expanded' | 'paypal' | 'card'>('default');

  const handleCall = () => {
    window.location.href = 'tel:8185454100';
  };

  const handleHelp = () => {
    onHelp();
  };

  const handlePay = () => {
    // Payment processing is not enabled in this PoC version.
    console.log("Payment clicked - not enabled in PoC");
  };

  const handleSave = () => {
    onSave();
  };

  const handleSendText = () => {
    if (inputText.trim()) {
      onSendText(inputText.trim());
      setInputText('');
    }
  };

  const languages: { id: Language; label: string; icon: React.ReactNode }[] = [
    { id: 'en', label: 'English', icon: <FlagUSA /> },
    { id: 'es', label: 'Español', icon: <FlagSpain /> },
    { id: 'ar', label: 'العربية', icon: <FlagArabic /> },
    { id: 'fa', label: 'فارسی', icon: <FlagFarsi /> },
    { id: 'tl', label: 'Tagalog', icon: <FlagTagalog /> },
    { id: 'hy-east', label: 'Eastern Armenian', icon: <FlagArmenia /> },
    { id: 'hy-west', label: 'Western Armenian', icon: <FlagArmenia /> },
    { id: 'auto', label: 'Auto-detect', icon: <Globe size={14} className="text-gray-500" /> },
  ];

  const currentLang = languages.find(l => l.id === selectedLanguage) || languages[0];

  const isHy = selectedLanguage === 'hy' || selectedLanguage === 'hy-east' || selectedLanguage === 'hy-west';
  const isEs = selectedLanguage === 'es';
  const isAr = selectedLanguage === 'ar';
  const isFa = selectedLanguage === 'fa';
  const isTl = selectedLanguage === 'tl';

  const t = {
    newOrder: isHy ? 'Նոր Պատվեր' : isEs ? 'Nuevo Pedido' : isAr ? 'طلب جديد' : isFa ? 'سفارش جدید' : isTl ? 'Bagong Order' : 'New Order',
    listening: isHy ? `${agentName || 'Ռիան'} լսում է...` : isEs ? `${agentName || 'Ria'} está escuchando...` : isAr ? `${agentName || 'ريա'} تستمع...` : isFa ? `${agentName || 'ریا'} در حال شنیدن است...` : isTl ? `Nakikinig si ${agentName || 'Ria'}...` : `${agentName || 'Ria'} is listening...`,
    connecting: isHy ? 'Միանում է...' : isEs ? `Conectando con ${agentName || 'Ria'}...` : isAr ? 'جاري الاتصال...' : isFa ? `در حال اتصال به ${agentName || 'ریا'}...` : isTl ? `Kumokonekta kay ${agentName || 'Ria'}...` : `Connecting to ${agentName || 'Ria'}...`,
    speaking: isHy ? `${agentName || 'Ռիան'} խոսում է...` : isEs ? `${agentName || 'Ria'} está hablando...` : isAr ? `${agentName || 'ريա'} تتحدث...` : isFa ? `${agentName || 'ریا'} در حال صحبت است...` : isTl ? `Nagsasalita si ${agentName || 'Ria'}...` : `${agentName || 'Ria'} is speaking...`,
    tapToSpeak: isHy ? 'Սեղմեք խոսելու համար' : isEs ? 'Toca el micro para hablar' : isAr ? 'اضغط للتحدث' : isFa ? 'برای صحبت کردن ضربه بزنید' : isTl ? 'I-tap ang mic para magsalita' : 'Tap mic to speak',
    placeholder: isHy ? 'Մուտքագրեք հարցը այստեղ...' : isEs ? 'Escribe tu solicitud aquí...' : isAr ? 'اكتب طلبك هنا...' : isFa ? 'درخواست خود را اینجا بنویسید...' : isTl ? 'I-type ang request dito...' : 'Type request here...',
    confirm: isHy ? 'Հաստատում եմ, որ պատվերը ճիշտ է' : isEs ? 'Confirmo que este pedido es correcto' : isAr ? 'أؤكد أن هذا الطلب دقيق' : isFa ? 'تایید می‌کنم که این سفارش دقیق است' : isTl ? 'Kinukumpirma ko na tama ang order na ito' : 'I confirm this order is accurate',
    submit: isHy ? 'Ուղարկել Պատվերը' : isEs ? 'Enviar Pedido' : isAr ? 'إرسال الطلب' : isFa ? 'ثبت سفارش' : isTl ? 'I-submit ang Order' : 'Submit Order',
    help: isHy ? 'Օգնություն' : isEs ? 'Ayuda' : isAr ? 'مساعدة' : isFa ? 'کمկ' : isTl ? 'Tulong' : 'App-Help',
    photo: isHy ? 'Լուսանկար' : isEs ? 'Foto' : isAr ? 'صورة' : isFa ? 'عکس' : isTl ? 'Larawan' : 'Photo',
    video: isHy ? 'Տեսանյութ' : isEs ? 'Video' : isAr ? 'فيديو' : isFa ? 'ویدիո' : isTl ? 'Video' : 'Video',
    pay: isHy ? 'Վճարել հիմա' : isEs ? 'PAGAR AHORA' : isAr ? 'ادفع الآن' : isFa ? 'پرداخت آنի' : isTl ? 'MAGBAYAD NGAYON' : 'PAY NOW',
    save: isHy ? 'Պահպանել' : isEs ? 'Guardar en el teléfono' : isAr ? 'حفظ في الهاتف' : isFa ? 'ذխիրե դեր գոշի' : isTl ? 'I-save sa Phone' : 'Save To Phone',
    call: isHy ? 'Զանգահարել' : isEs ? 'Llamar al taller' : isAr ? 'اتصل بالورشة' : isFa ? 'تماս բա թամիրգահ' : isTl ? 'Tumawag sa Shop' : 'Call Shop',
    gallery: isHy ? 'Պատկերասրահ' : isEs ? 'Galería' : isAr ? 'المعرض' : isFa ? 'գալերի' : isTl ? 'Gallery' : 'Gallery',
    photos: isHy ? 'Լուսանկարներ' : isEs ? 'Fotos' : isAr ? 'صور' : isFa ? 'աքսեր' : isTl ? 'Mga Larawan' : 'Photos',
    videos: isHy ? 'Տեսանյութեր' : isEs ? 'Videos' : isAr ? 'فيديوهات' : isFa ? 'վիդեոներ' : isTl ? 'Mga Video' : 'Videos',
    noMedia: (type: string) => isHy ? `${type} չկա` : isEs ? `No se han capturado ${type}s` : isAr ? `لا توجد ${type}` : isFa ? `${type} یافت نشդ` : isTl ? `Walang nakuhang ${type}` : `No ${type}s Captured`,
    feedback: isHy ? 'Հետադարձ կապ' : isEs ? 'Comentarios' : isAr ? 'ملاحظات' : isFa ? 'بازխորդ' : isTl ? 'Feedback' : 'Feedback',
    editVehicle: isHy ? 'Խմբագրել մեքենան' : isEs ? 'Editar detalles del vehículo' : isAr ? 'تعديل بيانات المركبة' : isFa ? 'ویرայշ ջոզիյաթ խոդրո' : isTl ? 'I-edit ang Detalye ng Sasakyan' : 'Edit Vehicle Details',
    year: isHy ? 'Տարեթիվ' : isEs ? 'Año' : isAr ? 'السنة' : isFa ? 'սալ' : isTl ? 'Taon' : 'Year',
    make: isHy ? 'Մակնիշ' : isEs ? 'Marca' : isAr ? 'الماركة' : isFa ? 'սազանդե' : isTl ? 'Make' : 'Make',
    model: isHy ? 'Մոդել' : isEs ? 'Modelo' : isAr ? 'الموديل' : isFa ? 'մոդել' : isTl ? 'Modelo' : 'Model',
    trim: isHy ? 'Կոմպլեկտացիա' : isEs ? 'Versión' : isAr ? 'الفئة' : isFa ? 'թիպ' : isTl ? 'Trim' : 'Trim',
    vin: isHy ? 'VIN' : isEs ? 'VIN' : isAr ? 'رقم الهيكل' : isFa ? 'շոմարե շասի' : isTl ? 'VIN' : 'VIN',
    plate: isHy ? 'Պետհամարանիշ' : isEs ? 'Placa' : isAr ? 'اللوحة' : isFa ? 'փլաք' : isTl ? 'Plaka' : 'Plate',
    confirmVehicle: isHy ? 'Հաստատել մեքենան' : isEs ? 'Confirmar Vehículo' : isAr ? 'تأكيد المركبة' : isFa ? 'թայիդ խոդրո' : isTl ? 'Kumpirmahin ang Sasakyan' : 'Confirm Vehicle',
    resetVehicle: isHy ? 'Վերակայել' : isEs ? 'Restablecer' : isAr ? 'إعادة تعيين' : isFa ? 'բազնեշանի' : isTl ? 'I-reset' : 'Reset'
  };

  return (
    <div className="h-full bg-white flex flex-col p-4 md:p-6 font-sans text-gray-800 overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={onReset}
            className="text-[10px] font-bold uppercase tracking-widest text-[#5B89B1] hover:text-[#4A7194] transition-colors border border-[#5B89B1]/20 rounded-full px-3 py-1"
          >
            {t.newOrder}
          </button>
          <button 
            onClick={onFeedback}
            className="text-[10px] font-bold uppercase tracking-widest text-indigo-500 hover:text-indigo-600 transition-colors border border-indigo-500/20 rounded-full px-3 py-1 flex items-center gap-1"
          >
            <HelpCircle size={10} />
            {t.feedback}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-start pt-2 md:pt-4 max-w-md mx-auto w-full space-y-4 md:space-y-6">
        {/* Mic Button Area */}
        <div className="relative shrink-0 flex flex-col items-center">
          {/* Language Toggle - Positioned right above microphone icon */}
          <div className="relative z-50 mb-4">
            <div 
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 bg-white/80 backdrop-blur-sm border border-gray-100 rounded-full px-4 py-2 cursor-pointer hover:bg-white transition-all shadow-sm"
            >
              {currentLang.icon}
              <span className="text-xs font-bold uppercase tracking-widest">{currentLang.label}</span>
              <ChevronDown size={14} className={`text-gray-400 transition-transform ${showLangMenu ? 'rotate-180' : ''}`} />
            </div>

            {showLangMenu && (
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-40 bg-white border border-gray-100 rounded-xl shadow-2xl z-50 py-2">
                {languages.map((lang) => (
                  <div
                    key={lang.id}
                    onClick={() => {
                      onLanguageChange(lang.id);
                      setShowLangMenu(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-2.5 text-xs font-bold uppercase tracking-wider cursor-pointer hover:bg-gray-50 ${
                      selectedLanguage === lang.id ? 'bg-blue-50 text-[#5B89B1]' : 'text-gray-500'
                    }`}
                  >
                    {lang.icon}
                    <span>{lang.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            onClick={onToggleMic}
            disabled={isConnecting}
            className={`w-28 h-28 md:w-36 md:h-36 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 touch-manipulation ${
              isConnecting ? 'bg-gray-400 text-white cursor-wait' :
              isListening ? 'bg-red-500 text-white scale-110' : 'bg-[#5B89B1] text-white hover:bg-[#4A7194]'
            }`}
          >
            {isConnecting ? (
              <Loader2 size={48} className="animate-spin" />
            ) : (
              <>
                <Mic size={isListening ? 48 : 40} className="md:hidden" />
                <Mic size={56} className="hidden md:block" />
              </>
            )}
          </button>
        </div>

        {/* Vehicle Info Editor */}
        {vehicle && (
          <div className="w-full max-w-sm px-2">
            <div className={`bg-gray-50 border rounded-2xl p-4 shadow-sm transition-colors ${
              vehicleIdentityLock?.isConfirmed ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Car className={`w-4 h-4 ${vehicleIdentityLock?.isConfirmed ? 'text-green-600' : 'text-[#5B89B1]'}`} />
                  <span className="text-xs font-bold uppercase tracking-widest text-gray-500">
                    {vehicle.make ? `${vehicle.year} ${vehicle.make} ${vehicle.model}` : t.editVehicle}
                  </span>
                  {vehicleIdentityLock?.isConfirmed && (
                    <CheckCircle2 size={12} className="text-green-600" />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setShowVehicleEditor(!showVehicleEditor)}
                    className="text-[10px] font-bold text-[#5B89B1] uppercase tracking-widest hover:underline"
                  >
                    {showVehicleEditor ? 'Close' : 'Edit'}
                  </button>
                  {vehicleIdentityLock && (
                    <button 
                      onClick={() => onUpdateState?.({ vehicle: {}, vehicleIdentityLock: null })}
                      className="text-[10px] font-bold text-red-500 uppercase tracking-widest hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={10} />
                      {t.resetVehicle}
                    </button>
                  )}
                </div>
              </div>

              {/* Identification Status Banner */}
              {vehicleIdentityLock && !vehicleIdentityLock.isConfirmed && (
                <div className={`mb-3 p-2 rounded-lg flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider ${
                  vehicleIdentityLock.status === 'CONFIRMATION_REQUIRED' ? 'bg-blue-100 text-blue-700' :
                  vehicleIdentityLock.status === 'INVALID' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {vehicleIdentityLock.status === 'CONFIRMATION_REQUIRED' ? <CheckCircle2 size={12} /> :
                   vehicleIdentityLock.status === 'INVALID' ? <XCircle size={12} /> :
                   <AlertTriangle size={12} />}
                  <span>{vehicleIdentityLock.status.replace(/_/g, ' ')}</span>
                  
                  {vehicleIdentityLock.status === 'CONFIRMATION_REQUIRED' && (
                    <button 
                      onClick={() => onUpdateState?.({ vehicleIdentityLock: { isConfirmed: true } })}
                      className="ml-auto bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
                    >
                      {t.confirmVehicle}
                    </button>
                  )}
                </div>
              )}

              {showVehicleEditor && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.year}</label>
                    <input 
                      type="text" 
                      value={vehicle.year || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, year: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.make}</label>
                    <input 
                      type="text" 
                      value={vehicle.make || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, make: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.model}</label>
                    <input 
                      type="text" 
                      value={vehicle.model || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, model: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.trim}</label>
                    <input 
                      type="text" 
                      value={vehicle.trim || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, trim: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                    />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.vin}</label>
                    <input 
                      type="text" 
                      value={vehicle.vin || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, vin: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                      placeholder="17-character VIN"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.plate}</label>
                    <input 
                      type="text" 
                      value={vehicle.licensePlate || ''} 
                      onChange={(e) => onUpdateVehicle?.({ ...vehicle, licensePlate: e.target.value })}
                      className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1]"
                      placeholder="License Plate"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">State</label>
                    <div className="relative">
                      <select
                        value={plateState || 'CA'}
                        onChange={(e) => onPlateStateChange?.(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-lg py-2 px-3 text-xs focus:outline-none focus:ring-1 focus:ring-[#5B89B1] appearance-none"
                      >
                        {US_STATES.map(s => (
                          <option key={s.code} value={s.code}>{s.code} - {s.name}</option>
                        ))}
                      </select>
                      <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                        <MapPin size={12} />
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual Text Input Field */}
        <div className="w-full max-w-sm px-2">
          <div className="relative group">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendText()}
              placeholder={t.placeholder}
              className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-4 pl-5 pr-14 text-sm focus:outline-none focus:ring-2 focus:ring-[#5B89B1]/50 focus:bg-white transition-all shadow-sm"
            />
            <button
              onClick={handleSendText}
              disabled={!inputText.trim()}
              className={`absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                inputText.trim() 
                  ? 'bg-[#5B89B1] text-white shadow-md active:scale-90' 
                  : 'bg-gray-100 text-gray-300 cursor-not-allowed'
              }`}
            >
              <Send size={18} />
            </button>
          </div>
          <p className="mt-2 text-[9px] text-center text-gray-400 font-bold uppercase tracking-widest">
            Enter Part Name or Service Details
          </p>
        </div>

        {/* Status Indicator */}
        <div className="h-6 flex items-center justify-center">
          {isConnecting && (
            <div className="flex items-center gap-2 text-gray-400 animate-pulse">
              <Loader2 size={12} className="animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.connecting}</span>
            </div>
          )}
          {isListening && !isConnecting && (
            <div className="flex items-center gap-2 text-red-500">
              <div className="w-1.5 h-1.5 bg-red-500 rounded-full" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.listening}</span>
            </div>
          )}
          {isSpeaking && !isConnecting && (
            <div className="flex items-center gap-2 text-green-500">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{t.speaking}</span>
            </div>
          )}
          {!isListening && !isSpeaking && (
            <span className="text-[10px] font-bold uppercase tracking-widest text-gray-300">{t.tapToSpeak}</span>
          )}
        </div>

        {/* Action Buttons Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4 w-full pb-4">
          <button 
            onClick={() => {
              console.log("Photo capture clicked");
              onCapture('photo');
            }}
            className="flex items-center justify-center gap-2 py-4 px-2 md:px-4 bg-[#6799B8] text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#5B89B1] transition-colors active:scale-95 shadow-md touch-manipulation"
          >
            <Camera size={16} className="md:size-[18px]" />
            <span className="truncate">{t.photo}</span>
          </button>
          <button 
            onClick={() => {
              console.log("Video capture clicked");
              onCapture('video');
            }}
            className="flex items-center justify-center gap-2 py-4 px-2 md:px-4 bg-[#6799B8] text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#5B89B1] transition-colors active:scale-95 shadow-md touch-manipulation"
          >
            <Video size={16} className="md:size-[18px]" />
            <span className="truncate">{t.video}</span>
          </button>
          {paymentView === 'expanded' ? (
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setPaymentView('paypal');
                  onPay('paypal');
                }}
                className="flex-1 flex items-center justify-center py-4 px-1 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md bg-[#FFC439] text-black hover:bg-[#E5AF33]"
              >
                PAYPAL
              </button>
              <button
                onClick={() => {
                  setPaymentView('card');
                  onPay('card');
                }}
                className="flex-1 flex items-center justify-center py-4 px-1 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-md bg-[#0070BA] text-white hover:bg-[#005EA3]"
              >
                CARD
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setPaymentView('expanded')}
              className={`flex items-center justify-center gap-2 py-4 px-2 md:px-4 rounded-xl text-[10px] md:text-[11px] font-bold uppercase tracking-widest transition-all leading-tight text-center active:scale-95 shadow-md touch-manipulation ${
                paymentView === 'paypal' ? 'bg-[#FFC439] text-black hover:bg-[#E5AF33]' :
                paymentView === 'card' ? 'bg-[#0070BA] text-white hover:bg-[#005EA3]' :
                'bg-[#008080] text-white hover:bg-[#006666]'
              }`}
            >
              <DollarSign size={16} />
              {t.pay}
            </button>
          )}
          <button 
            onClick={handleCall}
            className="flex items-center justify-center gap-2 py-4 px-2 md:px-4 bg-green-500 text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-green-600 transition-colors shadow-md active:scale-95 touch-manipulation"
            title="Call Counter-clerk"
          >
            <Phone size={16} className="md:size-[18px]" />
            <span className="truncate">{t.call}</span>
          </button>
          <button 
            onClick={() => {
              console.log("Help clicked");
              onHelp();
            }}
            className="flex items-center justify-center gap-2 py-4 px-2 md:px-4 bg-[#6799B8] text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#5B89B1] transition-colors active:scale-95 shadow-md touch-manipulation"
          >
            <HelpCircle size={16} className="md:size-[18px]" />
            <span className="truncate">{t.help}</span>
          </button>
          <button 
            onClick={handleSave}
            className="flex items-center justify-center gap-2 py-4 px-2 md:px-4 bg-[#6799B8] text-white rounded-xl text-xs md:text-sm font-bold uppercase tracking-widest hover:bg-[#5B89B1] transition-colors active:scale-95 shadow-md touch-manipulation"
          >
            <Save size={16} className="md:size-[18px]" />
            <span className="truncate">{t.save}</span>
          </button>
        </div>

        {/* Gallery */}
        <div className="w-full pt-4">
          <div className="flex items-center justify-center gap-6 mb-4">
            <p className="text-[20px] font-bold uppercase tracking-widest text-gray-400 shrink-0">{t.gallery}</p>
            <div className="flex bg-gray-100 p-1 rounded-lg shrink-0">
              <button 
                onClick={() => setGalleryType('photo')}
                className={`px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  galleryType === 'photo' ? 'bg-white text-[#5B89B1] shadow-sm' : 'text-gray-400'
                }`}
              >
                {t.photos}
              </button>
              <button 
                onClick={() => setGalleryType('video')}
                className={`px-6 py-2.5 text-[12px] font-bold uppercase tracking-wider rounded-md transition-all ${
                  galleryType === 'video' ? 'bg-white text-[#5B89B1] shadow-sm' : 'text-gray-400'
                }`}
              >
                {t.videos}
              </button>
            </div>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar min-h-[80px]">
            {media.filter(m => m.type === (galleryType === 'photo' ? 'photo' : 'video')).length === 0 ? (
              <div className="w-full py-6 border-2 border-dashed border-gray-100 rounded-lg flex flex-col items-center justify-center text-gray-300">
                {galleryType === 'photo' ? <Camera size={20} className="mb-1 opacity-20" /> : <Video size={20} className="mb-1 opacity-20" />}
                <span className="text-[9px] uppercase tracking-widest">{t.noMedia(galleryType === 'photo' ? t.photo : t.video)}</span>
              </div>
            ) : (
              media
                .filter(m => m.type === (galleryType === 'photo' ? 'photo' : 'video'))
                .map((item) => (
                  <div 
                    key={item.id} 
                    onClick={() => onSelectMedia(item)}
                    className="w-20 h-20 rounded-lg bg-gray-200 shrink-0 overflow-hidden relative group cursor-pointer border border-gray-100 shadow-sm"
                  >
                    <img 
                      src={item.type === 'video' ? (item.thumbnailUrl || item.url) : item.url} 
                      alt="Gallery item" 
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                      referrerPolicy="no-referrer"
                    />
                    {item.type === 'video' && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Video size={16} className="text-white fill-white" />
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/40 text-[8px] text-white text-center opacity-0 group-hover:opacity-100 transition-opacity">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
