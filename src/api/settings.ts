export const staticContentApi = {
    get: async (slug: string) => {
        // Mock get API
        return {
            slug,
            title: slug === 'privacy-policy' ? 'Privacy Policy' : 'Terms and Conditions',
            content: `<p>Default content for ${slug}</p>`,
        }
    },
    update: async (_slug: string, _data: unknown) => {
        // Mock update API
        return { success: true }
    }
}
