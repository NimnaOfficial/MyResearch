import { API_URL, getToken } from './api';

// ==========================================
// 🛡️ API CLOAKING & SHIELD SECURITY ENGINE
// ==========================================
function getShieldHeaders(): Record<string, string> {
  const now = Date.now().toString();
  return {
    'x-shield-timestamp': now,
    'x-shield-client': 'Matrix-Defense-Client-v4',
  };
}

// In-Memory SWR (Stale-While-Revalidate) Micro-Cache
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
const memoryCache = new Map<string, CacheEntry<any>>();

export function invalidateProtocolCache(pattern?: string) {
  if (!pattern) {
    memoryCache.clear();
    return;
  }
  for (const key of memoryCache.keys()) {
    if (key.includes(pattern)) {
      memoryCache.delete(key);
    }
  }
}

// ==========================================
// 1. GRAPHQL PROTOCOL CLIENT (WITH SWR CACHE)
// ==========================================
export async function fetchGraphQL<T = any>(
  query: string, 
  variables?: Record<string, any>,
  options: { bypassCache?: boolean; ttlMs?: number } = {}
): Promise<T> {
  const cacheKey = `gql_${query}_${JSON.stringify(variables || {})}`;
  const now = Date.now();
  const ttl = options.ttlMs ?? 30000; // 30s default cache

  // Check SWR memory cache
  if (!options.bypassCache && memoryCache.has(cacheKey)) {
    const entry = memoryCache.get(cacheKey)!;
    const isStale = (now - entry.timestamp) > ttl;
    
    // If stale, revalidate silently in the background
    if (isStale) {
      setTimeout(() => {
        fetchGraphQLDirect<T>(query, variables)
          .then(fresh => memoryCache.set(cacheKey, { data: fresh, timestamp: Date.now() }))
          .catch(() => {});
      }, 0);
    }
    return entry.data as T;
  }

  const result = await fetchGraphQLDirect<T>(query, variables);
  memoryCache.set(cacheKey, { data: result, timestamp: now });
  return result;
}

async function fetchGraphQLDirect<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = typeof window !== 'undefined' ? getToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...getShieldHeaders(),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}/api/graphql`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  if (json.errors && json.errors.length > 0) {
    throw new Error(json.errors[0].message || 'GraphQL Query Failure');
  }
  return json.data as T;
}

// ==========================================
// 2. gRPC-WEB / RPC HIGH-SPEED CLIENT
// ==========================================
export async function callGrpc<T = any>(
  service: string, 
  method: string, 
  payload: Record<string, any> = {}
): Promise<{ data: T; latencyMs: number; status: string }> {
  const token = typeof window !== 'undefined' ? getToken() : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/grpc-web+json',
    ...getShieldHeaders(),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const start = performance.now();
  const res = await fetch(`${API_URL}/api/grpc/${service}/${method}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(payload),
  });

  const latencyMs = Math.round(performance.now() - start);
  const grpcStatus = res.headers.get('grpc-status') || '0';
  const grpcMessage = res.headers.get('grpc-message') || 'OK';

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || grpcMessage || `gRPC Call Failed (${res.status})`);
  }

  const data = await res.json();
  return { data, latencyMs, status: grpcMessage };
}

/** High-speed gRPC Feedback submission with automatic fallback */
export async function submitFeedbackViaGrpc(feedback: {
  rating: number;
  category: string;
  priority: string;
  recommend: boolean;
  tags?: string;
  message: string;
}): Promise<{ success: boolean; feedbackId: string; sentiment?: string; latencyMs: number }> {
  try {
    const rpcRes = await callGrpc('FeedbackService', 'SubmitFeedback', feedback);
    return {
      success: true,
      feedbackId: rpcRes.data.feedbackId || 'fb-ok',
      sentiment: rpcRes.data.sentiment,
      latencyMs: rpcRes.latencyMs,
    };
  } catch (err) {
    console.warn('[gRPC Feedback] Primary RPC failed, falling back to REST:', err);
    // Automatic transparent fallback to REST
    const token = typeof window !== 'undefined' ? getToken() : null;
    const res = await fetch(`${API_URL}/api/feedback/submit`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(feedback),
    });
    const json = await res.json();
    return {
      success: res.ok,
      feedbackId: json.data?.id || 'rest-fb',
      latencyMs: 50,
    };
  }
}

/** High-speed gRPC Contact Comm-Link submission with automatic transparent REST fallback */
export async function sendContactMessage(payload: {
  name?: string;
  email?: string;
  subject?: string;
  message: string;
}): Promise<{ success: boolean; messageId: string; latencyMs: number }> {
  try {
    const rpcRes = await callGrpc('ContactService', 'SendMessage', payload);
    return {
      success: true,
      messageId: rpcRes.data.messageId || 'msg-ok',
      latencyMs: rpcRes.latencyMs,
    };
  } catch (err) {
    console.warn('[gRPC Contact] Primary RPC failed, falling back to REST /api/contact/send:', err);
    const token = typeof window !== 'undefined' ? getToken() : null;
    const res = await fetch(`${API_URL}/api/contact/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.message || 'Failed to dispatch transmission.');
    return {
      success: true,
      messageId: json.data?.messageId || 'rest-msg',
      latencyMs: 70,
    };
  }
}

// ==========================================
// 3. SOAP 1.2 ENTERPRISE XML CLIENT
// ==========================================
export async function callSoap(
  operation: string, 
  xmlBodyContent: string
): Promise<{ rawXml: string; latencyMs: number; parsedValues: Record<string, string> }> {
  const start = performance.now();
  
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:WS-SecurityTimestamp>${new Date().toISOString()}</sec:WS-SecurityTimestamp>
    <sec:ClientPlatform>Matrix-Enterprise-SOAP-Engine</sec:ClientPlatform>
  </soapenv:Header>
  <soapenv:Body>
    ${xmlBodyContent}
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(`${API_URL}/api/soap/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
      ...getShieldHeaders(),
    },
    body: envelope,
  });

  const latencyMs = Math.round(performance.now() - start);
  const rawXml = await res.text();

  // Simple XML tag extractor for client display
  const parsedValues: Record<string, string> = {};
  const tagMatches = rawXml.matchAll(/<([a-zA-Z0-9_]+:)?([a-zA-Z0-9_]+)>([^<]+)<\/([a-zA-Z0-9_]+:)?\2>/g);
  for (const match of tagMatches) {
    parsedValues[match[2]] = match[3];
  }

  return { rawXml, latencyMs, parsedValues };
}

/** SOAP 1.2 Token Verification with automatic REST fallback */
export async function verifyTokenViaSoap(token: string): Promise<{ success: boolean; message: string; signature?: string }> {
  try {
    const xml = `
      <sec:VerifySecurityTokenRequest>
        <sec:token>${token}</sec:token>
      </sec:VerifySecurityTokenRequest>
    `;
    const res = await callSoap('VerifySecurityToken', xml);
    if (res.parsedValues.status === 'SUCCESS' || res.parsedValues.statusCode === '200') {
      return {
        success: true,
        message: res.parsedValues.message || 'Identity verified via SOAP 1.2 Enterprise Envelope.',
        signature: res.parsedValues.digitalSignature || res.parsedValues.AuditStamp,
      };
    }
  } catch (e) {
    console.warn('[SOAP Verify] Primary SOAP verification failed, attempting REST fallback:', e);
  }

  // Transparent REST fallback
  const res = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token }),
  });
  const data = await res.json();
  return {
    success: res.ok,
    message: data.message || (res.ok ? 'Email verified successfully.' : 'Verification failed.'),
  };
}

// ==========================================
// 4. REAL-TIME SERVER-SENT EVENTS (SSE) STREAM
// ==========================================
export function subscribeSecurityStream(onEvent: (event: any) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  try {
    const source = new EventSource(`${API_URL}/api/security/stream`);

    source.onmessage = (e) => {
      try {
        const parsed = JSON.parse(e.data);
        onEvent(parsed);
      } catch (err) {
        console.warn('[SSE] Event parse error:', err);
      }
    };

    source.onerror = () => {
      // Reconnection handled automatically by browser EventSource
    };

    return () => {
      source.close();
    };
  } catch (err) {
    console.error('[SSE] Failed to establish EventSource connection:', err);
    return () => {};
  }
}
