
export const metadata = {
    title: "Privacy Policy | Kya Dekhein?",
    description: "Learn how Kya Dekhein? handles information and privacy.",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900">
            <a href="/" className="text-sm underline">← Back to home</a>
            <h1 className="mt-8 text-3xl font-bold">Privacy Policy</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: October 25, 2026</p>

            <h2 className="mt-6 text-xl font-semibold">Information and usage</h2>
            <p className="mt-2 leading-7 text-gray-700">
                Kya Dekhein? lets visitors select movie preferences to receive
                recommendations. Movie searches are processed through the services
                used to provide this functionality. Our hosting provider may process
                technical information when you visit the site.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Cookies and analytics</h2>
            <p className="mt-2 leading-7 text-gray-700">
                Cookies or similar technologies may be used by hosting, analytics,
                or advertising services if enabled. This policy will be updated to
                identify the specific services in use and explain their data practices.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Advertising</h2>
            <p className="mt-2 leading-7 text-gray-700">
                If advertising is introduced, third-party advertising providers may
                use cookies or similar technologies as described in the applicable
                disclosures and consent choices.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact</h2>
            <p className="mt-2 leading-7 text-gray-700">
                For privacy questions, contact the website owner using the contact
                details on our Contact page.
            </p>
        </main>
    );
}
