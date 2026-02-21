import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Activity, TrendingUp, Briefcase, Zap, Layers, CheckSquare, Square } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export type Category = {
    id: string;
    name: string;
    icon: React.ReactNode;
    strategies: { id: string; name: string }[];
};

export const CATEGORIES: Category[] = [
    {
        id: 'price-action',
        name: '1. 가격 액션 / 캔들 패턴',
        icon: <TrendingUp className="w-5 h-5" />,
        strategies: [
            { id: 'three_bar_pattern', name: '3 Bar Pattern' },
            { id: 'engulfing_pattern', name: 'Engulfing Pattern' },
            { id: 'pin_bar_rejection', name: 'Pin Bar / Rejection' },
            { id: 'shrinking_candles', name: 'Shrinking Candles' },
            { id: 'breakout_candles', name: 'Breakout Candles' },
            { id: 'support_resistance', name: 'Support & Resistance' },
            { id: 'trend_lines', name: 'Trend Lines' },
            { id: 'three_bar_reversal', name: '3 Bar Reversal' },
        ],
    },
    {
        id: 'indicators',
        name: '2. 지표 기반 추세/반전',
        icon: <Activity className="w-5 h-5" />,
        strategies: [
            { id: 'macd_sar_200ema', name: 'MACD + SAR + 200EMA' },
            { id: 'bb_squeeze', name: 'Bollinger Band Squeeze' },
            { id: 'ema50_pullback', name: '50 EMA Pullback' },
            { id: 'ichimoku_cloud', name: 'Ichimoku Cloud' },
            { id: 'fibonacci_retracement', name: 'Fibonacci Retracement' },
            { id: 'williams_alligator', name: 'Williams Alligator' },
            { id: 'williams_fractal', name: 'Williams Fractal' },
            { id: 'williams_vix_fix', name: 'Williams Vix Fix' },
            { id: 'stochastic_oscillator', name: 'Stochastic Oscillator' },
            { id: 'rsi_divergence', name: 'RSI Divergence' },
            { id: 'ma_crossover', name: 'MA Crossover' },
        ],
    },
    {
        id: 'smc',
        name: '3. 스마트 머니 컨셉 (SMC)',
        icon: <Briefcase className="w-5 h-5" />,
        strategies: [
            { id: 'fair_value_gap', name: 'Fair Value Gap (FVG)' },
            { id: 'inversion_fvg', name: 'Inversion FVG' },
            { id: 'order_blocks', name: 'Order Blocks' },
            { id: 'liquidity_sweeps', name: 'Liquidity Sweeps' },
            { id: 'break_of_structure', name: 'Break of Structure (BOS)' },
            { id: 'change_of_character', name: 'Change of Character (CHoCH)' },
        ],
    },
    {
        id: 'scalping',
        name: '4. 스캘핑 및 인트라데이 전술',
        icon: <Zap className="w-5 h-5" />,
        strategies: [
            { id: 'vwap_strategy', name: 'VWAP Strategy' },
            { id: 'triple_ema_scalping', name: 'Triple EMA Scalping' },
            { id: 'heikin_ashi_smoothing', name: 'Heikin Ashi Smoothing' },
            { id: 'volume_oscillator', name: 'Volume Oscillator' },
        ],
    },
    {
        id: 'advanced',
        name: '5. 고급 이론 및 기타 패턴',
        icon: <Layers className="w-5 h-5" />,
        strategies: [
            { id: 'elliot_wave', name: 'Elliot Wave' },
            { id: 'harmonic_patterns', name: 'Harmonic Patterns' },
        ],
    },
];

interface SidebarProps {
    activeStrategies: Set<string>;
    onStrategyToggle: (id: string) => void;
    onCategoryToggle: (strategyIds: string[]) => void;
    onGlobalToggle: (select: boolean) => void;
    latestSignals?: Record<string, 'buy' | 'sell' | null>;
}

export const Sidebar: React.FC<SidebarProps> = ({
    activeStrategies,
    onStrategyToggle,
    onCategoryToggle,
    onGlobalToggle,
    latestSignals = {}
}) => {
    const [openCategories, setOpenCategories] = useState<Record<string, boolean>>({
        'price-action': true,
        'indicators': false,
        'smc': false,
        'scalping': false,
        'advanced': false,
    });

    const toggleCategory = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setOpenCategories(prev => ({ ...prev, [id]: !prev[id] }));
    };

    return (
        <div className="w-80 h-full bg-slate-900 border-r border-slate-800 flex flex-col overflow-y-auto">
            <div className="p-6 border-b border-slate-800 shrink-0 sticky top-0 bg-slate-900/90 backdrop-blur z-10">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
                        Wow Finance
                    </h1>
                    <div className="flex gap-2">
                        <button
                            onClick={() => onGlobalToggle(true)}
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-blue-400 transition-colors group relative"
                            title="Select All"
                        >
                            <CheckSquare className="w-4 h-4" />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Select All</span>
                        </button>
                        <button
                            onClick={() => onGlobalToggle(false)}
                            className="p-1.5 hover:bg-slate-800 rounded-md text-slate-500 hover:text-red-400 transition-colors group relative"
                            title="Clear All"
                        >
                            <Square className="w-4 h-4" />
                            <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity">Clear All</span>
                        </button>
                    </div>
                </div>
                <p className="text-sm text-slate-400">Trading Strategy Visualizer</p>
            </div>

            <div className="flex-1 py-4">
                {CATEGORIES.map(category => {
                    const categoryIds = category.strategies.map(s => s.id);
                    const allSelected = categoryIds.every(id => activeStrategies.has(id));
                    const someSelected = categoryIds.some(id => activeStrategies.has(id));

                    return (
                        <div key={category.id} className="mb-2">
                            <div
                                onClick={(e) => toggleCategory(category.id, e as any)}
                                className="w-full flex items-center justify-between px-6 py-3 text-slate-300 hover:bg-slate-800/50 transition-colors cursor-pointer"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-slate-500">{category.icon}</span>
                                    <span className="font-medium text-sm">{category.name}</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onCategoryToggle(categoryIds);
                                        }}
                                        className={cn(
                                            "text-[10px] font-black px-2 py-0.5 rounded border transition-all",
                                            allSelected
                                                ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20"
                                                : "bg-blue-500/10 border-blue-500/30 text-blue-500 hover:bg-blue-500/20"
                                        )}
                                    >
                                        {allSelected ? 'CLEAR' : 'ALL'}
                                    </button>
                                    {openCategories[category.id] ? (
                                        <ChevronDown className="w-4 h-4 text-slate-500" />
                                    ) : (
                                        <ChevronRight className="w-4 h-4 text-slate-500" />
                                    )}
                                </div>
                            </div>

                            <div
                                className={cn(
                                    "overflow-hidden transition-all duration-300 ease-in-out bg-slate-950/30",
                                    openCategories[category.id] ? "max-h-opacity-100 opacity-100" : "max-h-0 opacity-0"
                                )}
                            >
                                <div className="py-2 px-6 flex flex-col gap-1">
                                    {category.strategies.map(strategy => {
                                        const isActive = activeStrategies.has(strategy.id);
                                        const signal = latestSignals[strategy.id];
                                        return (
                                            <button
                                                key={strategy.id}
                                                onClick={() => onStrategyToggle(strategy.id)}
                                                className={cn(
                                                    "text-left px-4 py-2.5 rounded-lg text-sm transition-all duration-200 border",
                                                    isActive
                                                        ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
                                                        : "border-transparent text-slate-400 hover:bg-slate-800 hover:text-slate-200"
                                                )}
                                            >
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex items-center gap-3 overflow-hidden">
                                                        <div className={cn(
                                                            "w-2 h-2 shrink-0 rounded-full",
                                                            isActive ? "bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.8)]" : "bg-slate-700"
                                                        )} />
                                                        <span className="truncate">{strategy.name}</span>
                                                    </div>

                                                    {signal && (
                                                        <span className={cn(
                                                            "text-[9px] font-black px-1 rounded h-4 flex items-center leading-none",
                                                            signal === 'buy' ? "bg-red-500/20 text-red-500" : "bg-blue-500/20 text-blue-500"
                                                        )}>
                                                            {signal === 'buy' ? 'BUY' : 'SELL'}
                                                        </span>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
