import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString(), system: 'TPS Forensic' };
  }

  @Get('auth-test')
  authTest() {
    return { message: 'Security Endpoint Reachable. Send a Bearer token to verify decoding.' };
  }

  @Get('debug-security')
  debugSecurity() {
    return {
      status: 'Diagnostic Active',
      publicKeyDefined: !!process.env.SUPABASE_JWT_PUBLIC_KEY,
      publicKeyLength: process.env.SUPABASE_JWT_PUBLIC_KEY?.length || 0,
      secretDefined: !!process.env.SUPABASE_JWT_SECRET,
      nodeVersion: process.version,
      envMode: process.env.NODE_ENV
    };
  }
}
