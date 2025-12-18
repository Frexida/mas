export default {
  async fetch(request, env) {
    // Simply serve static assets - Cloudflare will handle this automatically
    return env.ASSETS.fetch(request);
  },
};