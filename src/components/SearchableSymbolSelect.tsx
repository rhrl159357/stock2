import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown } from 'lucide-react';
import { SP500_SYMBOLS, StockSymbol } from '../utils/sp500';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: any[]) {
    return twMerge(clsx(inputs));
}

interface SignalData {
    buy: number;
    sell: number;
}

interface SearchableSymbolSelectProps {
    value: string;
    onChange: (value: string) => void;
    signalMap?: Record<string, SignalData>;
}

export const SearchableSymbolSelect: React.FC<SearchableSymbolSelectProps> = ({ value, onChange, signalMap }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const allSymbols: StockSymbol[] = [
        { symbol: 'AAPL', name: 'Apple Inc' },
        { symbol: 'TSLA', name: 'Tesla Inc' },
        { symbol: 'NVDA', name: 'NVIDIA Corp' },
        { symbol: 'BTC-USD', name: 'Bitcoin' },
        ...SP500_SYMBOLS
    ];

    const uniqueSymbols = allSymbols.filter((v, i, a) => a.findIndex(t => t.symbol === v.symbol) === i);

    const filteredSymbols = uniqueSymbols.filter(s =>
        s.symbol.toLowerCase().includes(search.toLowerCase()) ||
        s.name.toLowerCase().includes(search.toLowerCase())
    ).slice(0, 50);

    const selectedSymbol = uniqueSymbols.find(s => s.symbol === value) || { symbol: value, name: '' };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSearchSubmit = () => {
        if (search.trim()) {
            onChange(search.trim().toUpperCase());
            setIsOpen(false);
            setSearch('');
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSearchSubmit();
        }
    };

    return (
        <div className="relative w-full text-slate-100 min-w-[200px]" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between bg-slate-900 border border-slate-700/50 rounded-lg px-4 py-2 text-sm font-semibold hover:bg-slate-800 transition-all focus:ring-2 ring-blue-500/50 outline-none backdrop-blur-md"
            >
                <div className="flex items-center gap-3 overflow-hidden">
                    <span className="text-blue-400 shrink-0 font-bold bg-blue-500/10 px-1.5 py-0.5 rounded text-[10px] tracking-wider border border-blue-500/20">SYM</span>
                    <span className="text-white shrink-0 font-bold">{selectedSymbol.symbol}</span>
                    <span className="text-slate-400 truncate font-normal text-xs">{selectedSymbol.name}</span>
                </div>
                <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform duration-200", isOpen && "rotate-180")} />
            </button>

            {isOpen && (
                <div className="absolute top-full mt-2 w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="p-3 border-b border-slate-800 bg-slate-900">
                        <div className="relative flex items-center gap-2">
                            <div className="relative flex-1">
                                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Enter ticker (e.g. MSFT)..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 group"
                                />
                            </div>
                            <button
                                onClick={handleSearchSubmit}
                                className="bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-lg transition-colors group"
                                title="Search Ticker"
                            >
                                <Search className="w-4 h-4 group-active:scale-90" />
                            </button>
                        </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-slate-700 bg-slate-900">
                        {filteredSymbols.length > 0 ? (
                            filteredSymbols.map((item) => {
                                const signals = signalMap?.[item.symbol];
                                return (
                                    <button
                                        key={item.symbol}
                                        onClick={() => {
                                            onChange(item.symbol);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-3 text-sm transition-all hover:bg-slate-800 group border-b border-slate-800/50 last:border-0",
                                            value === item.symbol ? "bg-blue-600/10" : "bg-transparent"
                                        )}
                                    >
                                        <div className="flex items-center gap-4 overflow-hidden flex-1">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className={cn("font-bold", value === item.symbol ? "text-blue-400" : "text-slate-100")}>
                                                    {item.symbol}
                                                </span>
                                                <span className="text-slate-500 text-[10px] truncate max-w-[120px] tracking-tight">{item.name}</span>
                                            </div>

                                            {signals && (
                                                <div className="flex items-center gap-1.5 ml-auto mr-4">
                                                    {signals.buy > 0 && (
                                                        <div className="flex items-center gap-1 bg-red-500/10 border border-red-500/20 px-1.5 py-0.5 rounded">
                                                            <span className="text-[9px] font-bold text-red-500 uppercase tracking-tighter">BUY</span>
                                                            <span className="text-[11px] font-black text-red-500">{signals.buy}</span>
                                                        </div>
                                                    )}
                                                    {signals.sell > 0 && (
                                                        <div className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/20 px-1.5 py-0.5 rounded">
                                                            <span className="text-[9px] font-bold text-blue-500 uppercase tracking-tighter">SELL</span>
                                                            <span className="text-[11px] font-black text-blue-500">{signals.sell}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        {value === item.symbol && <div className="w-1.5 h-1.5 rounded-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,1)]" />}
                                    </button>
                                );
                            })
                        ) : (
                            <div className="px-4 py-8 text-center bg-slate-900">
                                <Search className="w-8 h-8 mx-auto mb-2 opacity-20 text-slate-500" />
                                <p className="text-slate-500 text-sm mb-3">No matching symbols found.</p>
                                <button
                                    onClick={handleSearchSubmit}
                                    className="px-4 py-2 bg-blue-600/20 border border-blue-500/50 text-blue-400 rounded-lg text-xs font-bold hover:bg-blue-600/30 transition-all"
                                >
                                    Force load "{search.toUpperCase()}"
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
