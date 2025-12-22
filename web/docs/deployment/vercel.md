# Deploying MAS-UI to Vercel

Vercel provides an excellent platform for deploying MAS-UI with zero configuration, automatic HTTPS, and global CDN.

## Prerequisites

- A [Vercel account](https://vercel.com/signup) (free tier available)
- Git repository with your MAS-UI code
- MAS API endpoint accessible from the internet

## Deployment Methods

### Method 1: Vercel CLI

1. **Install Vercel CLI:**
```bash
npm install -g vercel
```

2. **Deploy from your project directory:**
```bash
cd mas
vercel
```

3. **Follow the prompts:**
   - Link to existing project or create new one
   - Configure project settings
   - Set environment variables

### Method 2: Git Integration

1. **Push your code to GitHub/GitLab/Bitbucket**

2. **Import project in Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Import your Git repository
   - Configure build settings

3. **Configure build settings:**
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`

### Method 3: Manual Upload

1. **Build locally:**
```bash
npm run build
```

2. **Upload to Vercel:**
   - Go to [vercel.com/new](https://vercel.com/new)
   - Drag and drop your `dist` folder
   - Configure domain and settings

## Environment Variables

Set these in your Vercel project settings:

1. Go to Project Settings → Environment Variables
2. Add your variables:

```
VITE_API_BASE_URL = https://your-mas-api.com
```

## Configuration File

Create a `vercel.json` in your project root:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "headers": [
    {
      "source": "/assets/(.*)",
      "headers": [
        {
          "key": "Cache-Control",
          "value": "public, max-age=31536000, immutable"
        }
      ]
    }
  ]
}
```

## Custom Domain

1. **Add domain in Vercel:**
   - Go to Project Settings → Domains
   - Add your custom domain
   - Follow DNS configuration instructions

2. **Configure DNS:**
   - Add CNAME record pointing to `cname.vercel-dns.com`
   - Or add A record pointing to Vercel's IP addresses

## Continuous Deployment

With Git integration, Vercel automatically deploys:

- **Production:** Pushes to main/master branch
- **Preview:** Pull requests get unique preview URLs
- **Rollback:** Easy rollback to previous deployments

## Performance Features

Vercel automatically provides:

- **Global CDN:** Content served from edge locations
- **Automatic HTTPS:** SSL certificates provisioned automatically
- **HTTP/2:** Modern protocol support
- **Compression:** Automatic gzip/brotli
- **Image Optimization:** Automatic image optimization

## Advanced Configuration

### API Proxy (Development)

For local development with Vercel CLI:

```json
{
  "functions": {
    "api/proxy.js": {
      "includeFiles": "**"
    }
  },
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "https://your-mas-api.com/:path*"
    }
  ]
}
```

### Security Headers

Add security headers in `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

## Monitoring and Analytics

1. **Vercel Analytics:** Built-in analytics dashboard
2. **Web Vitals:** Performance metrics tracking
3. **Error Tracking:** Integration with error tracking services

## Troubleshooting

### Build Failures

- Check build logs in Vercel dashboard
- Ensure all dependencies are in `package.json`
- Verify Node.js version compatibility

### Environment Variables Not Working

- Rebuild after adding environment variables
- Ensure variables start with `VITE_` for Vite apps
- Check variable names are correct

### 404 Errors

- Verify `rewrites` configuration in `vercel.json`
- Ensure SPA routing is configured

## Costs

- **Hobby (Free):** Perfect for personal projects
  - 100 GB bandwidth/month
  - Unlimited deployments
  - Automatic HTTPS

- **Pro ($20/month):** For professional use
  - 1 TB bandwidth/month
  - Team collaboration
  - Advanced analytics

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vite on Vercel](https://vercel.com/guides/deploying-vite)
- [Environment Variables](https://vercel.com/docs/environment-variables)
- [Custom Domains](https://vercel.com/docs/custom-domains)