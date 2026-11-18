/** The store's public address (SITE_URL), so links shared on WhatsApp and social media point at your domain. */
export function siteUrl(): URL | undefined {
  try {
    return process.env.SITE_URL ? new URL(process.env.SITE_URL) : undefined;
  } catch {
    return undefined;
  }
}
