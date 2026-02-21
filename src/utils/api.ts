import { ChartData } from './mockData';

export async function fetchYahooFinanceData(symbol: string): Promise<ChartData[]> {
    const url = `/api/yfinance/v8/finance/chart/${symbol}?interval=1d&range=1y`;

    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch data');

        const json = await response.json();
        const result = json.chart.result[0];

        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];

        const formattedData: ChartData[] = [];
        let lastDateStr = '';

        for (let i = 0; i < timestamps.length; i++) {
            if (quotes.open[i] !== null && quotes.close[i] !== null) {
                // Convert Unix timestamp to YYYY-MM-DD
                const date = new Date(timestamps[i] * 1000);
                const dateStr = date.toISOString().split('T')[0];

                // Lightweight charts requires strictly unique and increasing time values
                if (dateStr === lastDateStr) continue;
                lastDateStr = dateStr;

                formattedData.push({
                    time: dateStr,
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
