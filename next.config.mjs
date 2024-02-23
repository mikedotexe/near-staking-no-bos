/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ["@near-wallet-selector/wallet-connect"],
    experimental: {
        esmExternals: "loose"
    }
};

export default nextConfig;
