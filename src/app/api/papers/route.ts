import { NextRequest, NextResponse } from "next/server";

type OpenAlexWork = {
  id?: string;
  title?: string;
  doi?: string | null;
  publication_year?: number | null;
  cited_by_count?: number;
  authorships?: { author?: { display_name?: string } }[];
  primary_location?: { landing_page_url?: string | null };
  open_access?: { is_oa?: boolean };
  abstract_inverted_index?: Record<string, number[]> | null;
};

function rebuildAbstract(index: Record<string, number[]> | null | undefined) {
  if (!index) return "";
  const words: string[] = [];
  for (const [word, positions] of Object.entries(index)) {
    for (const position of positions) words[position] = word;
  }
  return words.filter(Boolean).join(" ");
}

export async function GET(request: NextRequest) {
  const search = request.nextUrl.searchParams.get("search")?.trim();
  if (!search) return NextResponse.json({ papers: [], error: "search required" }, { status: 400 });

  try {
    const url = new URL("https://api.openalex.org/works");
    url.searchParams.set("search", search.slice(0, 160));
    url.searchParams.set("per-page", "8");
    url.searchParams.set(
      "select",
      "id,title,doi,publication_year,cited_by_count,authorships,primary_location,open_access,abstract_inverted_index"
    );

    const response = await fetch(url, { headers: { Accept: "application/json" }, next: { revalidate: 300 } });
    if (!response.ok) throw new Error(`OpenAlex returned ${response.status}`);
    const data = (await response.json()) as { results?: OpenAlexWork[] };

    const papers = (data.results || []).map((paper) => ({
      id: paper.id || "",
      title: paper.title || "Untitled paper",
      year: paper.publication_year,
      authors: (paper.authorships || [])
        .map((authorship) => authorship.author?.display_name)
        .filter(Boolean)
        .slice(0, 3),
      citations: paper.cited_by_count || 0,
      doi: paper.doi || null,
      url: paper.primary_location?.landing_page_url || paper.doi || paper.id || "",
      openAccess: Boolean(paper.open_access?.is_oa),
      abstract: rebuildAbstract(paper.abstract_inverted_index),
    }));

    return NextResponse.json({ source: "openalex", papers });
  } catch (error) {
    return NextResponse.json(
      { source: "openalex", papers: [], error: error instanceof Error ? error.message : "paper search failed" },
      { status: 502 }
    );
  }
}
