export interface BaseDomainError {
  type: string;
  message: string;
  timestamp: Date;
  originalError?: any;
}

export type KahootNotFoundError = BaseDomainError & {
  type: 'KahootNotFound';
  kahootId: string;
};

export type InvalidKahootDataError = BaseDomainError & {
  type: 'InvalidKahootData';
  validationDetails?: Record<string, string[]>;
};

export type UnauthorizedError = BaseDomainError & {
  type: 'Unauthorized';
  userId: string;
  kahootId: string;
  action: string;
};