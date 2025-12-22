# MAS-UI Deployment Guide

This guide provides instructions for deploying MAS-UI to various platforms and environments.

## Prerequisites

Before deploying MAS-UI, ensure you have:

1. Built the production version of the application
2. Configured your MAS API endpoint
3. Tested the application locally

## Build for Production

```bash
# Install dependencies
npm install

# Build the application
npm run build
```

This creates an optimized production build in the `dist/` directory.

## Deployment Options

### Static Hosting Services

MAS-UI is a static single-page application (SPA) that can be deployed to any static hosting service:

- [Vercel](vercel.md) - Recommended for ease of use
- [Cloudflare Workers](cloudflare.md) - Edge deployment with global CDN
- [Netlify](https://www.netlify.com/) - Simple static hosting
- [GitHub Pages](https://pages.github.com/) - Free hosting for public repos
- [AWS S3 + CloudFront](https://aws.amazon.com/s3/) - Scalable enterprise solution

### Traditional Web Servers

For self-hosted deployments:

- [Nginx](examples/nginx.conf) - High-performance web server
- [Apache](examples/apache.conf) - Widely supported web server
- Docker - Containerized deployment (coming soon)

## Environment Configuration

All deployment environments need to configure the API endpoint:

```env
VITE_API_BASE_URL=https://your-mas-api-server.com
```

This can be set as:
- Environment variable during build time
- Configuration in hosting platform
- Build argument in CI/CD pipeline

## SPA Routing Configuration

MAS-UI uses client-side routing. Your deployment must be configured to:

1. Serve `index.html` for all routes
2. Properly handle 404s by returning `index.html`
3. Serve static assets with appropriate caching headers

## Security Considerations

When deploying to production:

1. **Use HTTPS**: Always deploy with SSL/TLS certificates
2. **Configure CORS**: Ensure your MAS API allows requests from your deployment domain
3. **Set Security Headers**: Configure CSP, X-Frame-Options, etc.
4. **API Authentication**: Implement proper authentication between frontend and API

## Performance Optimization

1. **Enable Caching**: Set appropriate cache headers for static assets
2. **Use CDN**: Deploy behind a CDN for global distribution
3. **Enable Compression**: Use gzip/brotli compression
4. **Optimize Images**: Ensure all images are optimized

## Monitoring and Maintenance

After deployment:

1. Monitor application performance
2. Set up error tracking (e.g., Sentry)
3. Configure logging
4. Set up automated backups if self-hosting
5. Plan for updates and maintenance windows

## Troubleshooting

### Common Issues

**404 errors on refresh:**
- Ensure your server is configured for SPA routing
- All routes should serve `index.html`

**API connection failures:**
- Verify VITE_API_BASE_URL is correctly set
- Check CORS configuration on your API server
- Ensure API server is accessible from deployment

**Blank page after deployment:**
- Check browser console for errors
- Verify all assets are loading correctly
- Ensure base path is correctly configured

## Example Deployments

Check the `examples/` directory for configuration files:

- [nginx.conf](examples/nginx.conf) - Nginx configuration
- [apache.conf](examples/apache.conf) - Apache configuration
- [vercel.json](examples/vercel.json) - Vercel configuration
- [wrangler.json](examples/wrangler.json) - Cloudflare Workers configuration

## Need Help?

- Check platform-specific guides in this directory
- Review example configurations
- Open an issue on GitHub for deployment problems
- Join our community discussions for help