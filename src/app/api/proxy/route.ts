export const runtime = "edge";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing target parameter" }), { status: 400 });
  }

  const decodedUrl = decodeURIComponent(target);
  const headers: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("header_") && value) {
      headers[key.replace("header_", "")] = decodeURIComponent(value);
    }
  }

  const isLineAPI = decodedUrl.includes("chat.line.biz");
  const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

  const finalHeaders: Record<string, string> = {
    "User-Agent": USER_AGENT,
  };

  if (isLineAPI) {
    if (headers["Cookie"]) finalHeaders["Cookie"] = headers["Cookie"];
  } else {
    finalHeaders["Content-Type"] = "application/json";
    if (headers["Referer"]) finalHeaders["Referer"] = headers["Referer"];
  }

  try {
    const res = await fetch(decodedUrl, {
      method: "GET",
      headers: finalHeaders,
    });

    const contentType = res.headers.get("content-type") || "";
    if (contentType.includes("text/html")) {
      const text = await res.text();
      return new Response(
        JSON.stringify({
          valid: false,
          message: "Upstream returned HTML instead of JSON",
          raw: text.slice(0, 300),
        }),
        { status: 502 }
      );
    }

    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}

export async function POST(req: Request) {
  const { searchParams } = new URL(req.url);
  const target = searchParams.get("target");
  if (!target) {
    return new Response(JSON.stringify({ error: "Missing target parameter" }), { status: 400 });
  }

  const decodedUrl = decodeURIComponent(target);
  const body = await req.text();

  const headers: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    if (key.startsWith("header_") && value) {
      headers[key.replace("header_", "")] = decodeURIComponent(value);
    }
  }

  const USER_AGENT =
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36";

  const finalHeaders: Record<string, string> = {
    "User-Agent": USER_AGENT,
    "Content-Type": "application/json",
  };
  if (headers["Referer"]) finalHeaders["Referer"] = headers["Referer"];

  try {
    const res = await fetch(decodedUrl, {
      method: "POST",
      headers: finalHeaders,
      body,
    });

    const contentType = res.headers.get("content-type") || "";
    const data = await res.text();
    return new Response(data, {
      status: res.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
