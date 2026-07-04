// @ts-check
// .mjs (not .ts) so actions/configure-pages can inject `basePath` for GitHub Pages.

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "export",
  trailingSlash: true,
  transpilePackages: ["three"],
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
