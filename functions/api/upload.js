
function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}

function sanitizeFilename(name = "image") {
  const dot = name.lastIndexOf(".");
  const ext = dot >= 0 ? name.slice(dot + 1).toLowerCase() : "bin";
  const base = (dot >= 0 ? name.slice(0, dot) : name)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "") || "image";
  return { base, ext: ext || "bin" };
}

export async function onRequestPost(context) {
  try {
    const bucket = context.env.MEDIA;
    if (!bucket) {
      return json({ ok: false, error: "missing_r2_binding" }, 500);
    }

    const publicBase = context.env.R2_PUBLIC_BASE_URL;
    if (!publicBase) {
      return json({ ok: false, error: "missing_public_base_url" }, 500);
    }

    const form = await context.request.formData();
    const file = form.get("file");
    const kind = String(form.get("kind") || "asset").toLowerCase();

    if (!(file instanceof File)) {
      return json({ ok: false, error: "missing_file" }, 400);
    }

    const allowedKind = kind === "tools" ? "tools" : "portfolio";
    const { base, ext } = sanitizeFilename(file.name);
    const now = new Date();
    const stamp = now.toISOString().replace(/[:.]/g, "-");
    const key = `${allowedKind}/${stamp}-${base}.${ext}`;

    await bucket.put(key, file.stream(), {
      httpMetadata: {
        contentType: file.type || "application/octet-stream"
      }
    });

    const cleanBase = String(publicBase).replace(/\/+$/, "");
    return json({
      ok: true,
      key,
      url: `${cleanBase}/${key}`
    });
  } catch (error) {
    console.error("upload failed", error);
    return json({ ok: false, error: "upload_failed" }, 500);
  }
}
