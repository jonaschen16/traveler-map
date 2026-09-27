export default async function Home({ searchParams }: PageProps<"/">) {
  const { auth_error } = await searchParams;

  return (
    <div className="mx-auto max-w-xl p-8 text-gray-700">
      {auth_error && (
        <p className="mb-4 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          登入失敗，請再試一次。
        </p>
      )}
      <p>地圖將在第 2 階段加入。</p>
    </div>
  );
}
