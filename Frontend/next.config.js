/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Add a rule to handle the undici module
    config.module.rules.push({
      test: /node_modules\/undici/,
      use: {
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-env'],
          plugins: ['@babel/plugin-proposal-private-methods']
        }
      }
    });

    return config;
  }
};

module.exports = nextConfig; 