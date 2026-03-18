import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

const nextConfig: NextConfig = {
  // Strict mode for better dev experience
  reactStrictMode: true,
  // Treat these Node.js-only packages as external so Next.js doesn't try to bundle them
  serverExternalPackages: ['mammoth', 'pdf-parse'],
}

export default withNextIntl(nextConfig)
