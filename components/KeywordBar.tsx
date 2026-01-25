import React, { useMemo } from 'react';
import { NewsArticle } from '../types';

interface KeywordBarProps {
    articles: NewsArticle[];
    selectedKeyword: string | null;
    onSelectKeyword: (keyword: string | null) => void;
    onOpenSettings: () => void;
}

const KeywordBar: React.FC<KeywordBarProps> = ({ articles, selectedKeyword, onSelectKeyword, onOpenSettings }) => {
    const topKeywords = useMemo(() => {
        const counts = new Map<string, number>();

        articles.forEach(article => {
            if (article.tags) {
                article.tags.forEach(tag => {
                    // Normalization: trim
                    const clean = tag.trim();
                    if (!clean || clean === 'RSS' || clean === 'RSS（降级）') return;
                    counts.set(clean, (counts.get(clean) || 0) + 1);
                });
            }
        });

        // Sort by count desc
        return Array.from(counts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 20) // Top 20
            .map(([keyword]) => keyword);
    }, [articles]);

    if (topKeywords.length === 0) return null;

    return (
        <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 overflow-x-auto no-scrollbar pb-2 -mb-2 mask-linear">
                <div className="flex gap-2.5">
                    {topKeywords.map(keyword => (
                        <button
                            key={keyword}
                            onClick={() => onSelectKeyword(keyword === selectedKeyword ? null : keyword)}
                            className={`
                  flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all border
                  ${selectedKeyword === keyword
                                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-200 scale-105'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}
                `}
                        >
                            #{keyword}
                        </button>
                    ))}
                </div>
            </div>

            <button
                onClick={onOpenSettings}
                className="flex-shrink-0 p-2 text-slate-400 hover:text-indigo-600 hover:bg-white hover:shadow-sm rounded-xl border border-transparent hover:border-slate-200 transition-all bg-slate-100/50"
                title="管理关键词库"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
        </div>
    );
};

export default KeywordBar;
