import { APP_DESCRIPTION, APP_NAME } from "@/shared/app-info";

export default function Home() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-12">
      <section className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-10 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Foundation ready
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">
          {APP_NAME}
        </h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-slate-600">
          {APP_DESCRIPTION}
        </p>
      </section>
    </main>
  );
}
