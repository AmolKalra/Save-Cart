import React, { useEffect, useRef } from 'react';
import { formatPrice } from '@/lib/utils';
import type { PriceHistory } from '@/types';
import { cn } from '@/lib/utils';

interface PriceChartProps {
  priceHistory: PriceHistory[];
  height?: number;
  className?: string;
  showPriceLabels?: boolean;
  minimalistic?: boolean;
}

export function PriceChart({
  priceHistory,
  height = 40,
  className,
  showPriceLabels = false,
  minimalistic = false
}: PriceChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || priceHistory.length === 0) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Sort history by date
    const sortedHistory = [...priceHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // Get min and max prices for scaling
    const prices = sortedHistory.map(item => Number(item.price));
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const priceRange = maxPrice - minPrice;
    
    // Draw chart
    const padding = minimalistic ? 0 : 10;
    const chartWidth = canvas.width - (padding * 2);
    const chartHeight = canvas.height - (padding * 2);
    
    // Helper function to normalize values
    const normalizeX = (index: number) => padding + (index / (sortedHistory.length - 1 || 1)) * chartWidth;
    const normalizeY = (price: number) => {
      if (priceRange === 0) return padding + chartHeight / 2;
      return padding + chartHeight - ((price - minPrice) / priceRange) * chartHeight;
    };
    
    // Draw the line
    ctx.beginPath();
    ctx.moveTo(
      normalizeX(0),
      normalizeY(Number(sortedHistory[0].price))
    );
    
    sortedHistory.forEach((item, index) => {
      if (index === 0) return;
      ctx.lineTo(
        normalizeX(index),
        normalizeY(Number(item.price))
      );
    });
    
    // Style the line
    ctx.strokeStyle = '#4F46E5'; // Primary color
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Fill area under the line
    if (!minimalistic) {
      ctx.lineTo(normalizeX(sortedHistory.length - 1), canvas.height - padding);
      ctx.lineTo(normalizeX(0), canvas.height - padding);
      ctx.closePath();
      ctx.fillStyle = 'rgba(79, 70, 229, 0.1)'; // Primary color with transparency
      ctx.fill();
    }
    
    // Get first and last price to determine trend
    const firstPrice = Number(sortedHistory[0].price);
    const lastPrice = Number(sortedHistory[sortedHistory.length - 1].price);
    const trend = lastPrice < firstPrice ? 'down' : lastPrice > firstPrice ? 'up' : 'stable';
    
    // Draw a horizontal line at the bottom representing the trend
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.strokeStyle = trend === 'down' 
      ? '#22C55E'  // Success/green color
      : trend === 'up' 
        ? '#EF4444'  // Error/red color
        : '#9CA3AF'; // Neutral/gray color
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Add price labels if requested
    if (showPriceLabels && !minimalistic) {
      ctx.font = '10px Inter, sans-serif';
      ctx.fillStyle = '#64748B'; // Text color
      ctx.textAlign = 'left';
      ctx.fillText(formatPrice(minPrice), padding, canvas.height - 2);
      ctx.textAlign = 'right';
      ctx.fillText(formatPrice(maxPrice), canvas.width - padding, padding + 10);
    }
    
  }, [priceHistory, height, minimalistic, showPriceLabels]);
  
  return (
    <div className={cn(
      'price-chart relative w-full bg-gray-50 rounded overflow-hidden',
      className
    )} style={{ height: `${height}px` }}>
      <canvas 
        ref={canvasRef} 
        width={300} 
        height={height}
        className="w-full h-full"
      />
    </div>
  );
}
