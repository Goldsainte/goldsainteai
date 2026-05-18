import { Helmet } from "react-helmet-async";
import { useQuery } from "@tanstack/react-query";
import { fetchAuthors, BASE_URL } from "./lib";

export default function Leadership() {
  const { data: authors = [] } = useQuery({
    queryKey: ["newsroom", "authors"],
    queryFn: fetchAuthors,
    staleTime: 1000 * 60 * 10,
  });

  return (
    <>
      <Helmet>
        <title>Leadership | Goldsainte Newsroom</title>
        <meta name="description" content="Meet the founders and leadership team behind Goldsainte." />
        <link rel="canonical" href={`${BASE_URL}/newsroom/leadership`} />
      </Helmet>
      <div className="max-w-5xl mx-auto px-6 py-20">
        <h1 className="font-secondary text-5xl mb-12">Leadership</h1>
        <div className="space-y-20">
          {authors.map((a) => (
            <article key={a.id} id={a.slug} className="grid md:grid-cols-[200px_1fr] gap-10">
              <div>
                {a.avatar_url ? (
                  <img src={a.avatar_url} alt={a.full_name} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-[#F6F0E4]" />
                )}
              </div>
              <div>
                <h2 className="font-secondary text-3xl">{a.full_name}</h2>
                <p className="text-[#0c4d47] uppercase text-xs tracking-[0.2em] mt-2">{a.title}</p>
                {a.quote && (
                  <blockquote className="font-secondary text-xl italic text-[#0a2225]/80 border-l-2 border-[#c9a84c] pl-4 my-6">
                    "{a.quote}"
                  </blockquote>
                )}
                <p className="text-[#0a2225]/80 leading-relaxed whitespace-pre-line">{a.bio}</p>
                {a.expertise && a.expertise.length > 0 && (
                  <div className="mt-5 flex flex-wrap gap-2">
                    {a.expertise.map((e) => (
                      <span key={e} className="text-[10px] uppercase tracking-wider px-3 py-1 border border-[#E5DFC6]">
                        {e}
                      </span>
                    ))}
                  </div>
                )}
                {a.linkedin_url && (
                  <a
                    href={a.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs uppercase tracking-wider text-[#0c4d47] hover:underline mt-6 inline-block"
                  >
                    LinkedIn →
                  </a>
                )}
              </div>
            </article>
          ))}
          {authors.length === 0 && (
            <p className="text-sm text-[#0a2225]/50 italic">Leadership bios coming soon.</p>
          )}
        </div>
      </div>
    </>
  );
}