import { ChartData } from './mockData';

export const calculateSMA = (data: ChartData[], period: number): number[] => {
    const sma: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            sma.push(NaN);
        } else {
            let sum = 0;
            for (let j = 0; j < period; j++) {
                sum += data[i - j].close;
            }
            sma.push(sum / period);
        }
    }
    return sma;
};

export const calculateEMA = (data: ChartData[], period: number): number[] => {
    const ema: number[] = [];
    const multiplier = 2 / (period + 1);
    let prevEma = 0;

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            ema.push(data[i].close);
            prevEma = data[i].close;
        } else {
            const currentEma = (data[i].close - prevEma) * multiplier + prevEma;
            ema.push(currentEma);
            prevEma = currentEma;
        }
    }
    return ema;
};

export const calculateMACD = (data: ChartData[], fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) => {
    const fastEma = calculateEMA(data, fastPeriod);
    const slowEma = calculateEMA(data, slowPeriod);
    const macdLine = data.map((_, i) => fastEma[i] - slowEma[i]);

    // Calculate signal line (EMA of MACD line)
    const signalLine: number[] = [];
    const multiplier = 2 / (signalPeriod + 1);
    let prevSignal = macdLine[0];

    for (let i = 0; i < macdLine.length; i++) {
        if (isNaN(macdLine[i])) {
            signalLine.push(NaN);
        } else if (i === 0 || isNaN(prevSignal)) {
            signalLine.push(macdLine[i]);
            prevSignal = macdLine[i];
        } else {
            const currentSignal = (macdLine[i] - prevSignal) * multiplier + prevSignal;
            signalLine.push(currentSignal);
            prevSignal = currentSignal;
        }
    }

    const histogram = macdLine.map((val, i) => val - signalLine[i]);
    return { macdLine, signalLine, histogram };
};

export const calculateRSI = (data: ChartData[], period = 14): number[] => {
    const rsi: number[] = [];
    let avgGain = 0;
    let avgLoss = 0;

    for (let i = 0; i < data.length; i++) {
        if (i === 0) {
            rsi.push(NaN);
            continue;
        }

        const diff = data[i].close - data[i - 1].close;
        const gain = Math.max(0, diff);
        const loss = Math.max(0, -diff);

        if (i < period) {
            avgGain += gain;
            avgLoss += loss;
            rsi.push(NaN);
        } else if (i === period) {
            avgGain /= period;
            avgLoss /= period;
            const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
            rsi.push(100 - (100 / (1 + rs)));
        } else {
            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;
            const rs = avgGain / (avgLoss === 0 ? 1 : avgLoss);
            rsi.push(100 - (100 / (1 + rs)));
        }
    }
    return rsi;
};

export const calculateStochastic = (data: ChartData[], period = 14, smoothK = 3, smoothD = 3) => {
    const kLine: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < period - 1) {
            kLine.push(NaN);
        } else {
            const window = data.slice(i - period + 1, i + 1);
            const highestHigh = Math.max(...window.map(d => d.high));
            const lowestLow = Math.min(...window.map(d => d.low));
            const k = ((data[i].close - lowestLow) / (highestHigh - lowestLow)) * 100;
            kLine.push(k);
        }
    }

    // Smooth K line
    const smoothedK: number[] = [];
    for (let i = 0; i < kLine.length; i++) {
        if (i < period - 1 + smoothK - 1) {
            smoothedK.push(NaN);
        } else {
            let sum = 0;
            for (let j = 0; j < smoothK; j++) {
                sum += kLine[i - j];
            }
            smoothedK.push(sum / smoothK);
        }
    }

    // Smooth D line (SMA of smoothed K)
    const dLine: number[] = [];
    for (let i = 0; i < smoothedK.length; i++) {
        if (i < period - 1 + smoothK - 1 + smoothD - 1) {
            dLine.push(NaN);
        } else {
            let sum = 0;
            for (let j = 0; j < smoothD; j++) {
                sum += smoothedK[i - j];
            }
            dLine.push(sum / smoothD);
        }
    }

    return { kLine: smoothedK, dLine };
};

export const calculateIchimoku = (data: ChartData[]) => {
    const tenkan = data.map((_, i) => {
        if (i < 8) return NaN;
        const window = data.slice(i - 8, i + 1);
        return (Math.max(...window.map(d => d.high)) + Math.min(...window.map(d => d.low))) / 2;
    });
    const kijun = data.map((_, i) => {
        if (i < 25) return NaN;
        const window = data.slice(i - 25, i + 1);
        return (Math.max(...window.map(d => d.high)) + Math.min(...window.map(d => d.low))) / 2;
    });
    const spanA = tenkan.map((val, i) => (val + kijun[i]) / 2);
    const spanB = data.map((_, i) => {
        if (i < 51) return NaN;
        const window = data.slice(i - 51, i + 1);
        return (Math.max(...window.map(d => d.high)) + Math.min(...window.map(d => d.low))) / 2;
    });
    return { tenkan, kijun, spanA, spanB };
};

export const calculateVixFix = (data: ChartData[], period = 22) => {
    return data.map((_, i) => {
        if (i < period - 1) return NaN;
        const window = data.slice(i - period + 1, i + 1);
        const highestClose = Math.max(...window.map(d => d.close));
        return ((highestClose - data[i].low) / highestClose) * 100;
    });
};

export const calculateAlligator = (data: ChartData[]) => {
    // Smoothed SMA proxy
    const jaw = calculateEMA(data, 13);
    const teeth = calculateEMA(data, 8);
    const lips = calculateEMA(data, 5);
    return { jaw, teeth, lips };
};

