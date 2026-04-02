import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  handleRequest(err: any, user: any, info: any) {
    // This will reveal the "Secret" reason Passport is rejecting the token
    if (err || !user) {
      console.error('[TPS Security Guard] Authentication Failure:');
      console.error(`- Error: ${err?.message || 'None'}`);
      console.error(`- Info: ${info?.message || 'No additional info'}`);
      
      throw err || new UnauthorizedException(info?.message || 'Unauthorized');
    }
    return user;
  }
}
