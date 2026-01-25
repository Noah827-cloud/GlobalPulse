
import React, { useState } from 'react';
import { NewsArticle } from '../types';

interface NewsCardProps {
  article: NewsArticle;
  onClick: (article: NewsArticle) => void;
  onTagClick?: (tag: string) => void;
}

const NewsCard: React.FC<NewsCardProps> = ({ article, onClick, onTagClick }) => {
  const [imgLoaded, setImgLoaded] = useState(false);

  const handleTagClick = (e: React.MouseEvent, tag: string) => {
    e.stopPropagation(); // Prevent card click
    onTagClick?.(tag);
  };

  return (
    <div
      className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-200/60 news-card-hover cursor-pointer flex flex-col h-full group relative"
      onClick={() => onClick(article)}
    >
      {/* ... (image section unchanged) */}
      <div className="absolute top-4 right-4 z-10">
        <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-lg">
          {article.category}
        </span>
      </div>

      <div className="relative h-60 overflow-hidden bg-slate-100">
        {!imgLoaded && (
          <div className="absolute inset-0 animate-pulse bg-slate-200" />
        )}
        <img
          src={article.imageUrl}
          alt={article.title}
          onLoad={() => setImgLoaded(true)}
          className={`w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-110 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          style={{ imageRendering: '-webkit-optimize-contrast' }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/40 to-transparent opacity-30" />
        <div className="absolute top-5 left-5">
          <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-[9px] font-black tracking-widest text-slate-800 rounded-lg shadow-sm border border-white/20 uppercase">
            {article.source}
          </span>
        </div>
      </div>

      <div className="p-8 flex flex-col flex-grow">
        <div className="flex gap-2 mb-4 flex-wrap">
          {article.tags.slice(0, 3).map((tag, idx) => (
            <button
              key={idx}
              onClick={(e) => handleTagClick(e, tag)}
              className="text-[10px] uppercase tracking-wider font-bold text-indigo-500 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded hover:bg-indigo-600 hover:text-white transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        <h3 className="text-xl font-bold text-slate-900 leading-tight mb-4 line-clamp-2 group-hover:text-indigo-600 transition-colors">
          {article.title}
        </h3>

        <p className="text-sm text-slate-500 line-clamp-3 mb-6 flex-grow leading-relaxed">
          {article.summary}
        </p>

        <div className="flex items-center justify-between pt-6 border-t border-slate-100">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {new Date(article.timestamp).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}
          </span>
          <div className="flex items-center gap-1.5 text-indigo-600 group-hover:translate-x-1 transition-transform">
            <span className="text-[10px] font-black uppercase tracking-widest">阅览详情</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NewsCard;
