R2 auto-upload patch for MASATO Lab

What this patch does
- Adds an R2 upload endpoint at /api/upload
- Serves uploaded files back through /media/<key>
- Adds R2 upload buttons to Portfolio and Tools in editor/index.html
- After upload, Image URL is filled automatically
- If you are editing an existing item, it also saves to KV automatically

Dashboard setup
1. Create an R2 bucket, for example: masato-lab-media
2. In Pages > masato-lab > Settings > Bindings > Add > R2 bucket
   - Variable name: MEDIA
   - R2 bucket: your bucket
3. In Pages > masato-lab > Settings > Variables and Secrets
   - Add variable: R2_PUBLIC_BASE_URL
   - Value: https://masato-lab.pages.dev/media

Important
- ASSETS is a reserved binding name in Pages. Use MEDIA.
- After adding the R2 binding and variable, redeploy once.

Files replaced / added
- editor/index.html
- functions/api/upload.js
- functions/media/[[path]].js
