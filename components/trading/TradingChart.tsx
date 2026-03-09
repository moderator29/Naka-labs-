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

// Display labels → API interval params
const INTERVALS: { label: string; apiInterval: string; days: number }[] = [
  { label: '1H',  apiInterval: '1h',  days: 1   },
  { label: '4H',  apiInterval: '4h',  days: 7   },
  { label: '1D',  apiInterval: '1D',  days: 30  },
  { label: '1W',  apiInterval: '1W',  days: 180 },
  { label: '1M',  apiInterval: '1D',  days: 365 },
];

function fmtPrice(p: number): string {
  if (p >= 10000) return p.toLocaleString('en-US', { maximumFractionDigits: 0 });
  if (p >= 1)     return p.toFixed(2);
  if (p >= 0.001) return p.toFixed(5);
  return p.toFixed(8);
}

export default function TradingChart({ token, onPriceClick }: TradingChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const candleRef    = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef    = useRef<ISeriesApi<'Histogram'> | null>(null);

  const [activeInterval, setActiveInterval] = useState(INTERVALS[2]); // default 1D
  const [livePrice,  setLivePrice]  = useState<number | null>(null);
  const [liveChange, setLiveChange] = useState<number>(0);
  const [loading,    setLoading]    = useState(false);

  // ── Init chart ──────────────────────────────────────────────
  const initChart = useCallback(() => {
    if (!containerRef.current) return;
    if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }

    const chart = createChart(containerRef.current, {
      width:  containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#0F1419' },
        textColor:  '#6E7A8E',
        fontSize:   11,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dashed },
        horzLines: { color: 'rgba(255,255,255,0.03)', style: LineStyle.Dashed },
      },
      crosshair: {
        mode:     CrosshairMode.Normal,
        vertLine: { color: 'rgba(0,229,255,0.25)', width: 1, style: LineStyle.Dashed },
        horzLine: { color: 'rgba(0,229,255,0.25)', width: 1, style: LineStyle.Dashed },
      },
      rightPriceScale: {
        borderColor:  'rgba(255,255,255,0.06)',
        scaleMargins: { top: 0.08, bottom: 0.28 },
        textColor:    '#6E7A8E',
      },
      timeScale: {
        borderColor:    'rgba(255,255,255,0.06)',
        timeVisible:    true,
        secondsVisible: false,
        rightOffset:    5,
        barSpacing:     8,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale:  { mouseWheel: true, pinch: true },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor:      '#00C874',
      downColor:    '#FF4444',
      borderVisible: false,
      wickUpColor:   '#00C874',
      wickDownColor: '#FF4444',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color:       '#26a69a',
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.82, bottom: 0 },
    });

    chartRef.current  = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;

    // Click on chart → set limit price
    chart.subscribeClick((param) => {
      if (!param.point || !candleRef.current) return;
      const price = candleSeries.coordinateToPrice(param.point.y);
      if (price && onPriceClick) onPriceClick(price);
    });

    return chart;
  }, [onPriceClick]);

  // ── Load chart data ──────────────────────────────────────────
  const loadData = useCallback(async () => {
    if (!candleRef.current || !volumeRef.current) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        interval: activeInterval.apiInterval,
        ...(token?.address && token.address.length > 6 && !token.address.startsWith('0x0')
          ? { address: token.address }
          : { symbol: token?.symbol ?? 'BTC' }),
        ...(token?.chainId ? { chain: token.chainId } : {}),
      });

      const res  = await fetch(`/api/market/chart?${params}`);
      const data = await res.json();

      if (data.candles?.length) {
        candleRef.current.setData(data.candles);
        if (data.volume?.length) volumeRef.current.setData(data.volume);

        const last  = data.candles[data.candles.length - 1];
        const first = data.candles[0];
        setLivePrice(last.close);
        setLiveChange(((last.close - first.open) / first.open) * 100);
        chartRef.current?.timeScale().fitContent();
      }
    } catch (err) {
      console.error('Chart data error:', err);
    } finally {
      setLoading(false);
    }
  }, [token, activeInterval]);

  // ── Setup / cleanup ──────────────────────────────────────────
  useEffect(() => {
    initChart();
    const onResize = () => {
      if (chartRef.current && containerRef.current) {
        chartRef.current.applyOptions({
          width:  containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      chartRef.current?.remove();
    };
  }, [initChart]);

  useEffect(() => { loadData(); }, [loadData]);

  const displayPrice  = livePrice  ?? token?.price  ?? 0;
  const displayChange = liveChange;

  return (
    <div className="relative w-full h-full flex flex-col bg-[#0F1419]">
      {/* ── Chart toolbar ── */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/5 flex-shrink-0 bg-[#0F1419]">
        {/* Price display */}
        <div className="flex items-center gap-3">
          <span className="font-mono text-[15px] font-bold text-white">
            ${fmtPrice(displayPrice)}
          </span>
          <span className={`text-[12px] font-semibold px-2 py-0.5 rounded-md ${
            displayChange >= 0 ? 'text-[#00C874] bg-[#00C874]/10' : 'text-[#FF4444] bg-[#FF4444]/10'
          }`}>
            {displayChange >= 0 ? '+' : ''}{displayChange.toFixed(2)}%
          </span>
        </div>

        {/* Timeframe buttons */}
        <div className="flex items-center gap-0.5">
          {INTERVALS.map(iv => (
            <button
              key={iv.label}
              onClick={() => setActiveInterval(iv)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
                activeInterval.label === iv.label
                  ? 'bg-white/14 text-white ring-1 ring-white/15'
                  : 'text-white/30 hover:text-white/60 hover:bg-white/6'
              }`}
            >
              {iv.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Canvas area ── */}
      {loading && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-[#0F1419]/70 pointer-events-none">
          <div className="w-6 h-6 border-2 border-[#00E5FF] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      <div ref={containerRef} className="flex-1 min-h-0" />

      {/* Watermark */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-white/[0.04] text-[28px] font-black tracking-widest pointer-events-none select-none uppercase">
        STEINZ LABS
      </div>
    </div>
  );
}
