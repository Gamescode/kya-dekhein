
export const metadata = {
    title: "Terms of Use | Kya Dekhein?",
    description: "Terms for using Kya Dekhein?.",
};

export default function TermsPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900">
            <a href="/" className="text-sm underline">← Back to home</a>
            <h1 className="mt-8 text-3xl font-bold">Terms of Use</h1>
            <p className="mt-2 text-sm text-gray-500">Last updated: October 25, 2026</p>

            <h2 className="mt-6 text-xl font-semibold">Using the service</h2>
            <p className="mt-2 leading-7 text-gray-700">
                Kya Dekhein? provides movie suggestions based on the preferences
                selected by visitors. Recommendations and availability information
                may be incomplete, change over time, or contain errors.
            </p>

            <h2 className="mt-6 text-xl font-semibold">External services</h2>
            <p className="mt-2 leading-7 text-gray-700">
                Links to third-party websites are provided for convenience.
                Their content, availability, terms, and privacy practices are
                controlled by those third parties.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Movie data attribution</h2>
            <p className="mt-2 leading-7 text-gray-700">
                Movie information and images are provided by TMDB. Kya Dekhein?
                uses TMDB data but is not endorsed or certified by TMDB.
                Streaming availability information is powered by JustWatch data.
            </p>

            <h2 className="mt-6 text-xl font-semibold">Contact</h2>
            <p className="mt-2 leading-7 text-gray-700">
                For questions about these terms, please use our Contact page.
            </p>
        </main>
    );
}
