# SECRET ROOM

The 17 selected works (Precure, 100-yen shop products, and four gun concepts) are classified on the server. Public APIs, the portfolio list, individual pages and local media are protected. Data remains in the existing SITE_DATA binding, so deployment does not replace current site content.

## Production setup

1. In Cloudflare Pages, select **masato-lab → Settings → Variables and Secrets**.
2. Add an encrypted production secret named **SECRET_ROOM_PASSWORD**. Set a unique password of at least 12 characters. Do not put the password in source files or GitHub.
3. Keep the existing **SITE_DATA** KV and **MEDIA** R2 bindings.
4. Deploy the source with `npx wrangler pages deploy . --project-name masato-lab --branch main`, or upload the compiled deployment ZIP via the existing Pages dashboard.
5. Check `/portfolio`: 28 public works and a small SECRET ROOM link. Open `/secret-room` and enter the password: 17 works. Check the four gun works, the Precure work and a 100-yen product individually. Log out and verify the original work/image links require authentication.

The secret room fails closed until the production secret is set. Viewer sessions last 8 hours. Changing the secret invalidates existing viewer sessions. This password grants viewing only, never editor or write access. Existing viewer cookies also lose all write privileges as soon as the H03 fix is deployed; no password rotation is required to revoke that old privilege.

## Administrator authentication (H03)

The editor uses the existing **Cloudflare Access administrator application**, independently of `SECRET_ROOM_PASSWORD`. An Access-authenticated administrator can inspect private works and load the full collection without entering the viewer password. A viewer cannot load the editor's full data endpoint, save site data, or upload assets.

Every editor route and each legacy write handler validates an RS256 Access JWT against the team's public JWKS, checking the exact issuer, application audience and expiry. Merely supplying an email header or the viewer cookie is insufficient. The assertion header is preferred; a fully verified `CF_Authorization` cookie supports legacy same-origin API clients. Missing/invalid credentials, unavailable public keys, and cross-origin or Origin-less writes are rejected before KV/R2 writes.

The defaults in `functions/_admin-access.js` pin the existing production Access team and **editor application's** audience observed on 2026-10-23. These are public identifiers, not passwords. No new secret is needed for the current application. If you replace the Access application, explicitly set `ADMIN_ACCESS_ISSUER` (`https://<team>.cloudflareaccess.com`) and `ADMIN_ACCESS_AUD` (the application's 64-character AUD) together. Never use the viewer application's audience or values from an incoming token. Review the Access policy so only administrators can enter this application.

Editor requests now use `/editor/data`, `/editor/save`, `/editor/assets` (portfolio/memory/tool assets), and `/editor/upload` (profile photos), so they pass through the existing `/editor*` Access protection. Both editor HTML entrypoints use the same endpoints. The legacy `/api/save`, `/api/upload` and `/secret-room/editor-data` also require a verified administrator token; they cannot be unlocked with a viewer password.

Before production rollout, retain Access protection on `/editor*` and extend the same administrator policy to `/api/save`, `/api/upload`, and `/secret-room/editor-data` for edge defense in depth. Code-side JWT verification protects those legacy aliases even before this policy expansion. Check any preview or alternative hostname separately; do not copy production KV/R2 write bindings into an unreviewed preview. This change does not alter Cloudflare settings itself.

The editor loads all public and private works so saving cannot drop protected works. Existing KV/R2 bindings, content schemas, asset URLs and gallery links are unchanged. Authentication expiry produces an error without navigating away from unsaved edits; save a JSON backup before signing in again.

### Release verification

1. Run `node --test tests/*.test.mjs` and compile Pages Functions. Tests use generated RSA keys, mock JWKS and in-memory KV/R2; they do not authenticate to production, mutate real data or send uploads.
2. Inspect the diff on a separate branch. Do not merge or deploy until publication is authorized.
3. In an authorized isolated preview, check anonymous/viewer denial on every write alias, including a previously issued viewer cookie. Confirm only Access administrators can save and upload photos.
4. Confirm public/private galleries, direct protected image links, all collections in the editor, existing profile photos and both editor entrypoints. Preserve the existing data before rollout. Real Access login and production binding checks require this preview/rollout step; offline tests alone cannot verify those settings.

Failed-password attempts have a coarse KV-based five-attempt/five-minute backstop. KV is eventually consistent; use a Cloudflare edge rate-limiting rule on `/secret-room/login` if a strict distributed rate limit is required.

Tests: `node --test tests/*.test.mjs` (uses synthetic asset URLs, not copied production content).
