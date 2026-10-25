export const metadata = {
    title: "Privacy Policy | Kya Dekhein?",
    description:
        "Learn how Kya Dekhein? handles information, third-party services, cookies, and privacy.",
};

export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900">
            <a href="/" className="text-sm underline">
                ← Back to home
            </a>

            <h1 className="mt-8 text-3xl font-bold">Privacy Policy</h1>

            <p className="mt-2 text-sm text-gray-500">
                Last updated: October 25, 2026
            </p>

            <p className="mt-4 leading-7 text-gray-700">
                Kya Dekhein? ("we", "our", or "the website") helps visitors discover
                movies based on their selected preferences. This Privacy Policy
                explains how information may be processed when you use the website.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                1. Information We Process
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                When you use Kya Dekhein?, you can select preferences such as
                available time, mood, and language to receive movie recommendations.
                These selections are used to provide the requested functionality.
                Please do not submit sensitive or confidential information through
                the website.
            </p>
            <p className="mt-2 leading-7 text-gray-700">
                We do not currently require visitors to create an account or provide
                personal information to browse recommendations. Our hosting
                infrastructure and third-party services may process technical
                information, such as IP addresses, browser information, request
                details, and timestamps, as necessary to operate, secure, and deliver
                the website.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                2. Movie Data and Third-Party Services
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                The website uses The Movie Database (TMDB) to retrieve movie
                information and images. Requests to external services may involve
                processing information such as technical request data. Movie
                information and images are subject to the applicable third-party
                terms and policies.
            </p>
            <p className="mt-2 leading-7 text-gray-700">
                Streaming availability information may be based on JustWatch data.
                When you follow a link to a streaming provider or another external
                website, that website's own privacy policy and terms apply. We do not
                control the information collected by those external services.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                3. Hosting, Cookies, and Analytics
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                Kya Dekhein? is hosted on Vercel. Vercel and other infrastructure
                providers may process technical information and use technologies
                necessary for hosting, security, and service delivery. For details,
                please review the relevant providers' privacy policies.
            </p>
            <p className="mt-2 leading-7 text-gray-700">
                We do not currently have Vercel Web Analytics enabled. This may
                change if we introduce analytics or other measurement services in
                the future. Any such services will be subject to their applicable
                privacy disclosures and settings.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                4. Advertising
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                Kya Dekhein? does not currently display advertisements through
                Google AdSense. If advertising is introduced, third-party providers,
                including Google, may use cookies, web beacons, IP addresses, or
                similar technologies to serve ads, measure performance, prevent
                fraud, and, where permitted by applicable settings and law,
                personalize advertising.
            </p>
            <p className="mt-2 leading-7 text-gray-700">
                If advertising is introduced, we will update this policy as
                appropriate to explain the services in use and provide any
                disclosures or choices required by applicable policies and law.
                Information about how Google uses data on partner sites is available
                at{" "}
                <a
                    href="https://policies.google.com/technologies/partner-sites"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline"
                >
                    How Google uses information from sites or apps that use its services
                </a>.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                5. How Information Is Used
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                Information processed through the website may be used to provide
                movie recommendations, retrieve requested movie details, maintain
                website security, troubleshoot errors, and keep the service
                functioning. We do not sell visitors' personal information.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                6. Data Retention and Security
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                We do not currently operate a visitor account system. Technical
                information processed by hosting or third-party providers may be
                retained for periods determined by those providers' policies,
                operational needs, and applicable law. We take reasonable steps to
                maintain the website, but no internet service can guarantee
                absolute security.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                7. Children's Privacy
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                Kya Dekhein? is a general-audience movie discovery website and is
                not specifically directed at children. If you believe a child has
                provided personal information to us, please contact us so we can
                review the matter.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                8. Your Choices and Rights
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                You can choose whether to use the website and which movie
                preferences to select. You can also manage cookies through your
                browser settings. Depending on your location, you may have additional
                rights concerning personal information under applicable law. You may
                contact us with privacy-related questions or requests.
            </p>

            <h2 className="mt-6 text-xl font-semibold">
                9. Changes to This Policy
            </h2>
            <p className="mt-2 leading-7 text-gray-700">
                We may update this Privacy Policy when the website, services, or
                applicable requirements change. The latest version will be published
                on this page with its updated date.
            </p>

            <h2 className="mt-6 text-xl font-semibold">10. Contact</h2>
            <p className="mt-2 leading-7 text-gray-700">
                For questions about this Privacy Policy or your privacy, please
                visit our{" "}
                <a href="/contact" className="underline">
                    Contact page
                </a>.
            </p>
        </main>
    );
}