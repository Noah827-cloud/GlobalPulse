import React from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  message: string;
}

const ConfirmModal: React.FC<ConfirmModalProps> = ({ isOpen, onConfirm, onCancel, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-[2rem] w-full max-w-sm overflow-hidden shadow-2xl ring-1 ring-slate-900/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </div>
          
          <h3 className="text-xl font-bold text-slate-900 mb-2">确认操作</h3>
          <p className="text-slate-500 leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex border-t border-slate-100">
          <button 
            onClick={onCancel}
            className="flex-1 px-6 py-4 text-sm font-bold text-slate-500 hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <div className="w-px bg-slate-100"></div>
          <button 
            onClick={onConfirm}
            className="flex-1 px-6 py-4 text-sm font-bold text-red-600 hover:bg-red-50 transition-colors"
          >
            确认清空
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
