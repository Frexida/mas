# Deploying MAS-UI to Cloudflare Workers

Deploy MAS-UI to Cloudflare's edge network for ultra-low latency and global distribution.

## Prerequisites

- [Cloudflare account](https://dash.cloudflare.com/sign-up) (free tier available)
- [Wrangler CLI](https://developers.cloudflare.com/workers/cli-wrangler/install-update)
- Node.js 18.0 or higher

## Installation

1. **Install Wrangler CLI:**
```bash
npm install -g wrangler
```

2. **Authenticate with Cloudflare:**
```bash
wrangler login
```

## Configuration

Create a `wrangler.toml` file in your project root:

```toml
name = "mas"
compatibility_date = "2025-12-17"

[site]
bucket = "./dist"

[vars]
VITE_API_BASE_URL = "https://your-mas-api.com"

[[routes]]
pattern = "your-domain.com/*"
custom_domain = true
```

## Deployment Steps

### 1. Build the Application

```bash
npm run build
```

### 2. Deploy to Cloudflare

```bash
wrangler pages deploy dist
```

Or for Workers Sites:

```bash
wrangler publish
```

### 3. Configure Custom Domain (Optional)

In Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your project
3. Go to Custom Domains tab
4. Add your domain

## Environment Variables

Set environment variables in `wrangler.toml`:

```toml
[vars]
VITE_API_BASE_URL = "https://your-mas-api.com"
```

Or use Cloudflare Dashboard:
1. Go to Workers & Pages
2. Select your project
3. Settings → Environment Variables
4. Add your variables

## Advanced Configuration

### Pages Functions (API Routes)

Create `functions/api/[[path]].js` for API proxying:

```javascript
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // Proxy to your API
  const apiUrl = `${env.VITE_API_BASE_URL}${url.pathname.replace('/api', '')}`;

  return fetch(apiUrl, {
    method: request.method,
    headers: request.headers,
    body: request.body
  });
}
```

### Caching Strategy

Configure caching in `_headers` file:

```
/assets/*
  Cache-Control: public, max-age=31536000, immutable

/*
  X-Content-Type-Options: nosniff
  X-Frame-Options: SAMEORIGIN
  X-XSS-Protection: 1; mode=block
```

### SPA Routing

Create `_redirects` file for SPA routing:

```
/*    /index.html    200
```

## Cloudflare Pages vs Workers

### Cloudflare Pages (Recommended)
- Easier deployment for static sites
- Automatic builds from Git
- Preview deployments for branches
- Built-in analytics

### Cloudflare Workers
- More control over edge logic
- Can add serverless functions
- Custom routing logic
- KV storage access

## Performance Optimization

Cloudflare automatically provides:

1. **Global CDN:** 200+ data centers worldwide
2. **Automatic HTTPS:** Free SSL certificates
3. **HTTP/3 Support:** Latest protocol
4. **Brotli Compression:** Better than gzip
5. **Minification:** HTML, CSS, JS minification
6. **Image Optimization:** Automatic WebP conversion

## Monitoring

### Analytics

Access analytics in Cloudflare Dashboard:
- Request count
- Bandwidth usage
- Response times
- Error rates

### Logging

Enable logging with Wrangler:

```bash
wrangler tail
```

## Security Features

Cloudflare provides:

1. **DDoS Protection:** Automatic protection
2. **WAF Rules:** Web Application Firewall
3. **Rate Limiting:** Prevent abuse
4. **Bot Management:** Block malicious bots
5. **Page Rules:** Custom security rules

## Troubleshooting

### Build Issues

```bash
# Clear cache and rebuild
rm -rf dist
npm run build
```

### Deployment Failures

```bash
# Check Wrangler version
wrangler --version

# Update Wrangler
npm install -g wrangler@latest
```

### 404 Errors

Ensure `_redirects` file exists:
```
/*    /index.html    200
```

### CORS Issues

Add CORS headers in `_headers`:
```
/*
  Access-Control-Allow-Origin: *
  Access-Control-Allow-Methods: GET, POST, OPTIONS
```

## Costs

### Free Tier
- 100,000 requests/day
- Unlimited bandwidth
- Unlimited sites

### Workers Paid ($5/month)
- 10 million requests/month
- KV storage included
- Durable Objects access

### Pages Pro ($20/month)
- Advanced analytics
- Build concurrency
- Larger build limits

## CI/CD Integration

### GitHub Actions

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install and Build
        run: |
          npm install
          npm run build

      - name: Deploy to Cloudflare Pages
        uses: cloudflare/pages-action@v1
        with:
          apiToken: ${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: ${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          projectName: mas
          directory: dist
```

## Resources

- [Cloudflare Pages Docs](https://developers.cloudflare.com/pages/)
- [Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)
- [Pages Functions](https://developers.cloudflare.com/pages/platform/functions/)