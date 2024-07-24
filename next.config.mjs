/** @type {import('next').NextConfig} */
const nextConfig = {
    webpack: function (config, options) {
        config.experiments = { asyncWebAssembly: true, syncWebAssembly: true, layers: true, topLevelAwait: true };
        config.plugins.push(
            new options.webpack.IgnorePlugin({
                checkResource(resource) {
                    return /.*\/wordlists\/(?!english).*\.json/.test(resource)
                }
            }),
        );
        return config;
    }

};

export default nextConfig;
