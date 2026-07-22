# Deployment Guide for Pixelence MRI System

This app is deployed on **Vercel** as part of the Turborepo monorepo.

## Deployment Steps

1. Push code to GitHub (`main` branch triggers production deploy).
2. In the Vercel project settings, set the **Root Directory** to `pixelence-mri-system` (or configure via the monorepo's `turbo.json` if deploying the whole repo).
3. Build command: `next build` (already set in `package.json`).
4. Set environment variables in Vercel:
   ```
   NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud
   ```
5. Deploy.

## Post-Deployment Checklist

- [ ] Update Convex CORS settings to allow your Vercel domain
- [ ] Set up a custom domain (if needed)
- [ ] Test authentication flows and sample user login
- [ ] Verify Convex database connections

## Troubleshooting

**Environment Variables Not Working:**
- Prefix with `NEXT_PUBLIC_` for client-side access
- Redeploy after adding/changing variables in Vercel

**CORS Errors:**
- Add your Vercel domain to Convex allowed origins (Convex dashboard → Settings → CORS)

## Resources

- Vercel Docs: https://vercel.com/docs
- Next.js Deployment: https://nextjs.org/docs/deployment
- Convex Deployment: https://docs.convex.dev/production
