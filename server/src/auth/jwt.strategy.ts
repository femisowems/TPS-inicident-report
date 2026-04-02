import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    const rawPublicKey = configService.get<string>('SUPABASE_JWT_PUBLIC_KEY');
    const secretKey = configService.get<string>('SUPABASE_JWT_SECRET');

    // DEEP DIAGNOSTIC LOGGING
    console.log(`[TPS Security] Environment Check:`);
    console.log(`- Raw Public Key Length: ${rawPublicKey?.length || 0}`);
    console.log(`- Shared Secret Length: ${secretKey?.length || 0}`);

    // Robust handling of PEM keys from env variables (handle escaped newlines and quotes)
    const formattedPublicKey = rawPublicKey 
      ? rawPublicKey.replace(/\\n/g, '\n').replace(/"/g, '').trim() 
      : null;
      
    if (formattedPublicKey) {
      console.log(`- Final PEM Key Starts With: ${formattedPublicKey.substring(0, 20)}...`);
    }

    const finalKey = formattedPublicKey || secretKey;

    if (!finalKey) {
      throw new Error('Neither SUPABASE_JWT_PUBLIC_KEY nor SUPABASE_JWT_SECRET is defined');
    }

    const algorithm = formattedPublicKey ? 'ES256' : 'HS256';
    
    console.log(`- Selected Algorithm: ${algorithm}`);

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: finalKey,
      algorithms: [algorithm],
      // TEMPORARILY REMOVED: audience: 'authenticated'
      // This will help us see if a claim mismatch is the culprit
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
