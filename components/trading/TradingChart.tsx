'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import {
  createChart,
  IChartApi,
  ISeriesApi,
  CrosshairMode,
  LineStyle,
  CandlestickSeries,
  HistogramSeries,
} from 'lightweight-charts';
import { TokenInfo } from '@/stores/tradingStore';

interface TradingChartProps {
  token: TokenInfo | null;
  onPriceClick?: (price: number) => void;
}

const INTERVALS = ['1m', '5m', '15m', '1h', '4h', '1D', '1W'];

export default function TradingChart({ token, onPriceClick }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const [interval, setIntervalState] = useState('1h');
  const [tokenInfo, setTokenInfo] = useState<{ price: number; change: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#0F1419' },
        textColor: '#B4B9C5',
        fontSize: 12,
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.Dashed },
        horzLines: { color: 'rgba(255, 255, 255, 0.04)', style: LineStyle.Dashed },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(255, 255, 255, 0.2)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        scaleMargins: { top: 0.1, bottom: 0.3 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.08)',
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true },
      handleScale: { mouseWheel: true, pinch: true },
    });

    // lightweight-charts v5 API
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00E5FF',
      downColor: '#FF6B35',
      borderVisible: false,
      wickUpColor: '#00E5FF',
      wickDownColor: '#FF6B35',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    chart.subscribeClick((param) => {
      if (!param.point || !candleRef.current) return;
      const priceY = param.point.y;
      const price = candleSeries.coordinateToPrice(priceY);
      if (price && onPriceClick) {
        onPriceClick(price);
      }
    });

    return chart;
  }, [onPriceClick]);

  const loadChartData = useCallback(async () => {
    if (!candleRef.current || !volumeRef.current) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        interval,
        ...(token?.address ? { address: token.address } : { symbol: 'BTC' }),
        ...(token?.chainId ? { chain: token.chainId } : {}),
      });

      const res = await fetch(`/api/market/chart?${params}`);
      const data = await res.json();

      if (data.candles && data.candles.length > 0) {
        candleRef.current.setData(data.candles);
        if (data.volume) volumeRef.current.setData(data.volume);

        const last = data.candles[data.candles.length - 1];
        const first = data.candles[0];
        const change = ((last.close - first.open) / first.open) * 100;
        setTokenInfo({ price: last.close, change });

        chartRef.current?.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Chart data error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, interval]);

  useEffect(() => {
    initChart();

    const handleResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      chartRef.current?.remove();
    };
  }, [initChart]);

  useEffect(() => {
    loadChartData();
  }, [loadChartData]);

  return (
    <div className="relative w-full h-full bg-bg-chart">
      {/* Header Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center gap-4 px-4 py-3 bg-bg-chart/80 backdrop-blur-sm border-b border-border-subtle">
        <div className="flex items-center gap-3">
          <div>
            <div className="font-bold text-white">{token?.symbol ?? 'BTC'}/{token?.chain === 'SOLANA' ? 'SOL' : 'USDC'}</div>
            <div className="text-xs text-text-tertiary">{token?.name ?? 'Bitcoin'}</div>
          </div>
          {tokenInfo && (
            <>
              <div className="font-mono text-lg font-bold text-white">
                ${tokenInfo.price.toLocaleString('en-US', { maximumFractionDigits: 6 })}
              </div>
              <div className={`text-sm font-semibold ${tokenInfo.change >= 0 ? 'text-electric-blue' : 'text-bingo-orange'}`}>
                {tokenInfo.change >= 0 ? '+' : ''}{tokenInfo.change.toFixed(2)}%
              </div>
            </>
          )}
        </div>

        <div className="flex-1" />

        <div className="flex items-center gap-1">
          {INTERVALS.map((int) => (
            <button
              key={int}
              onClick={() => setIntervalState(int)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                interval === int
                  ? 'bg-neon-blue text-white'
                  : 'text-text-tertiary hover:text-white hover:bg-bg-tertiary'
              }`}
            >
              {int}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-bg-chart/50">
          <div className="w-6 h-6 border-2 border-neon-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div ref={containerRef} className="w-full h-full pt-14" />

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-text-tertiary/20 text-2xl font-black pointer-events-none select-none">
        STEINZ LABS
      </div>
    </div>
  );
}
