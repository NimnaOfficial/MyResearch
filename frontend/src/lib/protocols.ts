import { API_URL } from './api';

// ==========================================
// 1. GRAPHQL PROTOCOL CLIENT
// ==========================================
export async function fetchGraphQL<T = any>(query: string, variables?: Record<string, any>): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('matrix_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('matrix_token') : null;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/grpc-web+json',
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

// ==========================================
// 3. SOAP 1.2 ENTERPRISE XML CLIENT
// ==========================================
export async function callSoap(operation: string, xmlBodyContent: string): Promise<{ rawXml: string; latencyMs: number; parsedValues: Record<string, string> }> {
  const start = performance.now();
  
  const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://www.w3.org/2003/05/soap-envelope" xmlns:sec="http://csx.matrix.io/security/v1">
  <soapenv:Header>
    <sec:WS-SecurityTimestamp>${new Date().toISOString()}</sec:WS-SecurityTimestamp>
  </soapenv:Header>
  <soapenv:Body>
    ${xmlBodyContent}
  </soapenv:Body>
</soapenv:Envelope>`;

  const res = await fetch(`${API_URL}/api/soap/security`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/soap+xml; charset=utf-8',
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
      // Stream reconnection is handled automatically by EventSource browser standard
    };

    return () => {
      source.close();
    };
  } catch (err) {
    console.error('[SSE] Failed to establish EventSource connection:', err);
    return () => {};
  }
}
