// next.config.js
module.exports = {
  reactStrictMode: true,
  images: {
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
