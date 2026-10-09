# SUPABASE WIRING TESTCASE

- [ ] S1: `.env.local` exists (gitignored) with URL + publishable key; app boots without missing-env error.
- [ ] S2: Browser client connects (e.g. test query to kit_types, expect empty or rows, no auth error).
- [ ] S3: Server client in a Route Handler reads session cookies without crash.
- [ ] S4: proxy.ts refreshes session: sign in, reload, still signed in (getClaims path).
- [ ] S5: Static assets excluded from proxy matcher (page CSS/JS/images load).
- [ ] S6: `npm run lint` passes.
