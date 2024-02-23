/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@near-wallet-selector/wallet-connect"],
    experimental: {
        esmExternals: "loose"
    },
    webpack: config => {
        config.externals.push('pino-pretty', 'lokijs', 'encoding')
        return config
    }
};

export default nextConfig;
