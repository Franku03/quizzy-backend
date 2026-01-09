export { UserRole as ValidRoles } from '../../../users/domain/value-objects/user.roles';

export interface JwtPayload {
  id: string;
  email: string;
  roles: string[];
}
