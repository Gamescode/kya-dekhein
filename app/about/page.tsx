
export const metadata = {
    title: "About | Kya Dekhein?",
    description: "Learn about Kya Dekhein? and how it helps you choose what to watch.",
};

export default function AboutPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900">
            <a href="/" className="text-sm underline">← Back to home</a>
            <h1 className="mt-8 text-3xl font-bold">About Kya Dekhein?</h1>
            <p className="mt-4 leading-7 text-gray-700">
                Kya Dekhein? helps you spend less time browsing and more time watching.
                Choose how much time you have, your mood, and your preferred language
                to discover a movie recommendation.
            </p>
            <p className="mt-4 leading-7 text-gray-700">
                Movie information and images are provided by TMDB. Streaming
                availability information is powered by JustWatch data. Kya Dekhein?
                is an independent project and is not endorsed or certified by TMDB
                or JustWatch.
            </p>
        </main>
    );
}
