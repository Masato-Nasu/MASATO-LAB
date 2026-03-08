function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

export async function onRequestGet(context) {
  return json({
    ok: true,
    route: "/api/save",
    hasKv: !!(context.env && context.env.SITE_DATA)
  });
}

export async function onRequestPost(context) {
  try {
    if (!context.env || !context.env.SITE_DATA) {
      return json({ ok: false, error: "missing_kv_binding" }, 500);
    }
    const body = await context.request.json();
    await context.env.SITE_DATA.put("site-data", JSON.stringify(body));
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}
