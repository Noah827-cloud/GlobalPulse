
import React from 'react';
import { NewsArticle } from '../types';

interface ArticleModalProps {
  article: NewsArticle | null;
  onClose: () => void;
}

const ArticleModal: React.FC<ArticleModalProps> = ({ article, onClose }) => {
  if (!article) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
      <div 
        className="bg-white w-full max-w-3xl max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-64 sm:h-80 w-full">
          <img 
            src={article.imageUrl} 
            alt={article.title}
            className="w-full h-full object-cover"
          />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 backdrop-blur-lg rounded-full text-white transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div className="p-8 overflow-y-auto">
          <div className="flex items-center gap-3 mb-6">
            <span className="px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full uppercase">
              {article.category}
            </span>
            <span className="text-sm text-slate-400">
              {article.source} • {new Date(article.timestamp).toLocaleString()}
            </span>
          </div>
          
          <h2 className="text-3xl font-extrabold text-slate-900 mb-6 leading-tight">
            {article.title}
          </h2>
          
          <div className="prose prose-slate max-w-none">
            <p className="text-lg text-slate-600 leading-relaxed mb-8">
              {article.summary}
            </p>
            
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-8">
              <h4 className="font-bold text-slate-800 mb-2">AI 深度点评</h4>
              <p className="text-sm text-slate-500 italic">
                这篇报道反映了当前 {article.category} 领域的最新动态。作为重点关注的 {article.tags.join('、')} 议题，其长远影响值得持续观测。
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 mt-8 pt-8 border-t border-slate-100">
            <a 
              href={article.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-8 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 transition-all flex items-center gap-2"
            >
              跳转原文阅读
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <button 
              onClick={onClose}
              className="px-8 py-3 bg-slate-100 text-slate-600 font-bold rounded-2xl hover:bg-slate-200 transition-all"
            >
              关闭
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ArticleModal;
