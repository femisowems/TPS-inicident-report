import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
      algorithms: ['HS256'],
      audience: 'authenticated', // Explicitly match Supabase's default audience
    });
  }

  async validate(payload: any) {
    console.log('[TPS Security] Decoded JWT Payload:', JSON.stringify(payload, null, 2));
    
    // Determine Role: Supabase metadata -> JWT role -> Email-based heuristics -> 'citizen'
    let rawRole = payload.user_metadata?.role || payload.role;
    let userRole = typeof rawRole === 'string' ? rawRole.trim().toLowerCase() : null;
    
    // Auto-promote system emails to admin during prototyping (override Supabase default 'authenticated' role)
    if (payload.email) {
      const email = payload.email.toLowerCase();
      if (email.includes('admin') || email.includes('officer')) {
        userRole = 'admin';
      }
    }

    const finalRole = userRole === 'authenticated' ? 'citizen' : (userRole || 'citizen');
    
    console.log(`[TPS Security] Final Resolved Role: '${finalRole}'`);

    return { 
      id: payload.sub, 
      email: payload.email, 
      role: finalRole
    };
  }
}
