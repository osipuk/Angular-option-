export interface ComputeAnalyzePayoffResult {
  MeanSkew: number,
  DaysToExpiry: number,
  UnderlyingPrice: number,
  BundlePrice: number,
  AtmIV: number,
  DivYield: number,
  RiskFreeRate: number,
}