import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const playlistId = searchParams.get("list");

  if (!playlistId) {
    return NextResponse.json({ error: "Missing playlist list ID" }, { status: 400 });
  }

  try {
    const res = await fetch(`https://www.youtube.com/playlist?list=${playlistId}`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Failed to fetch playlist from YouTube" }, { status: 502 });
    }

    const html = await res.text();

    let playlistTitle = "Imported Playlist";
    let playlistAuthor = "YouTube Playlist";
    const tracks: Array<{
      id: string;
      title: string;
      artist: string;
      genre: string;
      artworkUrl?: string;
      duration?: string;
      isCustom?: boolean;
    }> = [];

    // Extract ytInitialData
    const match =
      html.match(/var ytInitialData\s*=\s*({[\s\S]+?});<\/script>/) ||
      html.match(/window\["ytInitialData"\]\s*=\s*({[\s\S]+?});/);

    if (match && match[1]) {
      try {
        const data = JSON.parse(match[1]);
        const header =
          data?.header?.playlistHeaderRenderer ||
          data?.metadata?.playlistMetadataRenderer;

        if (header?.title?.simpleText || header?.title?.runs?.[0]?.text) {
          playlistTitle = header.title.simpleText || header.title.runs[0].text;
        }
        if (header?.ownerText?.runs?.[0]?.text) {
          playlistAuthor = header.ownerText.runs[0].text;
        }

        // Search for playlistVideoRenderer in tab contents
        const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs;
        const contents =
          tabs?.[0]?.tabRenderer?.content?.sectionListRenderer?.contents?.[0]
            ?.itemSectionRenderer?.contents?.[0]?.playlistVideoListRenderer
            ?.contents;

        if (Array.isArray(contents)) {
          contents.forEach((item: any, idx: number) => {
            const video = item?.playlistVideoRenderer;
            if (video?.videoId) {
              const title =
                video?.title?.runs?.[0]?.text ||
                video?.title?.accessibility?.accessibilityData?.label ||
                `Song ${idx + 1}`;
              const artist =
                video?.shortBylineText?.runs?.[0]?.text || playlistAuthor;
              const duration = video?.lengthText?.simpleText || "Music";
              const artworkUrl =
                video?.thumbnail?.thumbnails?.slice(-1)[0]?.url ||
                `https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`;

              tracks.push({
                id: video.videoId,
                title,
                artist,
                genre: "Playlist Track",
                duration,
                artworkUrl,
                isCustom: true,
              });
            }
          });
        }
      } catch (e) {
        console.warn("Failed parsing ytInitialData JSON", e);
      }
    }

    // Fallback extraction from watch?v= links in HTML if ytInitialData was structured differently
    if (tracks.length === 0) {
      const videoIdMatches = html.matchAll(/(?:\/watch\?v=|\/embed\/)([a-zA-Z0-9_-]{11})(?:&amp;|&)list=/g);
      const seen = new Set<string>();
      let counter = 1;
      for (const m of videoIdMatches) {
        const vId = m[1];
        if (!seen.has(vId)) {
          seen.add(vId);
          tracks.push({
            id: vId,
            title: `Song ${counter} (${vId})`,
            artist: playlistAuthor,
            genre: "Playlist Track",
            duration: "Track",
            artworkUrl: `https://i.ytimg.com/vi/${vId}/hqdefault.jpg`,
            isCustom: true,
          });
          counter++;
        }
      }
    }

    return NextResponse.json({
      title: playlistTitle,
      author: playlistAuthor,
      tracks,
    });
  } catch (error) {
    console.error("Error fetching playlist:", error);
    return NextResponse.json({ error: "Failed to process playlist" }, { status: 500 });
  }
}
