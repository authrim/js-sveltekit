# @authrim/sveltekit

SvelteKit SDK for Authrim authentication.

## Installation

```bash
pnpm add @authrim/sveltekit @authrim/core
```

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

### 2. Set Up AuthProvider

```svelte
<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import { AuthProvider } from '@authrim/sveltekit/components';
  import { auth } from '$lib/auth';
</script>

<AuthProvider {auth}>
  <slot />
</AuthProvider>
```

### 3. Use Authentication

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

### Namespaces

#### `auth.passkey`

```typescript
// Login with Passkey
const result = await auth.passkey.login();

// Sign up with Passkey
const result = await auth.passkey.signUp({ email: 'user@example.com' });

// Register new Passkey (requires authentication)
const credential = await auth.passkey.register();

// Check support
auth.passkey.isSupported(); // boolean
await auth.passkey.isConditionalUIAvailable(); // Promise<boolean>
```

#### `auth.emailCode`

```typescript
// Send verification code
await auth.emailCode.send('user@example.com');

// Verify code
const result = await auth.emailCode.verify('user@example.com', '123456');

// Check pending verification
auth.emailCode.hasPendingVerification('user@example.com'); // boolean
auth.emailCode.getRemainingTime('user@example.com'); // seconds
```

#### `auth.social`

```typescript
// Login with popup
const result = await auth.social.loginWithPopup('google');

// Login with redirect
await auth.social.loginWithRedirect('github');

// Handle callback (after redirect)
const result = await auth.social.handleCallback();

// Check callback params
auth.social.hasCallbackParams(); // boolean
auth.social.getSupportedProviders(); // ['google', 'github', 'apple', ...]
```

#### `auth.session`

```typescript
// Get current session
const result = await auth.session.get();

// Validate session
const isValid = await auth.session.validate();

// Get user
const user = await auth.session.getUser();

// Refresh session
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
```

### Stores

All stores are **Readable** (not Writable) to ensure events are the source of truth.

```typescript
const { session, user, isAuthenticated, loadingState, error } = auth.stores;
```

| Store | Type | Description |
|-------|------|-------------|
| `session` | `Readable<Session \| null>` | Current session |
| `user` | `Readable<User \| null>` | Current user |
| `isAuthenticated` | `Readable<boolean>` | Authentication status |
| `loadingState` | `Readable<AuthLoadingState>` | Loading state |
| `error` | `Readable<AuthError \| null>` | Last error |

#### `AuthLoadingState`

| State | Description |
|-------|-------------|
| `'idle'` | Completely stable (also after errors) |
| `'initializing'` | Initial session check |
| `'authenticating'` | Login/signup in progress |
| `'refreshing'` | Session refresh in progress |
| `'signing_out'` | Sign out in progress |

**Important**: After any operation completes (success or error), `loadingState` returns to `'idle'`. Use `error !== null` to detect error conditions.

### Events

```typescript
auth.on('auth:login', ({ session, user, method }) => {
  console.log('Logged in:', user.email);
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
```

## Components

### `AuthProvider`

Provides auth context to child components.

```svelte
<AuthProvider {auth} {initialSession} {initialUser}>
  <slot />
</AuthProvider>
```

**Responsibilities (strictly limited):**
- Wire auth instance into Svelte context
- Sync initial session from SSR

It does NOT implement business logic.

### `SignInButton`

```svelte
<SignInButton
  method="passkey"
  on:success={({ detail }) => console.log(detail.user)}
  on:error={({ detail }) => console.error(detail.message)}
>
  Sign In
</SignInButton>

<SignInButton
  method="social"
  provider="google"
>
  Sign In with Google
</SignInButton>
```

### `SignOutButton`

```svelte
<SignOutButton
  redirectUri="/login"
  on:success={() => console.log('Signed out')}
>
  Sign Out
</SignOutButton>
```

### `UserProfile`

```svelte
<UserProfile showAvatar showEmail>
  <svelte:fragment slot="avatar" let:user>
    <img src={user.picture} alt={user.name} />
  </svelte:fragment>
</UserProfile>
```

### `ProtectedRoute`

```svelte
<ProtectedRoute redirectTo="/login">
  <Dashboard />

  <svelte:fragment slot="loading">
    <Spinner />
  </svelte:fragment>

  <svelte:fragment slot="unauthenticated">
    <p>Please sign in.</p>
  </svelte:fragment>
</ProtectedRoute>
```

## Server-Side Integration

### Hooks

```typescript
// src/hooks.server.ts
import { createAuthHandle } from '@authrim/sveltekit/server';

export const handle = createAuthHandle();
```

### Protected Routes

```typescript
// src/routes/dashboard/+page.server.ts
import { requireAuth } from '@authrim/sveltekit/server';

export const load = requireAuth({
  loginUrl: '/login',
});
```

### Layout Data

```typescript
// src/routes/+layout.server.ts
import { createAuthLoad } from '@authrim/sveltekit/server';

export const load = createAuthLoad();
```

## Direct Auth

Direct Auth is a low-level imperative API. When Flow Engine is introduced, Flow will be recommended for most use cases.

**Use Direct Auth when:**
- You need fine-grained control over the authentication flow
- You're building custom UI components
- Flow Engine is not suitable for your use case

## Design Principles

1. **Stores are observation-only**: All stores are `Readable`, not `Writable`
2. **Events are source of truth**: Store updates are projections of events
3. **Components are dumb wrappers**: UI components delegate behavior to props/events
4. **Server abstraction**: Cookie handling is abstracted via `ServerSessionManager`

## License

Apache-2.0
