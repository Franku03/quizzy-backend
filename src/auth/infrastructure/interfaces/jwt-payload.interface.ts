export { UserRole as ValidRoles } from '../../../users/domain/value-objects/user.roles';

export interface JwtPayload {
  id: string;
  username: string;
  email: string;
  roles: string[];
}
