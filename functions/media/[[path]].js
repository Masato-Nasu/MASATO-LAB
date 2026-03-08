
export async function onRequestGet(context) {
  const bucket = context.env.MEDIA;
  if (!bucket) {
    return new Response("R2 binding is missing.", { status: 500 });
  }

  const raw = context.params.path;
  const key = Array.isArray(raw) ? raw.join("/") : String(raw || "");
  if (!key) return new Response("Not found", { status: 404 });

  const object = await bucket.get(key);
  if (object === null) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("etag", object.httpEtag);
  headers.set("cache-control", "public, max-age=31536000, immutable");
  return new Response(object.body, { headers });
}
