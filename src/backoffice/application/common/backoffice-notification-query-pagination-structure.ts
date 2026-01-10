export interface BackofficeUserQueryPaginationStructure {
  sender?: string;
  userId?: string;
  limit?: number;
  page?: number;
  orderBy?: 'createdAt';
  order?: 'asc' | 'desc';
  subject?: string;
}
