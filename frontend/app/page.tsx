export default function HomePage() {
  return (
    <div className="py-20">
      <h1 className="text-4xl font-bold text-center mb-4">CKD Intelligence</h1>
      <p className="text-center text-lg text-zinc-600 mb-8">
        AI-driven clinical decision support for Chronic Kidney Disease
      </p>
      <div className="flex justify-center gap-4">
        <a
          href="/auth/login"
          className="rounded bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
        >
          Log In
        </a>
        <a
          href="/auth/register"
          className="rounded bg-green-600 px-6 py-3 text-white hover:bg-green-700"
        >
          Register
        </a>
      </div>
    </div>
  );
}
