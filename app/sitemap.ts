
import type { MetadataRoute } from 'next'

const baseUrl = 'https://kya-dekhein.vercel.app'

export default function sitemap(): MetadataRoute.Sitemap {
    const pages = [
        { path: '', priority: 1.0 },
        { path: '/about', priority: 0.6 },
        { path: '/contact', priority: 0.5 },
        { path: '/privacy', priority: 0.5 },
        { path: '/terms', priority: 0.5 },
    ]

    return pages.map(({ path, priority }) => ({
        url: `${baseUrl}${path}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority,
    }))
}
