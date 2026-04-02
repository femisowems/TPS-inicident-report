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
}
