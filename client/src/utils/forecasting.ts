// Simple Moving Average calculation
export const calculateMovingAverage = (data: number[], windowSize: number): number => {
  if (data.length < windowSize) {
    // Not enough data for the window size, return average of all data
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }
  
  // Use only the last <windowSize> elements
  const window = data.slice(-windowSize);
  return window.reduce((sum, value) => sum + value, 0) / windowSize;
};

// Weighted Moving Average calculation giving more importance to recent data
export const calculateWeightedMovingAverage = (data: number[], weights: number[]): number => {
  if (data.length === 0) return 0;
  if (data.length < weights.length) {
    // Adjust weights array to match data length
    weights = weights.slice(-data.length);
  }
  
  const valuesForAverage = data.slice(-weights.length);
  let weightSum = 0;
  let weightedSum = 0;
  
  for (let i = 0; i < valuesForAverage.length; i++) {
    weightedSum += valuesForAverage[i] * weights[i];
    weightSum += weights[i];
  }
  
  return weightedSum / weightSum;
};

// Calculate seasonality factor based on historical data
export const calculateSeasonality = (
  data: number[],
  period: number // e.g., 7 for weekly
): number[] => {
  if (data.length < period) return Array(period).fill(1);
  
  // Calculate average for each position in the period
  const seasonalIndices = Array(period).fill(0);
  const counts = Array(period).fill(0);
  
  for (let i = 0; i < data.length; i++) {
    const periodPosition = i % period;
    seasonalIndices[periodPosition] += data[i];
    counts[periodPosition]++;
  }
  
  // Calculate average for each position
  const periodAverages = seasonalIndices.map((sum, i) => sum / counts[i]);
  
  // Calculate overall average
  const overallAverage = data.reduce((sum, val) => sum + val, 0) / data.length;
  
  // Calculate seasonal factors
  return periodAverages.map(avg => avg / overallAverage);
};

// Generate forecast using a combination of moving average and seasonality
export const generateForecast = (
  historicalData: number[],
  daysToForecast: number,
  useMMA: boolean = true, // Use moving or weighted moving average
  seasonalPeriod: number = 7 // Weekly seasonality
): number[] => {
  if (historicalData.length === 0) return Array(daysToForecast).fill(0);
  
  // Calculate baseline using moving average or weighted moving average
  let baseline: number;
  if (useMMA) {
    baseline = calculateMovingAverage(historicalData, Math.min(14, historicalData.length));
  } else {
    // Weights for most recent 7 days, giving more weight to recent days
    const weights = [0.05, 0.05, 0.1, 0.1, 0.2, 0.2, 0.3];
    baseline = calculateWeightedMovingAverage(historicalData, weights);
  }
  
  // Calculate seasonality factors
  const seasonalFactors = calculateSeasonality(historicalData, seasonalPeriod);
  
  // Generate forecast
  const forecast: number[] = [];
  for (let i = 0; i < daysToForecast; i++) {
    const seasonIndex = (historicalData.length + i) % seasonalPeriod;
    const seasonFactor = seasonalFactors[seasonIndex];
    forecast.push(baseline * seasonFactor);
  }
  
  return forecast;
};

// Add random noise to forecasts to simulate real-world variability
export const addNoise = (value: number, noisePercentage: number = 0.1): number => {
  const noise = (Math.random() * 2 - 1) * value * noisePercentage;
  return Math.max(0, value + noise);
};

// Calculate forecast accuracy as percentage
export const calculateAccuracy = (forecast: number, actual: number): number => {
  if (actual === 0) return forecast === 0 ? 100 : 0;
  
  const error = Math.abs(forecast - actual);
  return Math.max(0, 100 - (error / actual) * 100);
};
