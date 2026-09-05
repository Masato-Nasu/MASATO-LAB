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

    // Older editor builds do not expose site.profileImage.
    // Preserve the existing About portrait instead of deleting it on save.
    if (!body.site || typeof body.site !== "object") body.site = {};
    if (!String(body.site.profileImage || "").trim()) {
      try {
        const currentRaw = await context.env.SITE_DATA.get("site-data");
        if (currentRaw) {
          const current = JSON.parse(currentRaw);
          const existing = String(current?.site?.profileImage || "").trim();
          if (existing) body.site.profileImage = existing;
        }
      } catch (mergeError) {
        console.error("profileImage preserve failed", mergeError);
      }
    }

    await context.env.SITE_DATA.put("site-data", JSON.stringify(body));
    return json({ ok: true });
  } catch (error) {
    return json({ ok: false, error: String(error) }, 500);
  }
}
