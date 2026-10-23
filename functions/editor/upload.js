import {requireAdmin} from '../_admin-access.js';
function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'cache-control': 'no-store' } });
}

export async function onRequestPost({ request, env }) {
  const denied = await requireAdmin(request,env);
  if (denied) return denied;
  if (!env.MEDIA) return json({ ok: false, error: '画像の保存先が設定されていません' }, 500);
  try {
    const form = await request.formData();
    const file = form.get('file');
    const extensions = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' };
    if (!(file instanceof File) || !Object.hasOwn(extensions, file.type)) {
      return json({ ok: false, error: '対応している画像形式を選んでください' }, 400);
    }
    if (!file.size || file.size > 10 * 1024 * 1024) {
      return json({ ok: false, error: '10MB以下の写真を選んでください' }, 400);
    }
    const key = `about/${crypto.randomUUID()}.${extensions[file.type]}`;
    await env.MEDIA.put(key, file.stream(), { httpMetadata: { contentType: file.type } });
    return json({ ok: true, url: `/media/${key}` });
  } catch (error) {
    console.error('Profile photo upload failed', error);
    return json({ ok: false, error: '画像の保存に失敗しました' }, 500);
  }
}
