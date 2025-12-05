export interface BaseInfrastructureError {
  type: string;
  message: string;
  originalError?: any;
  timestamp: Date;
  context?: Record<string, any>;
}

export type InfrastructureErrorOf<T extends string> = BaseInfrastructureError & {
  type: T;
};