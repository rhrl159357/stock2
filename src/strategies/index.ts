import { ChartData } from '../utils/mockData';
import { SeriesMarker, Time } from 'lightweight-charts';
import { calculateSMA, calculateEMA, calculateMACD, calculateRSI, calculateStochastic, calculateIchimoku, calculateVixFix, calculateAlligator } from '../utils/indicators';



export type StrategyResult = {
    markers: SeriesMarker<Time>[];
    lines?: any[];
};

export const STRATEGY_IDS = [
    'three_bar_pattern', 'engulfing_pattern', 'pin_bar_rejection', 'shrinking_candles',
    'breakout_candles', 'support_resistance', 'trend_lines', 'three_bar_reversal',
    'macd_sar_200ema', 'bb_squeeze', 'ema50_pullback', 'ichimoku_cloud',
    'fibonacci_retracement', 'williams_alligator', 'williams_fractal', 'williams_vix_fix',
    'stochastic_oscillator', 'rsi_divergence', 'ma_crossover', 'fair_value_gap',
    'inversion_fvg', 'order_blocks', 'liquidity_sweeps', 'break_of_structure',
    'change_of_character', 'vwap_strategy', 'triple_ema_scalping',
    'heikin_ashi_smoothing', 'volume_oscillator', 'elliot_wave', 'harmonic_patterns'
];

export const applyStrategy = (data: ChartData[], strategyName: string): StrategyResult => {

    const markers: SeriesMarker<Time>[] = [];

    // Helper to add a generic placeholder marker for strategies not fully implemented yet
    const addPlaceholderMarker = (name: string, color: string = '#64748b') => {
        // Just add a few markers purely for visual feedback that the button works
        for (let i = Math.floor(data.length / 2); i < data.length; i += 30) {
            markers.push({
                time: data[i].time as Time,
                position: 'aboveBar',
                color: color,
                shape: 'arrowDown',
                text: `${name} (Demo)`,
            });
        }
    };

    switch (strategyName) {
        // --- 1. Price Action & Candle Patterns ---
        case 'three_bar_pattern':
            for (let i = 2; i < data.length; i++) {
                if (
                    data[i - 2].close > data[i - 2].open &&
                    data[i - 1].close < data[i - 1].open &&
                    data[i].close > data[i].open &&
                    data[i].close > data[i - 2].close
                ) {
                    markers.push({
                        time: data[i].time as Time,
                        position: 'belowBar',
                        color: '#22c55e',
                        shape: 'arrowUp',
                        text: 'BUY (3 Bar)',
                    });
                }
            }
            break;
        case 'engulfing_pattern':
            for (let i = 1; i < data.length; i++) {
                const prev = data[i - 1];
                const curr = data[i];
                const prevIsRed = prev.close < prev.open;
                const currIsGreen = curr.close > curr.open;
                const engulfsBody = curr.open <= prev.close && curr.close >= prev.open;

                if (prevIsRed && currIsGreen && engulfsBody) {
                    markers.push({
                        time: curr.time as Time,
                        position: 'belowBar',
                        color: '#3b82f6',
                        shape: 'arrowUp',
                        text: 'Bull Engulf',
                    });
                }
            }
            break;
        case 'pin_bar_rejection':
            for (let i = 1; i < data.length - 1; i++) {
                const curr = data[i];
                const bodySize = Math.abs(curr.open - curr.close);
                const fullSize = curr.high - curr.low;
                if (fullSize === 0) continue;

                const bodyRatio = bodySize / fullSize;
                const upperWick = curr.high - Math.max(curr.open, curr.close);
                const lowerWick = Math.min(curr.open, curr.close) - curr.low;

                // Condition 1: Body must be relatively small (e.g., less than 30% of the entire candle)
                if (bodyRatio < 0.3) {
                    // Bullish Pin Bar (Long lower wick rejecting lower prices)
                    // Lower wick should be at least 2 times the body size, and upper wick should be very small
                    if (lowerWick > bodySize * 2 && upperWick < lowerWick * 0.3) {
                        markers.push({
                            time: curr.time as Time,
                            position: 'belowBar',
                            color: '#eab308',
                            shape: 'arrowUp',
                            text: 'Bull Pin',
                        });
                    }
                    // Bearish Pin Bar (Long upper wick rejecting higher prices)
                    else if (upperWick > bodySize * 2 && lowerWick < upperWick * 0.3) {
                        markers.push({
                            time: curr.time as Time,
                            position: 'aboveBar',
                            color: '#ef4444',
                            shape: 'arrowDown',
                            text: 'Bear Pin',
                        });
                    }
                }
            }
            break;
        case 'shrinking_candles':
            // Look for 3 shrinking candles of same color, then 1 big reversal candle
            for (let i = 3; i < data.length; i++) {
                const c1 = data[i - 3], c2 = data[i - 2], c3 = data[i - 1], c4 = data[i];
                const body1 = Math.abs(c1.open - c1.close);
                const body2 = Math.abs(c2.open - c2.close);
                const body3 = Math.abs(c3.open - c3.close);
                const body4 = Math.abs(c4.open - c4.close);

                const isShrinking = body1 > body2 && body2 > body3;

                // Bullish reversal: 3 shrinking red candles, then 1 strong green candle
                const allRed = c1.close < c1.open && c2.close < c2.open && c3.close < c3.open;
                const isGreen = c4.close > c4.open;

                // Bearish reversal: 3 shrinking green candles, then 1 strong red candle
                const allGreen = c1.close > c1.open && c2.close > c2.open && c3.close > c3.open;
                const isRed = c4.close < c4.open;

                if (isShrinking && allRed && isGreen && body4 > body3 && c4.close > c2.high) {
                    markers.push({ time: c4.time as Time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Bull Shrink' });
                } else if (isShrinking && allGreen && isRed && body4 > body3 && c4.close < c2.low) {
                    markers.push({ time: c4.time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Bear Shrink' });
                }
            }
            break;

        case 'breakout_candles':
            // Look for minimum 3 small candles (consolidation) followed by 1 massive breakout candle
            for (let i = 3; i < data.length; i++) {
                const c1 = data[i - 3], c2 = data[i - 2], c3 = data[i - 1], c4 = data[i];
                const body1 = Math.abs(c1.open - c1.close), body2 = Math.abs(c2.open - c2.close), body3 = Math.abs(c3.open - c3.close);
                const avgConsolidationBody = (body1 + body2 + body3) / 3;

                const isConsolidating = Math.max(c1.high, c2.high, c3.high) - Math.min(c1.low, c2.low, c3.low) < avgConsolidationBody * 3;

                const c4Body = Math.abs(c4.open - c4.close);
                const isBreakout = c4Body > avgConsolidationBody * 2; // Breakout candle must be at least 2x the average of the consolidation

                if (isConsolidating && isBreakout) {
                    if (c4.close > c4.open) {
                        markers.push({ time: c4.time as Time, position: 'belowBar', color: '#06b6d4', shape: 'arrowUp', text: 'Bull Breakout' });
                    } else {
                        markers.push({ time: c4.time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Bear Breakout' });
                    }
                }
            }
            break;

        case 'support_resistance':
            // Very simplified S/R test: Find local extrema over a small lookback and detect bouncing
            for (let i = 10; i < data.length; i++) {
                const curr = data[i];
                // Check if current candle bounced off a low from 10 candles ago
                const recentLows = data.slice(i - 10, i).map(d => d.low);
                const minLow = Math.min(...recentLows);

                // If it came near the recent low and bounced up (green pin-bar-ish)
                if (curr.low <= minLow * 1.001 && curr.close > curr.open && curr.close > (curr.high + curr.low) / 2) {
                    markers.push({ time: curr.time as Time, position: 'belowBar', color: '#f97316', shape: 'circle', text: 'Support Bounce' });
                }

                const recentHighs = data.slice(i - 10, i).map(d => d.high);
                const maxHigh = Math.max(...recentHighs);
                // If it came to recent high and rejected down
                if (curr.high >= maxHigh * 0.999 && curr.close < curr.open && curr.close < (curr.high + curr.low) / 2) {
                    markers.push({ time: curr.time as Time, position: 'aboveBar', color: '#ec4899', shape: 'circle', text: 'Reject Resist' });
                }
            }
            break;

        case 'trend_lines':
            addPlaceholderMarker('Trend', '#a855f7');
            break;

        case 'three_bar_reversal':
            // 1. Big candle, 2. Small candle (momentum loss), 3. Massive reversal candle
            for (let i = 2; i < data.length; i++) {
                const c1 = data[i - 2], c2 = data[i - 1], c3 = data[i];
                const b1 = Math.abs(c1.open - c1.close);
                const b2 = Math.abs(c2.open - c2.close);
                const b3 = Math.abs(c3.open - c3.close);

                const c1Red = c1.close < c1.open, c2Red = c2.close < c2.open, c3Green = c3.close > c3.open;
                const c1Green = c1.close > c1.open, c2Green = c2.close > c2.open, c3Red = c3.close < c3.open;

                // 2 is much smaller than 1. 3 is larger than 1.
                if (b2 < b1 * 0.4 && b3 >= b1 * 0.9) {
                    if (c1Red && c2Red && c3Green) { // Bullish Reversal
                        markers.push({ time: c3.time as Time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'Bull 3B Rev' });
                    } else if (c1Green && c2Green && c3Red) { // Bearish Reversal
                        markers.push({ time: c3.time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Bear 3B Rev' });
                    }
                }
            }
            break;

        // --- 2. Indicator-Based Strategies ---
        case 'macd_sar_200ema': {
            const ema200 = calculateEMA(data, 200);
            const { macdLine, signalLine } = calculateMACD(data);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(ema200[i]) || isNaN(macdLine[i]) || isNaN(signalLine[i])) continue;
                if (data[i].close > ema200[i] && macdLine[i - 1] <= signalLine[i - 1] && macdLine[i] > signalLine[i]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Buy MACD' });
                } else if (data[i].close < ema200[i] && macdLine[i - 1] >= signalLine[i - 1] && macdLine[i] < signalLine[i]) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Sell MACD' });
                }
            }
            break;
        }
        case 'bb_squeeze': {
            const sma20 = calculateSMA(data, 20);
            for (let i = 20; i < data.length; i++) {
                let sumSq = 0;
                for (let j = 0; j < 20; j++) sumSq += Math.pow(data[i - j].close - sma20[i], 2);
                const stdDev = Math.sqrt(sumSq / 20);
                const upperBand = sma20[i] + 2 * stdDev;
                const lowerBand = sma20[i] - 2 * stdDev;
                if (data[i].close > upperBand && data[i - 1].close <= upperBand) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#8b5cf6', shape: 'arrowUp', text: 'BB Breakout Up' });
                } else if (data[i].close < lowerBand && data[i - 1].close >= lowerBand) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'BB Breakout Dwn' });
                }
            }
            break;
        }
        case 'ema50_pullback': {
            const ema50 = calculateEMA(data, 50);
            for (let i = 3; i < data.length; i++) {
                if (isNaN(ema50[i])) continue;
                const c1 = data[i - 2], c2 = data[i - 1], c3 = data[i];
                if (c3.close > ema50[i] && c1.close < c1.open && c2.close < c2.open && c3.close > c3.open && c3.close > c2.high) {
                    markers.push({ time: c3.time as Time, position: 'belowBar', color: '#14b8a6', shape: 'arrowUp', text: '50EMA Pull Buy' });
                }
            }
            break;
        }
        case 'ichimoku_cloud': {
            const { spanA, spanB } = calculateIchimoku(data);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(spanA[i]) || isNaN(spanB[i])) continue;
                if (data[i].close > spanA[i] && data[i].close > spanB[i] && spanA[i] > spanB[i]) {
                    if (data[i - 1].close <= Math.max(spanA[i - 1], spanB[i - 1])) {
                        markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Cloud Buy' });
                    }
                } else if (data[i].close < spanA[i] && data[i].close < spanB[i] && spanA[i] < spanB[i]) {
                    if (data[i - 1].close >= Math.min(spanA[i - 1], spanB[i - 1])) {
                        markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Cloud Sell' });
                    }
                }
            }
            break;
        }
        case 'fibonacci_retracement': {
            for (let i = 50; i < data.length; i++) {
                const window = data.slice(i - 50, i);
                const swingLow = Math.min(...window.map(d => d.low));
                const swingHigh = Math.max(...window.map(d => d.high));
                const range = swingHigh - swingLow;
                if (range === 0) continue;

                const fib618 = swingHigh - (range * 0.618);
                const fib50 = swingHigh - (range * 0.5);

                // If current candle low touched the golden zone and it's a bullish candle
                if (data[i].low <= fib50 && data[i].low >= fib618 * 0.99 && data[i].close > data[i].open) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#3b82f6', shape: 'arrowUp', text: 'Fib Buy' });
                }
            }
            break;
        }
        case 'williams_alligator': {
            const { jaw, teeth, lips } = calculateAlligator(data);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(jaw[i])) continue;
                if (lips[i] < teeth[i] && data[i].close > teeth[i] && data[i - 1].close <= teeth[i - 1]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'Ali Buy' });
                } else if (lips[i] > teeth[i] && data[i].close < teeth[i] && data[i - 1].close >= teeth[i - 1]) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Ali Sell' });
                }
            }
            break;
        }
        case 'williams_fractal': {
            const ema200 = calculateEMA(data, 200);
            for (let i = 2; i < data.length - 2; i++) {
                const isHighFractal = data[i].high > data[i - 1].high && data[i].high > data[i - 2].high &&
                    data[i].high > data[i + 1].high && data[i].high > data[i + 2].high;
                if (isHighFractal && data[i].close > ema200[i]) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#8b5cf6', shape: 'circle', text: 'H-Fractal' });
                }
                const isLowFractal = data[i].low < data[i - 1].low && data[i].low < data[i - 2].low &&
                    data[i].low < data[i + 1].low && data[i].low < data[i + 2].low;
                if (isLowFractal && data[i].close < ema200[i]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#ec4899', shape: 'circle', text: 'L-Fractal' });
                }
            }
            break;
        }
        case 'williams_vix_fix': {
            const vixFix = calculateVixFix(data);
            const { kLine, dLine } = calculateStochastic(data);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(vixFix[i]) || isNaN(kLine[i])) continue;
                // Vix Fix peak + Stoch cross up (bottom signal)
                if (vixFix[i] > 10 && kLine[i - 1] <= dLine[i - 1] && kLine[i] > dLine[i]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#06b6d4', shape: 'arrowUp', text: 'VIX Bottom' });
                }
            }
            break;
        }
        case 'stochastic_oscillator': {
            const { kLine, dLine } = calculateStochastic(data, 14, 3, 3);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(kLine[i]) || isNaN(dLine[i])) continue;
                if (kLine[i - 1] <= dLine[i - 1] && kLine[i] > dLine[i] && kLine[i] < 20) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#f97316', shape: 'arrowUp', text: 'Stoch Buy' });
                }
                if (kLine[i - 1] >= dLine[i - 1] && kLine[i] < dLine[i] && kLine[i] > 80) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Stoch Sell' });
                }
            }
            break;
        }
        case 'rsi_divergence': {
            const rsi = calculateRSI(data, 14);
            const ema200 = calculateEMA(data, 200);
            for (let i = 5; i < data.length; i++) {
                if (isNaN(rsi[i]) || isNaN(ema200[i])) continue;
                if (data[i].close > ema200[i] && rsi[i - 1] < 30 && rsi[i] >= 30) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#10b981', shape: 'arrowUp', text: 'RSI OS Bounce' });
                } else if (data[i].close < ema200[i] && rsi[i - 1] > 70 && rsi[i] <= 70) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'RSI OB Reject' });
                }
            }
            break;
        }
        case 'ma_crossover': {
            const sma20 = calculateSMA(data, 20);
            const sma50 = calculateSMA(data, 50);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(sma20[i]) || isNaN(sma50[i])) continue;
                if (sma20[i - 1] <= sma50[i - 1] && sma20[i] > sma50[i]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#eab308', shape: 'arrowUp', text: 'Golden Cross' });
                } else if (sma20[i - 1] >= sma50[i - 1] && sma20[i] < sma50[i]) {
                    markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#ef4444', shape: 'arrowDown', text: 'Death Cross' });
                }
            }
            break;
        }

        // --- 3. Smart Money Concepts (SMC) ---
        case 'fair_value_gap':
            for (let i = 2; i < data.length; i++) {
                const first = data[i - 2];
                const third = data[i];
                if (first.high < third.low && data[i - 1].close > data[i - 1].open) {
                    markers.push({
                        time: data[i - 1].time as Time,
                        position: 'belowBar',
                        color: '#a855f7',
                        shape: 'circle',
                        text: 'FVG (Bull)',
                    });
                }
            }
            break;
        case 'inversion_fvg':
            for (let i = 4; i < data.length; i++) {
                const fvgCandle = data[i - 2];
                // Check if an old bullish FVG got closed below
                if (data[i - 4].high < fvgCandle.low && data[i - 3].close > data[i - 3].open) {
                    if (data[i].close < data[i - 4].high) {
                        markers.push({ time: data[i].time as Time, position: 'aboveBar', color: '#d946ef', shape: 'arrowDown', text: 'iFVG Fail' });
                    }
                }
            }
            break;
        case 'order_blocks':
            for (let i = 2; i < data.length; i++) {
                const c1 = data[i - 2], c2 = data[i - 1], c3 = data[i];
                // Last down candle before strong up move
                if (c1.close < c1.open && c2.close > c2.open && c3.close > c3.open && c3.close > c1.high) {
                    markers.push({ time: c1.time as Time, position: 'belowBar', color: '#0ea5e9', shape: 'arrowUp', text: 'Bull OB' });
                }
            }
            break;
        case 'liquidity_sweeps':
            for (let i = 5; i < data.length - 1; i++) {
                const recentLows = data.slice(i - 5, i).map(d => d.low);
                const minLow = Math.min(...recentLows);
                const curr = data[i];
                if (curr.low < minLow && curr.close > minLow) {
                    markers.push({ time: curr.time as Time, position: 'belowBar', color: '#ef4444', shape: 'circle', text: 'Liq Sweep' });
                }
            }
            break;
        case 'break_of_structure':
        case 'change_of_character':
            // Simplified BOS / CHoCH: break of recent 5-bar high with a strong close
            for (let i = 5; i < data.length; i++) {
                const recentHighs = data.slice(i - 5, i).map(d => d.high);
                const maxHigh = Math.max(...recentHighs);
                if (data[i].close > maxHigh && data[i - 1].close <= maxHigh) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#22c55e', shape: 'arrowUp', text: 'BOS/CHoCH' });
                }
            }
            break;

        // --- 4. Scalping & Intraday Tactics ---
        case 'vwap_strategy': {
            // using SMA as a proxy for VWAP for daily bars
            const sma14 = calculateSMA(data, 14);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(sma14[i])) continue;
                if (data[i].close > sma14[i] && data[i - 1].close <= sma14[i - 1]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#8b5cf6', shape: 'arrowUp', text: 'VWAP Cross' });
                }
            }
            break;
        }
        case 'triple_ema_scalping': {
            const ema9 = calculateEMA(data, 9);
            const ema21 = calculateEMA(data, 21);
            const ema55 = calculateEMA(data, 55);
            for (let i = 1; i < data.length; i++) {
                if (isNaN(ema55[i])) continue;
                if (ema9[i] > ema21[i] && ema21[i] > ema55[i] && ema9[i - 1] <= ema21[i - 1]) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#ec4899', shape: 'arrowUp', text: 'Triple EMA' });
                }
            }
            break;
        }
        case 'heikin_ashi_smoothing':
            for (let i = 1; i < data.length; i++) {
                const haClose = (data[i].open + data[i].high + data[i].low + data[i].close) / 4;
                const haOpen = (data[i - 1].open + data[i - 1].close) / 2;
                if (haClose > haOpen && data[i - 1].close < data[i - 1].open) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#14b8a6', shape: 'arrowUp', text: 'HA Smooth' });
                }
            }
            break;
        case 'volume_oscillator':
            // Dummy logic representing volume bursts overriding regular PA
            for (let i = 1; i < data.length; i++) {
                if (data[i].close > data[i].open && Math.abs(data[i].close - data[i].open) > (data[i].high - data[i].low) * 0.8) {
                    markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#f59e0b', shape: 'circle', text: 'Vol Burst' });
                }
            }
            break;

        // --- 5. Advanced Theories & Misc ---
        case 'elliot_wave':
        case 'harmonic_patterns':
            // High-level conceptual placeholders detecting complex multi-bar geometries
            for (let i = 10; i < data.length; i += 25) {
                markers.push({ time: data[i].time as Time, position: 'belowBar', color: '#3b82f6', shape: 'circle', text: 'Pattern End' });
            }
            break;
    }

    return { markers };
};
