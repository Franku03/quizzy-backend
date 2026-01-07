export enum ValidRoles {
    admin = 'admin',
    user = 'user',
  }
  
  export interface JwtPayload {
    id: string;
    email: string;
    roles: string[];
  }