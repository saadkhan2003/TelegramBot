import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  SetMetadata,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

@Injectable()
export class AdminAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    const token = authHeader.split(' ')[1];
    try {
      const payload = this.jwtService.verify(token);
      request.admin = payload;

      const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
        PERMISSIONS_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!requiredPermissions || requiredPermissions.length === 0) {
        return true;
      }

      // Check if admin is OWNER, ADMIN, or SUPER_ADMIN role or has required permission
      if (
        payload.roles &&
        (payload.roles.includes('OWNER') ||
          payload.roles.includes('ADMIN') ||
          payload.roles.includes('SUPER_ADMIN'))
      ) {
        return true;
      }

      if (payload.permissions && payload.permissions.includes('*')) {
        return true;
      }

      const hasPermission = requiredPermissions.every((perm) =>
        payload.permissions?.includes(perm),
      );

      if (!hasPermission) {
        throw new UnauthorizedException('Insufficient permissions');
      }

      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) {
        throw err;
      }
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
