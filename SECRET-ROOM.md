# SECRET ROOM

The 17 selected works (Precure, 100-yen shop products, and four gun concepts) are classified on the server. Public APIs, the portfolio list, individual pages and local media are protected. Data remains in the existing SITE_DATA binding, so deployment does not replace current site content.

## Production setup

1. In Cloudflare Pages, select **masato-lab → Settings → Variables and Secrets**.
2. Add an encrypted production secret named **SECRET_ROOM_PASSWORD**. Set a unique password of at least 12 characters. Do not put the password in source files or GitHub.
3. Keep the existing **SITE_DATA** KV and **MEDIA** R2 bindings.
4. Deploy the source with `npx wrangler pages deploy . --project-name masato-lab --branch main`, or upload the compiled deployment ZIP via the existing Pages dashboard.
5. Check `/portfolio`: 28 public works and a small SECRET ROOM link. Open `/secret-room` and enter the password: 17 works. Check the four gun works, the Precure work and a 100-yen product individually. Log out and verify the original work/image links require authentication.

The secret room fails closed until the production secret is set. Sessions last 8 hours. Changing the secret invalidates existing sessions. The editor also requires secret-room login, and loads the full collection so an editor save cannot accidentally remove protected works. Existing Cloudflare Access protection remains in place.

Failed-password attempts have a coarse KV-based five-attempt/five-minute backstop. KV is eventually consistent; use a Cloudflare edge rate-limiting rule on `/secret-room/login` if a strict distributed rate limit is required.

Tests: `node tests/secret-room.test.mjs` (uses synthetic asset URLs, not copied production content).
