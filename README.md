# @authrim/sveltekit

[![npm version](https://img.shields.io/npm/v/@authrim/sveltekit.svg)](https://www.npmjs.com/package/@authrim/sveltekit)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

Official SvelteKit SDK for [Authrim](https://authrim.com) authentication.

## Features

- **Passkey Authentication** - WebAuthn-based passwordless login
- **Email Code (OTP)** - One-time password via email
- **Social Login** - Google, GitHub, Apple, Microsoft, Facebook
- **Svelte Stores** - Reactive authentication state
- **Server-Side Integration** - SvelteKit hooks and load functions
- **SSR Support** - Full server-side rendering compatibility
- **TypeScript** - Complete type definitions
- **UI Components** - Ready-to-use authentication components

## Requirements

- Node.js >= 18
- SvelteKit >= 2.0
- Svelte >= 4.0 or >= 5.0
- @authrim/core >= 0.1.10

## Installation

```bash
# pnpm (recommended)
pnpm add @authrim/sveltekit @authrim/core

# npm
npm install @authrim/sveltekit @authrim/core

# yarn
yarn add @authrim/sveltekit @authrim/core
```

> **Note**: `@authrim/core` is a peer dependency that provides the underlying authentication logic. You need to install it alongside `@authrim/sveltekit`, but you don't need to import from it directly—all necessary types and functions are re-exported from `@authrim/sveltekit`.

## Quick Start

### 1. Create Auth Client

```typescript
// src/lib/auth.ts
import { createAuthrim } from '@authrim/sveltekit';

export const auth = await createAuthrim({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
});
```

### 2. Set Up Server Hooks

```typescript
// src/hooks.server.ts
import { createAuthHandle } from '@authrim/sveltekit/server';

export const handle = createAuthHandle();
```

### 3. Configure Type Safety

```typescript
// src/app.d.ts
import type { ServerAuthContext } from '@authrim/sveltekit/server';

declare global {
  namespace App {
    interface Locals {
      auth?: ServerAuthContext;
    }
  }
}

export {};
```

### 4. Set Up AuthProvider

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { AuthProvider } from '@authrim/sveltekit/components';
  import { auth } from '$lib/auth';

  export let data;
</script>

<AuthProvider
  {auth}
  initialSession={data.auth?.session}
  initialUser={data.auth?.user}
>
  <slot />
</AuthProvider>
```

```typescript
// src/routes/+layout.server.ts
import { createAuthLoad } from '@authrim/sveltekit/server';

export const load = createAuthLoad();
```

### 5. Use Authentication

```svelte
<!-- src/routes/+page.svelte -->
<script lang="ts">
  import { getAuthContext } from '@authrim/sveltekit';

  const auth = getAuthContext();
  const { session, user, isAuthenticated, loadingState } = auth.stores;

  async function handleLogin() {
    const result = await auth.passkey.login();
    if (result.error) {
      console.error(result.error.message);
    }
  }
</script>

{#if $loadingState !== 'idle'}
  <p>Loading...</p>
{:else if $isAuthenticated}
  <p>Welcome, {$user?.name}</p>
  <button on:click={() => auth.signOut()}>Sign Out</button>
{:else}
  <button on:click={handleLogin}>Sign In with Passkey</button>
{/if}
```

## API Reference

### `createAuthrim(config)`

Creates an Authrim client instance.

```typescript
const auth = await createAuthrim({
  issuer: 'https://auth.example.com',
  clientId: 'your-client-id',
  storage: {
    storage: 'sessionStorage', // 'memory' | 'sessionStorage' | 'localStorage'
    prefix: 'authrim',
  },
});
```

### Authentication Namespaces

#### `auth.passkey`

```typescript
// Login with Passkey
const result = await auth.passkey.login();

// Login with Conditional UI (autofill)
const result = await auth.passkey.login({ conditional: true });

// Sign up with Passkey
const result = await auth.passkey.signUp({ email: 'user@example.com' });

// Register new Passkey (requires authentication)
const credential = await auth.passkey.register();

// Check support
auth.passkey.isSupported(); // boolean
await auth.passkey.isConditionalUIAvailable(); // Promise<boolean>

// Cancel Conditional UI
auth.passkey.cancelConditionalUI();
```

#### `auth.emailCode`

```typescript
// Send verification code
const result = await auth.emailCode.send('user@example.com');

// Verify code
const result = await auth.emailCode.verify('user@example.com', '123456');

// Check pending verification
auth.emailCode.hasPendingVerification('user@example.com'); // boolean
auth.emailCode.getRemainingTime('user@example.com'); // seconds
auth.emailCode.clearPendingVerification('user@example.com');
```

#### `auth.social`

```typescript
// Login with popup
const result = await auth.social.loginWithPopup('google');

// Login with redirect
await auth.social.loginWithRedirect('github');

// Handle callback (after redirect)
if (auth.social.hasCallbackParams()) {
  const result = await auth.social.handleCallback();
}

// Get supported providers
auth.social.getSupportedProviders(); // ['google', 'github', 'apple', 'microsoft', 'facebook']
```

#### `auth.session`

```typescript
// Get current session
const result = await auth.session.get();

// Validate session
const isValid = await auth.session.validate();

// Get user
const user = await auth.session.getUser();

// Refresh session cache
const session = await auth.session.refresh();

// Check authentication
const isAuth = await auth.session.isAuthenticated();

// Clear cache
auth.session.clearCache();
```

### Shortcuts

```typescript
// Sign in
await auth.signIn.passkey();
await auth.signIn.social('google');

// Sign up
await auth.signUp.passkey({ email: 'user@example.com' });

// Sign out
await auth.signOut();
await auth.signOut({ redirectUri: '/login' });
```

### Svelte Stores

All stores are **Readable** (not Writable) to ensure events are the source of truth.

```typescript
const { session, user, isAuthenticated, loadingState, error } = auth.stores;
```

| Store | Type | Description |
|-------|------|-------------|
| `session` | `Readable<Session \| null>` | Current session |
| `user` | `Readable<User \| null>` | Current user |
| `isAuthenticated` | `Readable<boolean>` | Authentication status (derived from session) |
| `loadingState` | `Readable<AuthLoadingState>` | Current loading state |
| `error` | `Readable<AuthError \| null>` | Last error |

#### `AuthLoadingState`

| State | Description |
|-------|-------------|
| `'idle'` | Completely stable (also after errors) |
| `'initializing'` | Initial session check |
| `'authenticating'` | Login/signup in progress |
| `'refreshing'` | Session refresh in progress |
| `'signing_out'` | Sign out in progress |

> **Important**: After any operation completes (success or error), `loadingState` returns to `'idle'`. Use `error !== null` to detect error conditions.

### Events

```typescript
// Subscribe to events
const unsubscribe = auth.on('auth:login', ({ session, user, method }) => {
  console.log('Logged in:', user.email, 'via', method);
});

auth.on('auth:logout', ({ redirectUri }) => {
  console.log('Logged out');
});

auth.on('auth:error', ({ error }) => {
  console.error('Auth error:', error.message);
});

auth.on('session:changed', ({ session, user }) => {
  console.log('Session changed');
});

auth.on('session:expired', ({ reason }) => {
  console.log('Session expired:', reason);
});

// Unsubscribe
unsubscribe();
```

### Cleanup

```typescript
// When not using AuthProvider, manually cleanup resources
auth.destroy();
```

## Components

### `AuthProvider`

Provides auth context to child components.

```svelte
<script lang="ts">
  import { AuthProvider } from '@authrim/sveltekit/components';
  import { auth } from '$lib/auth';

  export let data;
</script>

<AuthProvider
  {auth}
  initialSession={data.auth?.session}
  initialUser={data.auth?.user}
>
  <slot />
</AuthProvider>
```

**Props:**
- `auth` (required): Authrim client instance
- `initialSession`: Session from SSR
- `initialUser`: User from SSR

### `SignInButton`

```svelte
<script lang="ts">
  import { SignInButton } from '@authrim/sveltekit/components';
</script>

<!-- Passkey login -->
<SignInButton
  method="passkey"
  on:success={({ detail }) => console.log(detail.user)}
  on:error={({ detail }) => console.error(detail.message)}
>
  Sign In with Passkey
</SignInButton>

<!-- Social login -->
<SignInButton method="social" provider="google">
  Sign In with Google
</SignInButton>
```

### `SignOutButton`

```svelte
<script lang="ts">
  import { SignOutButton } from '@authrim/sveltekit/components';
</script>

<SignOutButton
  redirectUri="/login"
  on:success={() => console.log('Signed out')}
  on:error={({ detail }) => console.error(detail)}
>
  Sign Out
</SignOutButton>
```

### `UserProfile`

```svelte
<script lang="ts">
  import { UserProfile } from '@authrim/sveltekit/components';
</script>

<UserProfile showAvatar showEmail>
  <svelte:fragment slot="avatar" let:user>
    <img src={user.picture} alt={user.name} />
  </svelte:fragment>
</UserProfile>
```

### `ProtectedRoute`

```svelte
<script lang="ts">
  import { ProtectedRoute } from '@authrim/sveltekit/components';
</script>

<ProtectedRoute redirectTo="/login" includeReturnPath>
  <Dashboard />

  <svelte:fragment slot="loading">
    <Spinner />
  </svelte:fragment>

  <svelte:fragment slot="unauthenticated">
    <p>Please sign in to continue.</p>
  </svelte:fragment>
</ProtectedRoute>
```

## Server-Side Integration

### Handle Hook

```typescript
// src/hooks.server.ts
import { createAuthHandle } from '@authrim/sveltekit/server';

export const handle = createAuthHandle({
  cookieName: 'authrim_session',
  secure: true,
  sameSite: 'lax',
});
```

### Protected Routes (Server)

```typescript
// src/routes/dashboard/+page.server.ts
import { requireAuth } from '@authrim/sveltekit/server';

export const load = requireAuth({
  loginUrl: '/login',
  redirectParam: 'redirectTo',
});
```

### Layout Data

```typescript
// src/routes/+layout.server.ts
import { createAuthLoad } from '@authrim/sveltekit/server';

export const load = createAuthLoad();
```

### Helper Functions

```typescript
import {
  isAuthenticated,
  getUser,
  getSession,
  getAuthFromEvent
} from '@authrim/sveltekit/server';

// In +page.server.ts or hooks
export const load = async ({ locals }) => {
  if (isAuthenticated(locals)) {
    const user = getUser(locals);
    const session = getSession(locals);
    // ...
  }
};

// In handle hook
const authContext = getAuthFromEvent(event);
```

## Package Exports

```typescript
// Main client
import { createAuthrim, getAuthContext, setAuthContext } from '@authrim/sveltekit';

// Server utilities
import {
  createAuthHandle,
  requireAuth,
  createAuthLoad,
  isAuthenticated,
  getUser,
  getSession
} from '@authrim/sveltekit/server';

// Components
import {
  AuthProvider,
  SignInButton,
  SignOutButton,
  UserProfile,
  ProtectedRoute
} from '@authrim/sveltekit/components';

// Stores (for advanced use)
import { createAuthStores } from '@authrim/sveltekit/stores';
```

## Design Principles

1. **Stores are observation-only**: All stores are `Readable`, not `Writable`. This ensures that the event system is the single source of truth.

2. **Events are source of truth**: Store updates are projections of events. This makes the data flow predictable and debuggable.

3. **Components are thin wrappers**: UI components delegate behavior to props/events. They don't implement business logic.

4. **SSR-first**: Full server-side rendering support with proper hydration handling.

5. **Type safety**: Complete TypeScript support with strict typing.

## Security Considerations

- **PKCE**: All OAuth flows use PKCE (Proof Key for Code Exchange)
- **Secure Storage**: Session tokens are stored securely with configurable storage options
- **CSRF Protection**: State parameter validation for OAuth flows
- **HttpOnly Cookies**: Server-side session cookies are HttpOnly by default

## Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) for details.

## License

[Apache-2.0](LICENSE)

## Links

- [Documentation](https://docs.authrim.com)
- [GitHub](https://github.com/authrim/js-sveltekit)
- [npm](https://www.npmjs.com/package/@authrim/sveltekit)
- [Authrim](https://authrim.com)
