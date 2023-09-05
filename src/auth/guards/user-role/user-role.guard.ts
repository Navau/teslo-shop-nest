import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { filter, includes, isUndefined, size } from 'lodash';
import { Observable } from 'rxjs';
import { META_ROLES } from 'src/auth/decorators';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class UserRoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const metaDataRoles: string[] = this.reflector.get(
      META_ROLES,
      context.getHandler(),
    );
    if (isUndefined(metaDataRoles) || size(metaDataRoles) === 0) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user as User;

    if (!user) throw new BadRequestException('User not found');
    const validRoles = filter(user.roles, (role) => {
      if (includes(metaDataRoles, role)) return true;
    });

    if (size(validRoles) === 0)
      throw new ForbiddenException(
        `User ${user.fullName} need a valid role: [${metaDataRoles}]`,
      );
    return true;
  }
}
