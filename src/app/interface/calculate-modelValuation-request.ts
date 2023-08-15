export interface CalculateModelValuationRequest {
    Strategy: string | undefined,
    Underlying: string | undefined ,
    OptionContracts: string,
    UnderlyingPrice: number,
    BundlePrice: number,
    AtmIV: number,
    DivYield: number,   
    RiskFreeRate: number,
}