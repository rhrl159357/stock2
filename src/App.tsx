import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Sidebar } from './components/Sidebar';
import { TradingChart, ChartRef } from './components/TradingChart';
import { ChartData } from './utils/mockData';
import { applyStrategy } from './strategies';
import { fetchYahooFinanceData } from './utils/api';
import { SP500_SYMBOLS } from './utils/sp500';
import { calculateSMA } from './utils/indicators';
import { Time } from 'lightweight-charts';

import { SearchableSymbolSelect } from './components/SearchableSymbolSelect';
import { STRATEGY_IDS } from './strategies';

function App() {
    const [activeStrategies, setActiveStrategies] = useState<Set<string>>(new Set());
    const [symbol, setSymbol] = useState<string>('AAPL');
    const [data, setData] = useState<ChartData[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [signalMap, setSignalMap] = useState<Record<string, { buy: number, sell: number }>>({});

    const chartRef = useRef<ChartRef>(null);

    // Symbols to scan in background
    const scannerSymbols = useMemo(() => [
        'AAPL', 'TSLA', 'NVDA', 'BTC-USD',
        ...SP500_SYMBOLS.map(s => s.symbol)
    ].filter((v, i, a) => a.indexOf(v) === i), []);

    // Screener Engine
    useEffect(() => {
        let isActive = true;
        const scan = async () => {
            const batchSize = 3;
            for (let i = 0; i < scannerSymbols.length; i += batchSize) {
                if (!isActive) break;
                const batch = scannerSymbols.slice(i, i + batchSize);

                await Promise.all(batch.map(async (s) => {
                    try {
                        const sData = await fetchYahooFinanceData(s);
                        if (sData.length === 0) return;

                        let buyCount = 0;
                        let sellCount = 0;
                        const latestTime = sData[sData.length - 1].time;

                        STRATEGY_IDS.forEach(id => {
                            const { markers } = applyStrategy(sData, id);
                            const lastMarker = markers.find(m => m.time === latestTime);
                            if (lastMarker) {
                                if (lastMarker.position === 'belowBar') buyCount++;
                                if (lastMarker.position === 'aboveBar') sellCount++;
                            }
                        });

                        if (isActive) {
                            setSignalMap(prev => ({
                                ...prev,
                                [s]: { buy: buyCount, sell: sellCount }
                            }));
                        }
                    } catch (err) {
                        console.warn(`Screener failed for ${s}:`, err);
                    }
                }));

                await new Promise(r => setTimeout(r, 1000));
            }
        };

        scan();
        return () => { isActive = false; };
    }, [scannerSymbols]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        fetchYahooFinanceData(symbol)
            .then(fetchedData => {
                if (!mounted) return;
                setData(fetchedData);
                setLoading(false);
                setError(null);
            })
            .catch(err => {
                if (!mounted) return;
                setError(err.message);
                setLoading(false);
            });
        return () => { mounted = false; };
    }, [symbol]);

    const handleStrategyToggle = (strategyId: string) => {
        setActiveStrategies(prev => {
            const next = new Set(prev);
            if (next.has(strategyId)) {
                next.delete(strategyId);
            } else {
                next.add(strategyId);
            }
            return next;
        });
    };

    // Category Selection Logic
    const handleCategoryToggle = (strategyIds: string[]) => {
        setActiveStrategies(prev => {
            const next = new Set(prev);
            const allSelected = strategyIds.every(id => next.has(id));

            if (allSelected) {
                // Clear all in category
                strategyIds.forEach(id => next.delete(id));
            } else {
                // Select all in category
                strategyIds.forEach(id => next.add(id));
            }
            return next;
        });
    };

    // Global Selection Logic
    const handleGlobalToggle = (select: boolean) => {
        if (select) {
            setActiveStrategies(new Set(STRATEGY_IDS));
        } else {
            setActiveStrategies(new Set());
        }
    };

    // Calculate MA Lines
    const maLines = useMemo(() => {
        if (data.length === 0) return [];
        const periods = [
            { p: 5, c: '#3b82f6' },   // Blue
            { p: 10, c: '#10b981' },  // Green
            { p: 20, c: '#eab308' },  // Yellow
            { p: 50, c: '#f97316' },  // Orange
            { p: 120, c: '#ec4899' }, // Pink
        ];

        return periods.map(({ p, c }) => {
            const sma = calculateSMA(data, p);
            const lineData = data
                .map((d, i) => ({ time: d.time as Time, value: sma[i] }))
                .filter(d => !isNaN(d.value));
            return { period: p, color: c, data: lineData };
        });
    }, [data]);

    // Calculate Strategy Markers
    const activeMarkers = useMemo(() => {
        if (data.length === 0 || activeStrategies.size === 0) return [];

        let allMarkers: any[] = [];
        activeStrategies.forEach(strategyId => {
            const { markers } = applyStrategy(data, strategyId);
            allMarkers = [...allMarkers, ...markers];
        });

        return allMarkers.sort((a, b) => {
            const timeA = typeof a.time === 'string' ? new Date(a.time).getTime() : (a.time as number);
            const timeB = typeof b.time === 'string' ? new Date(b.time).getTime() : (b.time as number);
            return timeA - timeB;
        });
    }, [activeStrategies, data]);

    // Calculate Latest Signals for Sidebar and Legend
    const { latestSignalMap, buyTotal, sellTotal } = useMemo(() => {
        if (data.length === 0) return { latestSignalMap: {}, buyTotal: 0, sellTotal: 0 };

        const latestTime = data[data.length - 1].time;
        const lMap: Record<string, 'buy' | 'sell' | null> = {};
        let bCount = 0;
        let sCount = 0;

        STRATEGY_IDS.forEach(id => {
            const { markers } = applyStrategy(data, id);
            const lastMarker = markers.find(m => m.time === latestTime);
            if (lastMarker) {
                const type = lastMarker.position === 'belowBar' ? 'buy' : 'sell';
                lMap[id] = type;
                if (type === 'buy') bCount++;
                else sCount++;
            } else {
                lMap[id] = null;
            }
        });

        return { latestSignalMap: lMap, buyTotal: bCount, sellTotal: sCount };
    }, [data]);

    // Handle Signal Button Click (Additive Selection)
    const handleSignalClick = (type: 'buy' | 'sell') => {
        setActiveStrategies(prev => {
            const next = new Set(prev);
            Object.entries(latestSignalMap).forEach(([id, signal]) => {
                if (signal === type) {
                    next.add(id);
                }
            });
            return next;
        });
    };

    return (
        <div className="flex h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
            <Sidebar
                activeStrategies={activeStrategies}
                onStrategyToggle={handleStrategyToggle}
                onCategoryToggle={handleCategoryToggle}
                onGlobalToggle={handleGlobalToggle}
                latestSignals={latestSignalMap}
            />
            <main className="flex-1 flex flex-col relative w-full h-full">
                <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 shrink-0 bg-slate-900/50 backdrop-blur-sm z-10 w-full shadow-md">
                    <div className="flex flex-col">
                        <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                            Trading Strategy Dashboard
                            <span className="text-blue-500 text-xs px-2 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded">PRO</span>
                        </h1>
                        <span className="text-xs text-slate-400">
                            {activeStrategies.size > 0 ? `${activeStrategies.size} strategies active` : 'Select strategies to backtest'}
                        </span>
                    </div>
                    <div className="flex items-center gap-4">
                        <SearchableSymbolSelect value={symbol} onChange={setSymbol} signalMap={signalMap} />
                    </div>
                </header>

                <div className="flex-1 w-full h-full relative" style={{ height: 'calc(100vh - 64px)' }}>
                    {loading ? (
                        <div className="flex flex-col items-center justify-center w-full h-full gap-4">
                            <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
                            <span className="text-slate-400 font-medium animate-pulse">Fetching Real-time Data...</span>
                        </div>
                    ) : error ? (
                        <div className="flex items-center justify-center w-full h-full text-red-400 bg-red-400/5 border border-red-400/20 m-4 rounded-xl">
                            <div className="text-center">
                                <p className="text-lg font-semibold">{error}</p>
                                <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-400 text-slate-950 rounded-lg text-sm font-bold">Retry Connection</button>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0">
                            <TradingChart
                                ref={chartRef}
                                data={data}
                                maLines={maLines}
                                markers={activeMarkers}
                                buyCount={buyTotal}
                                sellCount={sellTotal}
                                onSignalClick={(type) => handleSignalClick(type as any)}
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

export default App;
