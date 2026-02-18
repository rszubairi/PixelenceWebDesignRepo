// next.config.js
module.exports = {
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
