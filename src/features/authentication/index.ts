export {
  AuthenticationModule,
  maskContact,
  isValidCode,
  CODE_PATTERN_SOURCE,
} from './authentication-module.js';
export type {
  AuthenticationAdapter,
  AuthenticationChannel,
  AuthenticationModuleOptions,
  AuthenticationStatus,
  CodeChallenge,
  RequestCode,
  ConfirmCode,
  VerificationResult,
} from './authentication-module.js';
export {
  HttpAuthenticationAdapter,
  REQUEST_CODE_ENDPOINT,
  CONFIRM_CODE_ENDPOINT,
} from './authentication-adapter.js';
