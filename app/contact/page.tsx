
export const metadata = {
    title: "Contact | Kya Dekhein?",
    description: "Contact Kya Dekhein? with questions or feedback.",
};

export default function ContactPage() {
    return (
        <main className="mx-auto max-w-3xl px-6 py-12 text-gray-900">
            <a href="/" className="text-sm underline">← Back to home</a>
            <h1 className="mt-8 text-3xl font-bold">Contact</h1>
            <p className="mt-4 leading-7 text-gray-700">
                Have feedback, found an issue, or have a question about Kya Dekhein?
                We'd like to hear from you.
            </p>
            <p className="mt-4 leading-7 text-gray-700">
                Email: "lifeonpenandpaper@gmail.com"
            </p>
        </main>
    );
}
