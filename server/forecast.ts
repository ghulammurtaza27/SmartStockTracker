import { ForecastData } from "@shared/schema";

// Type for historical demand data
type HistoricalDemand = {
  date: Date;
  demand: number;
};

// Type for forecast data
type DemandForecast = {
  date: Date;
  demand: number;
};

// Simple Moving Average calculation
const calculateMovingAverage = (data: number[], windowSize: number): number => {
  if (data.length < windowSize) {
    // Not enough data for the window size, return average of all data
    return data.reduce((sum, value) => sum + value, 0) / data.length;
  }
  
  // Use only the last <windowSize> elements
  const window = data.slice(-windowSize);
  return window.reduce((sum, value) => sum + value, 0) / windowSize;
};

// Weighted Moving Average calculation
const calculateWeightedMovingAverage = (data: number[], weights: number[]): number => {
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

// Calculate seasonality factor
const calculateSeasonality = (
  data: number[],
  period: number = 7 // Weekly seasonality by default
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

// Main forecasting function
export function forecastDemand(
  productId: number,
  historicalDemand: HistoricalDemand[],
  daysToForecast: number = 7
): DemandForecast[] {
  // Extract demand values from historical data
  const demandValues = historicalDemand.map(data => data.demand);
  
  // If no historical data, return simple placeholders
  if (demandValues.length === 0) {
    return Array(daysToForecast)
      .fill(0)
      .map((_, i) => ({
        date: new Date(Date.now() + i * 24 * 60 * 60 * 1000),
        demand: 5 + Math.random() * 5, // Random placeholder demand between 5-10
      }));
  }
  
  // Calculate baseline using weighted moving average
  // Weights give more importance to recent data
  const weights = [0.1, 0.1, 0.15, 0.15, 0.2, 0.3];
  const baseline = calculateWeightedMovingAverage(
    demandValues,
    weights
  );
  
  // Calculate seasonality factors (weekly pattern)
  const seasonalFactors = calculateSeasonality(demandValues);
  
  // Generate forecast
  const forecast: DemandForecast[] = [];
  const startDate = new Date();
  
  for (let i = 0; i < daysToForecast; i++) {
    const forecastDate = new Date(startDate);
    forecastDate.setDate(startDate.getDate() + i);
    
    // Get day of week (0-6, where 0 is Sunday)
    const dayOfWeek = forecastDate.getDay();
    
    // Apply seasonality factor to baseline
    let forecastedDemand = baseline * seasonalFactors[dayOfWeek];
    
    // Add small random variation (± 10%)
    const randomFactor = 0.9 + Math.random() * 0.2; // 0.9 to 1.1
    forecastedDemand *= randomFactor;
    
    // Ensure non-negative demand and round to 1 decimal place
    forecastedDemand = Math.max(0, Math.round(forecastedDemand * 10) / 10);
    
    forecast.push({
      date: forecastDate,
      demand: forecastedDemand,
    });
  }
  
  return forecast;
}
