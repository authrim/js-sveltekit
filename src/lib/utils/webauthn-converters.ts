/**
 * WebAuthn Type Converters
 */

import {
  base64urlEncode,
  base64urlDecode,
  type PasskeyLoginStartResponse,
  type PasskeySignupStartResponse,
  type AuthenticatorTransportType,
  type RegistrationResponseJSON,
  type AuthenticationResponseJSON,
} from '@authrim/core';

export function convertToPublicKeyCredentialRequestOptions(
  options: PasskeyLoginStartResponse['options']
): PublicKeyCredentialRequestOptions {
  return {
    challenge: base64urlDecode(options.challenge).buffer as ArrayBuffer,
    timeout: options.timeout,
    rpId: options.rpId,
    allowCredentials: options.allowCredentials?.map((cred) => ({
      type: cred.type as 'public-key',
      id: base64urlDecode(cred.id).buffer as ArrayBuffer,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    })),
    userVerification: options.userVerification as UserVerificationRequirement | undefined,
    extensions: options.extensions,
  };
}

export function convertToPublicKeyCredentialCreationOptions(
  options: PasskeySignupStartResponse['options']
): PublicKeyCredentialCreationOptions {
  return {
    rp: options.rp,
    user: {
      id: base64urlDecode(options.user.id).buffer as ArrayBuffer,
      name: options.user.name,
      displayName: options.user.displayName,
    },
    challenge: base64urlDecode(options.challenge).buffer as ArrayBuffer,
    pubKeyCredParams: options.pubKeyCredParams as PublicKeyCredentialParameters[],
    timeout: options.timeout,
    excludeCredentials: options.excludeCredentials?.map((cred) => ({
      type: cred.type as 'public-key',
      id: base64urlDecode(cred.id).buffer as ArrayBuffer,
      transports: cred.transports as AuthenticatorTransport[] | undefined,
    })),
    authenticatorSelection: options.authenticatorSelection as
      | AuthenticatorSelectionCriteria
      | undefined,
    attestation: options.attestation as AttestationConveyancePreference | undefined,
    extensions: options.extensions,
  };
}

export function assertionResponseToJSON(
  credential: PublicKeyCredential
): AuthenticationResponseJSON {
  const response = credential.response as AuthenticatorAssertionResponse;
  const credentialId = base64urlEncode(new Uint8Array(credential.rawId));

  return {
    id: credentialId,
    rawId: credentialId,
    response: {
      clientDataJSON: base64urlEncode(new Uint8Array(response.clientDataJSON)),
      authenticatorData: base64urlEncode(new Uint8Array(response.authenticatorData)),
      signature: base64urlEncode(new Uint8Array(response.signature)),
      userHandle: response.userHandle
        ? base64urlEncode(new Uint8Array(response.userHandle))
        : undefined,
    },
    type: 'public-key',
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
    authenticatorAttachment: credential.authenticatorAttachment as
      | 'platform'
      | 'cross-platform'
      | null
      | undefined,
  };
}

export function attestationResponseToJSON(
  credential: PublicKeyCredential
): RegistrationResponseJSON {
  const response = credential.response as AuthenticatorAttestationResponse;
  const transports = response.getTransports?.() as AuthenticatorTransportType[] | undefined;
  const credentialId = base64urlEncode(new Uint8Array(credential.rawId));

  return {
    id: credentialId,
    rawId: credentialId,
    response: {
      clientDataJSON: base64urlEncode(new Uint8Array(response.clientDataJSON)),
      attestationObject: base64urlEncode(new Uint8Array(response.attestationObject)),
      transports,
    },
    type: 'public-key',
    clientExtensionResults: credential.getClientExtensionResults() as Record<string, unknown>,
    authenticatorAttachment: credential.authenticatorAttachment as
      | 'platform'
      | 'cross-platform'
      | null
      | undefined,
  };
}
