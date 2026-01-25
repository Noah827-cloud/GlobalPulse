import React, { useState, useEffect } from 'react';
import { getKeywordLibrary, addKeyword, removeKeyword, resetKeywordLibrary } from '../keywordLibrary';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onKeywordsChange: () => void; // Trigger parent refresh
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onKeywordsChange }) => {
    const [keywords, setKeywords] = useState<string[]>([]);
    const [newKeyword, setNewKeyword] = useState('');

    useEffect(() => {
        if (isOpen) {
            setKeywords(getKeywordLibrary());
        }
    }, [isOpen]);

    const handleAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newKeyword.trim()) return;
        const updated = addKeyword(newKeyword.trim());
        setKeywords(updated);
        setNewKeyword('');
        onKeywordsChange();
    };

    const handleRemove = (kw: string) => {
        const updated = removeKeyword(kw);
        setKeywords(updated);
        onKeywordsChange();
    };

    const handleReset = () => {
        if (confirm('确定要重置回默认词库吗？')) {
            const reset = resetKeywordLibrary();
            setKeywords(reset);
            onKeywordsChange();
        }
    }

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative w-full max-w-lg bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-white/50 animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-200/50 flex justify-between items-center">
                    <h2 className="text-xl font-black text-slate-800 tracking-tight">⚙️ 关键词库管理</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 bg-slate-50/50">
                    <p className="text-sm text-slate-500 mb-4">
                        这些关键词用于在 <strong>RSS 降级模式</strong> 下自动提取标签。
                    </p>

                    <form onSubmit={handleAdd} className="flex gap-2 mb-6">
                        <input
                            type="text"
                            value={newKeyword}
                            onChange={e => setNewKeyword(e.target.value)}
                            placeholder="添加新关键词 (如: DeepSeek)"
                            className="flex-1 px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 bg-white shadow-sm font-bold text-slate-700"
                        />
                        <button
                            type="submit"
                            disabled={!newKeyword.trim()}
                            className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-indigo-200 transition-all active:scale-95"
                        >
                            添加
                        </button>
                    </form>

                    <div className="flex flex-wrap gap-2 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                        {keywords.map((kw) => (
                            <span key={kw} className="group inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-bold text-slate-600 shadow-sm hover:border-red-200 hover:bg-red-50 transition-colors">
                                {kw}
                                <button
                                    onClick={() => handleRemove(kw)}
                                    className="w-4 h-4 flex items-center justify-center rounded-full text-slate-400 hover:text-red-500 hover:bg-red-100 transition-colors"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </span>
                        ))}
                    </div>
                </div>

                <div className="p-4 border-t border-slate-200 bg-white flex justify-between items-center">
                    <button onClick={handleReset} className="text-xs font-bold text-slate-400 hover:text-red-500 transition-colors">
                        恢复默认词库
                    </button>
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-colors"
                    >
                        完成
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SettingsModal;
