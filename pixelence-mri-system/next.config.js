module.exports = {
  reactStrictMode: true,
  output: 'standalone',
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
