// Shared Meta Graph API client. Errors carry the endpoint, the kind of token
// used and Meta's code/subcode so logs show exactly which request failed.
// Never log the access token, the full URL (paging.next URLs embed the token)
// or lead field data.

export const graphVersion = () => process.env.META_GRAPH_VERSION || 'v27.0';

export class MetaGraphError extends Error {
  constructor(message, details) {
    super(message);
    this.name = 'MetaGraphError';
    Object.assign(this, details);
  }
}

// "act_123/ads" from either a relative path or a full paging URL, without query.
export function endpointLabel(path) {
  try {
    const url = /^https?:\/\//.test(path) ? new URL(path) : new URL(`https://graph.facebook.com/${path}`);
    return url.pathname.replace(/^\/v\d+(\.\d+)?\//, '').replace(/^\//, '');
  } catch {
    return 'unknown';
  }
}

export async function graph(path, { token, tokenKind = 'unknown', params = {}, method = 'GET' } = {}) {
  const url = /^https?:\/\//.test(path) ? new URL(path) : new URL(`https://graph.facebook.com/${graphVersion()}/${path}`);
  const body = new URLSearchParams();
  const target = method === 'GET' ? url.searchParams : body;
  for (const [key, item] of Object.entries(params)) if (item != null) target.set(key, String(item));
  if (token) target.set('access_token', token);
  const response = await fetch(url, method === 'GET' ? undefined : { method, headers: { 'content-type': 'application/x-www-form-urlencoded' }, body });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const e = data.error || {};
    throw new MetaGraphError(e.message || `Meta Graph API error (${response.status})`, {
      endpoint: endpointLabel(path), method, tokenKind, httpStatus: response.status,
      code: e.code ?? null, subcode: e.error_subcode ?? null, type: e.type || null, fbtraceId: e.fbtrace_id || null
    });
  }
  return data;
}

// Safe, structured description for logs and API responses.
export function describeGraphError(error) {
  if (!(error instanceof MetaGraphError)) return { message: error?.message || 'Unknown error', errorType: error?.name || 'Error' };
  const { endpoint, method, tokenKind, httpStatus, code, subcode, type, fbtraceId } = error;
  return { endpoint, method, tokenKind, httpStatus, code, subcode, type, fbtraceId, message: error.message };
}

export function graphErrorSummary(error) {
  const d = describeGraphError(error);
  if (!d.endpoint) return d.message;
  return `${d.method} ${d.endpoint} (token ${d.tokenKind}) → codice ${d.code ?? '?'}${d.subcode ? `/${d.subcode}` : ''}: ${d.message}`;
}

export const isTokenError = error => error instanceof MetaGraphError && (error.code === 190 || error.code === 102);
