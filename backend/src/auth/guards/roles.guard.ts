import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common'; // Import ForbiddenException
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest(); // user should be populated by JwtAuthGuard
    console.log('RolesGuard - User:', user ? { id: user.id, email: user.email, role: user.role } : null);
    console.log('RolesGuard - Required Roles:', requiredRoles);

    if (!user || !user.role) {
      throw new UnauthorizedException('User not authenticated or role not found');
    }
    if (!requiredRoles.includes(user.role)) {
      console.warn(`RolesGuard mismatch: user.role="${user.role}", requiredRoles=${JSON.stringify(requiredRoles)}`);
      throw new ForbiddenException('Insufficient permissions'); // Throw ForbiddenException for role mismatch
    }
    return true;
  }
}
