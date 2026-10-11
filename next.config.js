module.exports = {
  compiler: {
    styledComponents: {
      ssr: true,
      displayName: true,
    },
  },
  async rewrites() {
    return [
      { source: '/images/:key', destination: '/api/uploads/:key' },
      { source: '/data/desh-tv/:path*', destination: 'https://desh.tv/:path*' },
      { source: '/data/translate/:path*', destination: 'https://desh.tv/:path*' },
    ];
  },
};
