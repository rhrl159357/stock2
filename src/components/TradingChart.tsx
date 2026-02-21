import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import { createChart, IChartApi, ISeriesApi, SeriesMarker, Time } from 'lightweight-charts';
import { ChartData } from '../utils/mockData';

interface MovingAverage {
    period: number;
    color: string;
    data: { time: Time; value: number }[];
}

interface TradingChartProps {
    data: ChartData[];
    maLines?: MovingAverage[];
    markers?: SeriesMarker<Time>[];
    buyCount?: number;
    sellCount?: number;
    onSignalClick?: (type: 'buy' | 'sell' | 'all') => void;
}

export interface ChartRef {
    // No longer strictly needed for markers as they are now props
}

export const TradingChart = forwardRef<ChartRef, TradingChartProps>(({ data, maLines, markers, buyCount = 0, sellCount = 0, onSignalClick }, ref) => {
    const chartContainerRef = useRef<HTMLDivElement>(null);
    const chartRef = useRef<IChartApi | null>(null);
    const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
    const volumeSeriesRef = useRef<ISeriesApi<"Histogram"> | null>(null);
    const maSeriesRefs = useRef<Map<number, ISeriesApi<"Line">>>(new Map());

    // State for Legend
    const [legendValues, setLegendValues] = useState<Record<number, number | null>>({});

    useImperativeHandle(ref, () => ({
        // Markers are handled via props now
    }));

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { color: '#0f172a' },
                textColor: '#94a3b8',
            },
            grid: {
                vertLines: { color: '#1e293b' },
                horzLines: { color: '#1e293b' },
            },
            timeScale: {
                borderColor: '#1e293b',
            },
            height: chartContainerRef.current.clientHeight,
        });

        const series = chart.addCandlestickSeries({
            upColor: '#22c55e',
            downColor: '#ef4444',
            borderVisible: false,
            wickUpColor: '#22c55e',
            wickDownColor: '#ef4444',
        });

        const volumeSeries = chart.addHistogramSeries({
            color: '#26a69a',
            priceFormat: {
                type: 'volume',
            },
            priceScaleId: '',
        });

        volumeSeries.priceScale().applyOptions({
            scaleMargins: {
                top: 0.8,
                bottom: 0,
            },
        });

        chartRef.current = chart;
        seriesRef.current = series;
        volumeSeriesRef.current = volumeSeries;

        // Custom Legend Logic on Crosshair Move
        chart.subscribeCrosshairMove((param) => {
            if (!param.time || param.point === undefined || !maLines) {
                // Return to latest values if not hovering
                const latest: Record<number, number | null> = {};
                maLines?.forEach(line => {
                    if (line.data.length > 0) {
                        latest[line.period] = line.data[line.data.length - 1].value;
                    }
                });
                setLegendValues(latest);
                return;
            }

            const values: Record<number, number | null> = {};
            maSeriesRefs.current.forEach((series, period) => {
                const data = param.seriesData.get(series);
                if (data && 'value' in data) {
                    values[period] = data.value as number;
                } else {
                    values[period] = null;
                }
            });
            setLegendValues(values);
        });

        const handleResize = () => {
            if (chartContainerRef.current && chartRef.current) {
                chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
            chartRef.current = null;
            seriesRef.current = null;
            volumeSeriesRef.current = null;
            maSeriesRefs.current.clear();
        };
    }, []);

    useEffect(() => {
        if (seriesRef.current && data.length > 0) {
            try {
                const sortedData = [...data].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
                seriesRef.current.setData(sortedData as any);

                if (volumeSeriesRef.current) {
                    const volumeData = sortedData.map(d => ({
                        time: d.time as Time,
                        value: d.volume || 0,
                        color: d.close >= d.open ? '#22c55e44' : '#ef444444',
                    }));
                    volumeSeriesRef.current.setData(volumeData);
                }
            } catch (e) {
                console.error("Error setting chart data:", e);
            }
        }
    }, [data]);

    useEffect(() => {
        if (seriesRef.current && markers) {
            seriesRef.current.setMarkers(markers);
        }
    }, [markers]);

    useEffect(() => {
        if (!chartRef.current || !maLines) return;

        const currentPeriods = new Set(maLines.map(line => line.period));
        for (const [period, series] of maSeriesRefs.current.entries()) {
            if (!currentPeriods.has(period)) {
                chartRef.current.removeSeries(series);
                maSeriesRefs.current.delete(period);
            }
        }

        const latest: Record<number, number | null> = {};
        maLines.forEach(line => {
            let series = maSeriesRefs.current.get(line.period);
            if (!series) {
                series = chartRef.current!.addLineSeries({
                    color: line.color,
                    lineWidth: 2,
                    priceLineVisible: false,
                    lastValueVisible: false,
                });
                maSeriesRefs.current.set(line.period, series);
            }
            series.setData(line.data);
            if (line.data.length > 0) {
                latest[line.period] = line.data[line.data.length - 1].value;
            }
        });
        setLegendValues(latest);
    }, [maLines]);

    return (
        <div className="relative w-full h-full">
            <div ref={chartContainerRef} className="w-full h-full" />

            {/* Legend Overlay - Top Left */}
            <div className="absolute top-4 left-4 z-20 flex flex-col gap-2 max-w-[90%] pointer-events-none">
                {/* MA Row */}
                <div className="flex flex-wrap gap-2">
                    {maLines?.map(line => {
                        const val = legendValues[line.period];
                        if (val === undefined || val === null) return null;
                        return (
                            <div
                                key={line.period}
                                className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/80 border border-slate-700/50 backdrop-blur-md shadow-lg"
                            >
                                <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: line.color }} />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{line.period} MA</span>
                                <span className="text-[11px] font-bold tabular-nums" style={{ color: line.color }}>
                                    {val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {/* Signals Row */}
                <div className="flex gap-2 pointer-events-auto">
                    {buyCount > 0 && (
                        <button
                            onClick={() => onSignalClick?.('buy')}
                            className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-all active:scale-95 group shadow-xl"
                        >
                            <span className="text-[10px] font-black text-red-500 uppercase tracking-widest border-b border-red-500/30 pb-0.5">BUY SIGNAL</span>
                            <span className="text-sm font-black text-red-400 font-mono leading-none">{buyCount}</span>
                        </button>
                    )}
                    {sellCount > 0 && (
                        <button
                            onClick={() => onSignalClick?.('sell')}
                            className="flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-lg hover:bg-blue-500/20 transition-all active:scale-95 group shadow-xl"
                        >
                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest border-b border-blue-500/30 pb-0.5">SELL SIGNAL</span>
                            <span className="text-sm font-black text-blue-400 font-mono leading-none">{sellCount}</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
});
