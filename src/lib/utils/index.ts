export {
  sanitizeForLogging,
  sanitizeJsonForLogging,
  maskValue,
} from './sensitive-data.js';
export { getAuthrimCode, mapSeverity, ERROR_CODE_MAP } from './error-mapping.js';
export {
  convertToPublicKeyCredentialRequestOptions,
  convertToPublicKeyCredentialCreationOptions,
  assertionResponseToJSON,
  attestationResponseToJSON,
} from './webauthn-converters.js';
export {
  success,
  failure,
  failureFromParams,
  toAuthError,
  authResultToResponse,
  wrapWithAuthResponse,
} from './response.js';
export { AUTH_CONTEXT_KEY, setAuthContext, getAuthContext, hasAuthContext } from './context.js';
export {
  isBrowser,
  isServer,
  onBrowser,
  onServer,
  getWindow,
  getDocument,
  getLocalStorage,
  getSessionStorage,
} from './ssr.js';
