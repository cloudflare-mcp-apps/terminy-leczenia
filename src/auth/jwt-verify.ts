/**
 * JWT Verification via WorkOS AuthKit JWKS
 *
 * Verifies access tokens issued by AuthKit using the public JWKS endpoint.
 * The JWKS is lazily initialized and cached by jose across requests in the same isolate.
 */

import { jwtVerify, createRemoteJWKSet, errors as joseErrors } from 'jose';
import { logger } from '../shared/logger';

let jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

function getJWKS(authkitDomain: string) {
  if (!jwks) {
    jwks = createRemoteJWKSet(new URL(`https://${authkitDomain}/oauth2/jwks`));
  }
  return jwks;
}

export interface JwtVerifyResult {
  workosUserId: string;
}

function classifyJoseError(err: unknown): string {
  if (err instanceof joseErrors.JWTExpired) return 'token_expired';
  if (err instanceof joseErrors.JWTClaimValidationFailed) return `claim_invalid:${err.claim}`;
  if (err instanceof joseErrors.JWSSignatureVerificationFailed) return 'signature_invalid';
  if (err instanceof joseErrors.JWSInvalid || err instanceof joseErrors.JWTInvalid) return 'malformed_jwt';
  if (err instanceof joseErrors.JWKSNoMatchingKey) return 'no_matching_jwk';
  if (err instanceof Error) return `jose_${err.name}`;
  return 'unknown';
}

export async function verifyJwt(
  token: string,
  authkitDomain: string
): Promise<JwtVerifyResult | null> {
  try {
    const { payload } = await jwtVerify(token, getJWKS(authkitDomain), {
      issuer: `https://${authkitDomain}`,
    });
    if (!payload.sub) {
      logger.warn({ event: 'auth_attempt', method: 'oauth', success: false, reason: 'missing_sub' });
      return null;
    }
    return { workosUserId: payload.sub };
  } catch (err) {
    logger.warn({
      event: 'auth_attempt',
      method: 'oauth',
      success: false,
      reason: classifyJoseError(err),
    });
    return null;
  }
}
