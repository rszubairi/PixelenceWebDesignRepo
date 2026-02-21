// next.config.js
module.exports = {
  output: 'standalone',
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'z-cdn-media.chatglm.cn',
      },
    ],
  },
  env: {
    CUSTOM_KEY: 'my-value',
  },
};
