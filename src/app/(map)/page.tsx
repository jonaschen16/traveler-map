import { getDictionary } from "@/i18n/server";

export default async function Home({ searchParams }: PageProps<"/">) {
  const { auth_error } = await searchParams;
  if (!auth_error) return null;
  const t = await getDictionary();

  return (
    <p className="absolute top-16 left-3 right-3 z-10 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 shadow sm:left-auto sm:w-96">
      {t.home.authError}
    </p>
  );
}
