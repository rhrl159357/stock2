export interface ChartData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateMockData(days: number = 200, startPrice: number = 100): ChartData[] {
  const data: ChartData[] = [];
  let currentPrice = startPrice;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  for (let i = 0; i < days; i++) {
    const volatility = currentPrice * 0.02; // 2% daily volatility
    const change = (Math.random() - 0.5) * volatility;
    
    // Create sensible OHLC relative to the change
    const open = currentPrice;
    const close = currentPrice + change;
    
    const range = Math.abs(change) * (1 + Math.random());
    const high = Math.max(open, close) + (Math.random() * range * 0.5);
    const low = Math.min(open, close) - (Math.random() * range * 0.5);
    
    // Volume mostly random, slightly higher on down days
    const baseVolume = 1000000;
    const volumeMultiplier = change < 0 ? 1.5 : 1;
    const volume = Math.floor(baseVolume * volumeMultiplier * (0.5 + Math.random()));

    // advance date
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    // Skip weekends roughly (simplistic)
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    data.push({
      time: d.toISOString().split('T')[0],
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume
    });

    currentPrice = close;
  }

  return data;
}
