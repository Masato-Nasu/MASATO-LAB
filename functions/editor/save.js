export async function onRequestPost(context) {
  const headers = {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store"
  };

  try {
    const body = await context.request.json();
    await context.env.SITE_DATA.put("site-data", JSON.stringify(body));
    return new Response(JSON.stringify({ ok: true }), { headers });
  } catch (error) {
    console.error("KV write failed", error);
    return new Response(JSON.stringify({ ok: false, error: "save_failed" }), {
      status: 500,
      headers
    });
  }
}
