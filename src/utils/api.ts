import { ChartData } from './mockData';

export type Timeframe = '1m' | '5m' | '15m' | '30m' | '60m' | '1d' | '1wk';

export async function fetchYahooFinanceData(symbol: string, interval: Timeframe = '1d'): Promise<ChartData[]> {
    // Determine the max allowed range for the chosen interval
    let range = '1y';
    if (interval === '1m') range = '7d';
    else if (['5m', '15m', '30m'].includes(interval)) range = '60d';
    else if (interval === '60m') range = '730d'; // technically ~2 years max

    const url = `/api/yfinance/v8/finance/chart/${symbol}?interval=${interval}&range=${range}`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        const json = await response.json();
        const result = json.chart.result[0];

        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const formattedData: ChartData[] = [];
        let lastTimeVal = -1;

        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.open[i] !== null && quotes.close[i] !== null) {

                let timeVal: any;

                if (interval === '1d' || interval === '1wk') {
                    // For daily/weekly, use YYYY-MM-DD
                    const date = new Date(timestamps[i] * 1000);
                    timeVal = date.toISOString().split('T')[0];
                } else {
                    // For intraday, lightweight-charts requires UNIX timestamps (seconds)
                    timeVal = timestamps[i];
                }

                // Strictly unique time values
                if (timeVal === lastTimeVal) continue;
                lastTimeVal = timeVal;

                formattedData.push({
                    time: timeVal,
                    open: Number(quotes.open[i].toFixed(2)),
                    high: Number(quotes.high[i].toFixed(2)),
                    low: Number(quotes.low[i].toFixed(2)),
                    close: Number(quotes.close[i].toFixed(2)),
                    volume: quotes.volume[i] || 0
                });
            }
        }

        return formattedData;
    } catch (err) {
        console.error(err);
        throw err;
    }
}
