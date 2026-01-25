
const STORAGE_KEY = 'keyword_library';

export const DEFAULT_KEYWORDS = [
    "Trump", "OpenAI", "China", "Stock", "DeepSeek",
    "Tesla", "Nvidia", "iPhone", "Gaza", "Ukraine",
    "特朗普", "人工智能", "股市", "黄金", "茅台", "华为"
];

export const getKeywordLibrary = (): string[] => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_KEYWORDS;
        return JSON.parse(saved);
    } catch (e) {
        console.error("Failed to parse keyword library", e);
        return DEFAULT_KEYWORDS;
    }
};

export const setKeywordLibrary = (keywords: string[]) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(keywords));
    } catch (e) {
        console.error("Failed to save keyword library", e);
    }
};

export const addKeyword = (keyword: string) => {
    const current = getKeywordLibrary();
    if (!current.includes(keyword)) {
        const updated = [keyword, ...current];
        setKeywordLibrary(updated);
        return updated; // Return new list for UI update
    }
    return current;
};

export const removeKeyword = (keyword: string) => {
    const current = getKeywordLibrary();
    const updated = current.filter(k => k !== keyword);
    setKeywordLibrary(updated);
    return updated;
};

export const resetKeywordLibrary = () => {
    setKeywordLibrary(DEFAULT_KEYWORDS);
    return DEFAULT_KEYWORDS;
}
