import React, { useEffect, useState } from 'react';
import { Language, OrderState } from '../types';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { Clock, CheckCircle2, AlertCircle, Printer, Trash2, Download } from 'lucide-react';

interface OrderSummaryProps {
  user: any;
  state: OrderState;
  onSubmit: () => void;
  onSave: () => void;
  onReset: () => void;
  onLoadOrder?: (order: OrderState) => void;
  onToggleConfirm?: () => void;
  language: Language;
  inMemoryOrders?: OrderState[];
  historyOrders?: any[];
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ 
  user, 
  state, 
  onSubmit, 
  onSave, 
  onReset, 
  onLoadOrder, 
  onToggleConfirm, 
  language, 
  inMemoryOrders = [],
  historyOrders = []
}) => {
  const [recentOrders, setRecentOrders] = useState<OrderState[]>([]);
  const [activeTab, setActiveTab] = useState<'current' | 'recent' | 'history'>('current');
  const [isApproved, setIsApproved] = useState(state.isConfirmed || false);
  const [showFakePrompt, setShowFakePrompt] = useState(false);

  useEffect(() => {
    setIsApproved(state.isConfirmed || false);
  }, [state.isConfirmed]);

  const isHy = language === 'hy' || language === 'hy-east' || language === 'hy-west';
  const isEs = language === 'es';

  const t = {
    summary: isHy ? 'Պատվեր' : isEs ? 'Pedido' : 'Order',
    current: isHy ? 'Ընթացիկ' : isEs ? 'Actual' : 'Current',
    recent: isHy ? 'Վերջին' : isEs ? 'Reciente' : 'Recent',
    history: isHy ? 'Պատմություն' : isEs ? 'Historial' : 'History',
    status: isHy ? 'Կարգավիճակ' : isEs ? 'Estado del Pedido' : 'Order Status',
    vehicle: isHy ? 'Մեքենա' : isEs ? 'Vehículo' : 'Vehicle',
    vin: isHy ? 'VIN' : isEs ? 'VIN' : 'VIN',
    plate: isHy ? 'Պետհամարանիշ' : isEs ? 'Placa' : 'License Plate',
    parts: isHy ? 'Պահեստամասեր' : isEs ? 'Partes y Fluidos' : 'Parts & Fluids',
    mechanic: isHy ? 'Մեխանիկ' : isEs ? 'Mecánico' : 'Mechanic',
    shop: isHy ? 'Արհեստանոց' : isEs ? 'Taller' : 'Shop',
    noItems: isHy ? 'Դեռ ոչինչ չկա' : isEs ? 'Aún no se han añadido artículos' : 'No items added yet',
    clear: isHy ? 'Ջնջել' : isEs ? 'Limpiar' : 'Clear',
    print: isHy ? 'Տպել' : isEs ? 'Imprimir' : 'Print',
    review: isHy ? 'Վերանայել Պատվերը' : isEs ? 'Revisar detalles del pedido' : 'Review Full Order Details',
    submit: isHy ? 'Ուղարկել Պատվերը' : isEs ? 'Enviar Pedido' : 'Submit Order',
    noRecent: isHy ? 'Վերջին պատվերներ չկան' : isEs ? 'No se encontraron pedidos recientes' : 'No recent orders found',
    items: isHy ? 'ապրանք' : isEs ? 'artículos' : 'items',
    loadDraft: isHy ? 'Բեռնել որպես սևագիր' : isEs ? 'Cargar como borrador' : 'Load as Draft',
    saveToPhone: isHy ? 'Պահպանել հեռախոսում' : isEs ? 'Guardar en el teléfono' : 'Save to Phone',
    confirm: isHy ? 'Հաստատել պատվերը' : isEs ? 'Confirmar detalles del pedido' : 'Confirm Order Details',
    media: isHy ? 'Մեդիա' : isEs ? 'Multimedia' : 'Media',
    noHistory: isHy ? 'Պատմություն չկա' : isEs ? 'No se encontró historial para este dispositivo' : 'No history found for this device',
    approveMessage: isHy ? 'Ես ամբողջությամբ վերանայել և հաստատում եմ այս պատվերի ճշգրտությունը' : isEs ? 'He revisado completamente y apruebo la exactitud de este pedido' : 'I have fully reviewed and approve the accuracy of this order',
    confirmButton: isHy ? 'Հաստատել Պատվերը' : isEs ? 'Confirmar Pedido' : 'Confirm Order',
    fakePromptTitle: isHy ? 'Պատվերը Հաստատված է' : isEs ? 'Pedido Confirmado' : 'Order Confirmed',
    fakePromptBody: isHy ? 'Ձեր պատվերը հաջողությամբ մշակվել է և ուղարկվել է պահեստ:' : isEs ? 'Su pedido ha sido procesado con éxito y enviado al almacén.' : 'Your order has been successfully processed and sent to the warehouse.',
    close: isHy ? 'Փակել' : isEs ? 'Cerrar' : 'Close'
  };

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as any[];
      
      // Sort in memory to avoid index requirements
      const sortedOrders = orders.sort((a, b) => {
        const timeA = a.createdAt?.toMillis?.() || a.createdAt || 0;
        const timeB = b.createdAt?.toMillis?.() || b.createdAt || 0;
        return timeB - timeA;
      });

      setRecentOrders(sortedOrders);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => unsubscribe();
  }, [user]);

  const allRecentOrders = [...inMemoryOrders, ...recentOrders.filter(ro => !inMemoryOrders.find(imo => imo.id === ro.id))].slice(0, 10);

  return (
    <div className="h-full bg-white flex flex-col font-sans text-gray-800">
      <div className="p-4 md:p-6 pb-2">
        <h2 className="text-[40px] font-bold mb-4">{t.summary}</h2>
        
        <div className="flex bg-gray-100 p-1 rounded-lg mb-4">
          <button 
            onClick={() => setActiveTab('current')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'current' ? 'bg-white text-[#5B89B1] shadow-sm' : 'text-gray-400'
            }`}
          >
            {t.current}
          </button>
          <button 
            onClick={() => setActiveTab('recent')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'recent' ? 'bg-white text-[#5B89B1] shadow-sm' : 'text-gray-400'
            }`}
          >
            {t.recent}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-1.5 text-xs font-bold uppercase tracking-wider rounded-md transition-all ${
              activeTab === 'history' ? 'bg-white text-[#5B89B1] shadow-sm' : 'text-gray-400'
            }`}
          >
            {t.history}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 md:px-6">
        {activeTab === 'current' ? (
          <div className="border border-gray-200 rounded-lg p-6 space-y-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{t.status}</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={onSave}
                  className="p-1.5 text-[#5B89B1] hover:bg-blue-50 rounded-md transition-colors"
                  title={t.saveToPhone}
                >
                  <Download size={14} />
                </button>
                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                  state.status === 'confirmed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'
                }`}>
                  {state.status}
                </span>
              </div>
            </div>

            {state.needsCounterReview && state.status !== 'confirmed' && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-center gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[11px] font-medium text-amber-700 leading-tight">
                  {isHy ? 'Այս պատվերը կարիք ունի վերանայման պահեստի կողմից:' : isEs ? 'Este pedido requiere revisión del almacén para verificar el ajuste.' : 'This order requires counter review for fitment verification.'}
                </p>
              </div>
            )}

            {/* Vehicle */}
            <div>
              <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t.vehicle}</p>
              <p className="text-sm font-medium">
                {state.vehicle.year || '-'} {state.vehicle.make || '-'} {state.vehicle.model || '-'} {state.vehicle.trim && <span className="text-gray-500 font-normal">({state.vehicle.trim})</span>}
              </p>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {state.vehicle.vin && (
                  <p className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    <span className="opacity-50 mr-1">{t.vin}:</span>{state.vehicle.vin}
                  </p>
                )}
                {state.vehicle.licensePlate && (
                  <p className="text-[10px] font-mono text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                    <span className="opacity-50 mr-1">{t.plate}:</span>{state.vehicle.licensePlate}
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                {state.vehicle.engine && (
                  <p className="text-[10px] font-mono text-gray-400">Eng: {state.vehicle.engine}</p>
                )}
                {state.vehicle.drive && (
                  <p className="text-[10px] font-mono text-gray-400">Drive: {state.vehicle.drive}</p>
                )}
                {state.vehicle.transmission && (
                  <p className="text-[10px] font-mono text-gray-400">Trans: {state.vehicle.transmission}</p>
                )}
              </div>
            </div>

            {/* Parts */}
            <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
              <p className="text-[10px] uppercase tracking-widest font-black text-gray-400 mb-3">{t.parts}</p>
              <div className="space-y-4">
                {state.parts.length === 0 && state.fluids.length === 0 && (
                  <p className="text-sm text-gray-300 italic">{t.noItems}</p>
                )}
                {state.parts.map((p, idx) => (
                  <div key={`part-${idx}`} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900 leading-tight">{p.name}</p>
                      <span className="text-[10px] font-black bg-[#5B89B1]/10 text-[#5B89B1] px-2 py-0.5 rounded-full shrink-0">x{p.quantity}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {p.brand && (
                        <span className="text-[9px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-tighter">
                          Brand: {p.brand}
                        </span>
                      )}
                      {p.notes && (
                        <p className="text-[10px] text-gray-500 italic w-full mt-1">Note: {p.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
                {state.fluids.map((f, idx) => (
                  <div key={`fluid-${idx}`} className="flex flex-col border-b border-gray-100 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-bold text-gray-900 leading-tight uppercase tracking-tight">{f.subcategory.replace('_', ' ')}</p>
                      <span className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full shrink-0">{f.quantity || '1 UNIT'}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {f.brand && (
                        <span className="text-[9px] font-bold bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 uppercase tracking-tighter">
                          Brand: {f.brand}
                        </span>
                      )}
                      {f.type && (
                        <span className="text-[9px] font-bold bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded text-[#5B89B1] uppercase tracking-tighter">
                          {f.type}
                        </span>
                      )}
                      {f.spec && (
                        <span className="text-[9px] font-bold bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-amber-600 uppercase tracking-tighter">
                          Spec: {f.spec}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Mechanic Info */}
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-50">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t.mechanic}</p>
                <p className="text-xs font-medium truncate">{state.mechanicName || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-1">{t.shop}</p>
                <p className="text-xs font-medium truncate">{state.shopName || '-'}</p>
              </div>
            </div>

            {/* Media Preview */}
            {state.media.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 mb-2">{t.media} ({state.media.length})</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                  {state.media.map((m) => (
                    <div key={m.id} className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                      <img 
                        src={m.type === 'video' ? m.thumbnailUrl : m.url} 
                        alt="media" 
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {m.type === 'video' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                          <div className="w-4 h-4 bg-white rounded-full flex items-center justify-center">
                            <div className="w-0 h-0 border-t-[3px] border-t-transparent border-l-[5px] border-l-[#5B89B1] border-b-[3px] border-b-transparent ml-0.5" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'recent' ? (
          <div className="space-y-3 mb-6">
            {allRecentOrders.length === 0 ? (
              <div className="py-12 text-center">
                <Clock size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">{t.noRecent}</p>
              </div>
            ) : (
              allRecentOrders.map((order: any, idx) => (
                <div key={order.id || `recent-${idx}`} className="p-4 border border-gray-100 rounded-lg hover:border-[#5B89B1]/30 transition-colors cursor-pointer group relative">
                  {inMemoryOrders.includes(order) && (
                    <div className="absolute top-2 right-2 flex items-center gap-1 bg-blue-50 text-[#5B89B1] text-[8px] font-bold uppercase px-1.5 py-0.5 rounded">
                      <Clock size={8} />
                      New
                    </div>
                  )}
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-gray-900">
                      {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}
                    </p>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-gray-400">
                      {(order.parts?.length || 0) + (order.fluids?.length || 0)} {t.items}
                      {order.media?.length > 0 && ` • ${order.media.length} ${t.media}`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.createdAt && typeof order.createdAt.toDate === 'function' 
                        ? order.createdAt.toDate().toLocaleDateString() 
                        : order.createdAt ? new Date(order.createdAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadOrder?.(order);
                    }}
                    className="mt-3 w-full py-2 px-3 bg-[#5B89B1]/10 text-[#5B89B1] rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#5B89B1]/20 transition-colors"
                  >
                    {t.loadDraft}
                  </button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3 mb-6">
            {historyOrders.length === 0 ? (
              <div className="py-12 text-center">
                <Clock size={32} className="mx-auto text-gray-200 mb-2" />
                <p className="text-xs text-gray-400">{t.noHistory}</p>
              </div>
            ) : (
              historyOrders.map((order: any, idx) => (
                <div key={order.id || `history-${idx}`} className="p-4 border border-gray-100 rounded-lg hover:border-[#5B89B1]/30 transition-colors cursor-pointer group relative">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs font-bold text-gray-900">
                      {order.vehicle?.year} {order.vehicle?.make} {order.vehicle?.model}
                    </p>
                    <CheckCircle2 size={14} className="text-green-500" />
                  </div>
                  <div className="flex justify-between items-center">
                    <p className="text-[10px] text-gray-400">
                      {(order.parts?.length || 0) + (order.fluids?.length || 0)} {t.items}
                      {order.media?.length > 0 && ` • ${order.media.length} ${t.media}`}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {order.updatedAt && typeof order.updatedAt.toDate === 'function' 
                        ? order.updatedAt.toDate().toLocaleDateString() 
                        : order.updatedAt ? new Date(order.updatedAt).toLocaleDateString() : '-'}
                    </p>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      onLoadOrder?.(order);
                    }}
                    className="mt-3 w-full py-2 px-3 bg-[#5B89B1]/10 text-[#5B89B1] rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-[#5B89B1]/20 transition-colors"
                  >
                    {t.loadDraft}
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeTab === 'current' && (
        <div className="p-4 md:p-6 pt-0 space-y-4 pb-8 md:pb-6 border-t border-gray-100 bg-white">
          <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100/50">
            <input 
              type="checkbox" 
              id="approve-order"
              checked={isApproved}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsApproved(checked);
                if (onToggleConfirm) onToggleConfirm();
              }}
              className="mt-1 w-4 h-4 text-[#5B89B1] border-gray-300 rounded focus:ring-[#5B89B1]"
            />
            <label htmlFor="approve-order" className="text-[11px] font-medium text-gray-600 leading-tight cursor-pointer">
              {t.approveMessage}
            </label>
          </div>

          <div className="flex gap-2">
            <button 
              onClick={() => {
                onReset();
                setIsApproved(false);
              }}
              className="flex-1 py-2 px-3 bg-white hover:bg-red-50 text-red-500 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border border-red-100 flex items-center justify-center gap-2"
            >
              <Trash2 size={12} />
              {t.clear}
            </button>
            <button 
              onClick={() => window.print()}
              className="flex-1 py-2 px-3 bg-white hover:bg-gray-50 text-gray-600 rounded-md text-[10px] font-bold uppercase tracking-wider transition-colors border border-gray-100 flex items-center justify-center gap-2"
            >
              <Printer size={12} />
              {t.print}
            </button>
          </div>
          
          <button 
            disabled={!isApproved}
            onClick={() => {
              onSubmit();
              setShowFakePrompt(true);
            }}
            className={`w-full py-3 px-4 rounded-md text-sm font-bold uppercase tracking-widest transition-all shadow-sm ${
              isApproved 
                ? 'bg-[#5B89B1] text-white hover:bg-[#4A7294] active:scale-[0.98]' 
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {t.confirmButton}
          </button>
        </div>
      )}

      {/* Fake Confirmation Modal */}
      {showFakePrompt && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={32} />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">{t.fakePromptTitle}</h3>
            <p className="text-sm text-gray-500 mb-6 leading-relaxed">
              {t.fakePromptBody}
            </p>
            <button 
              onClick={() => setShowFakePrompt(false)}
              className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-black transition-colors"
            >
              {t.close}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
