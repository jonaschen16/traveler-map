import FacebookEmbed from "./FacebookEmbed";
import LinkCard from "./LinkCard";
import ContentActions from "./ContentActions";

export type ContentWithCreator = {
  id: string;
  type: "facebook" | "link";
  url: string;
  note: string | null;
  preview_title: string | null;
  preview_description: string | null;
  preview_image: string | null;
  preview_site_name: string | null;
  created_by: string;
  created_at: string;
  creator: { display_name: string; avatar_url: string | null } | null;
};

export default function ContentItem({
  content: c,
  canManage,
}: {
  content: ContentWithCreator;
  canManage: boolean;
}) {
  return (
    <article>
      <div className="mb-2 flex items-center gap-2 text-xs text-gray-500">
        {c.creator?.avatar_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={c.creator.avatar_url}
            alt=""
            className="h-6 w-6 rounded-full"
            referrerPolicy="no-referrer"
          />
        )}
        <span className="font-medium text-gray-700">{c.creator?.display_name || "匿名"}</span>
        <span>· {new Date(c.created_at).toLocaleDateString("zh-TW")}</span>
      </div>

      {c.note && <p className="mb-2 text-sm whitespace-pre-line text-gray-800">{c.note}</p>}

      {c.type === "facebook" ? (
        <FacebookEmbed url={c.url} />
      ) : (
        <LinkCard
          url={c.url}
          title={c.preview_title}
          description={c.preview_description}
          image={c.preview_image}
          siteName={c.preview_site_name}
        />
      )}

      {canManage && <ContentActions id={c.id} note={c.note} />}
    </article>
  );
}
