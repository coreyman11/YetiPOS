
// Modern, Apple-like color palette based on the provided image
export const COLORS = ['#9b87f5', '#D6BCFA', '#E5DEFF', '#FDE1D3', '#D3E4FD', '#FFDEE2'];

export const CHART_STYLES = {
  background: '#FFFFFF',
  axisColor: '#A9A9B2',
  gridColor: '#F1F0FB',
  tooltipBackground: 'rgba(255, 255, 255, 0.9)',
  tooltipText: '#1A1F2C',
  tooltipBorder: 'rgba(230, 230, 240, 0.7)',
  barColors: ['#9b87f5', '#D6BCFA'],
  lineColors: ['#9b87f5', '#D6BCFA', '#FFB4A2'],
  pieColors: ['#9b87f5', '#D6BCFA', '#E5DEFF', '#FDE1D3', '#D3E4FD', '#FFDEE2'],
  areaColors: ['#9b87f5', '#D6BCFA'],
  // Apple-like gradient stops
  gradients: {
    purple: {
      start: '#9b87f5',
      end: '#D6BCFA',
    },
    lightPurple: {
      start: '#D6BCFA',
      end: '#E5DEFF',
    },
    orange: {
      start: '#FFB4A2',
      end: '#FDE1D3',
    }
  }
};

// Modern chart configuration for consistent Apple-like appearance
export const CHART_CONFIG = {
  axisFontSize: 12,
  tooltipFontSize: 12,
  animationDuration: 1000,
  borderRadius: 8,
  strokeWidth: 2,
  dotSize: 5,
  activeDotSize: 7,
  opacity: {
    area: 0.5,
    activeArea: 0.8
  },
  margin: { top: 20, right: 30, left: 20, bottom: 30 }
};
