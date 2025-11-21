export default {
  '/api': {
    target: 'http://192.168.1.224',
    secure: true,
    changeOrigin: true,
    logLevel: 'debug',
    pathRewrite: {
      '^/api': '/api'
    },
    onProxyReq: function(proxyReq, req, res) {
      // Add Ngrok bypass header to all proxied requests
      proxyReq.setHeader('ngrok-skip-browser-warning', 'true');
      proxyReq.setHeader('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
      
      console.log('Proxying request:', req.method, req.url);
      console.log('Headers:', proxyReq.getHeaders());
    },
    onProxyRes: function(proxyRes, req, res) {
      // Log response to debug
      console.log('Proxy response:', proxyRes.statusCode, 'Content-Type:', proxyRes.headers['content-type']);
      
      // Rewrite cookies to work with localhost
      const cookies = proxyRes.headers['set-cookie'];
      if (cookies) {
        proxyRes.headers['set-cookie'] = cookies.map(cookie => {
          // Remove Domain and set Path to root
          return cookie
            .replace(/Domain=[^;]+;?\s*/gi, '')
            .replace(/Path=[^;]+;?\s*/gi, 'Path=/; ')
            .replace(/;\s*;/g, ';') // Clean up double semicolons
            .replace(/Secure;?\s*/gi, ''); // Remove Secure flag for local development
        });
      }
    },
    onError: function(err, req, res) {
      console.error('Proxy error:', err);
    }
  }
};
