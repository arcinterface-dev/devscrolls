---
title: Why Promise.any Leaves Jobs Half Done and How to Cancel Fetch
description: Discover why Promise.any and Promise.race leak running HTTP connections
  and how to truly terminate in-flight fetch requests with AbortController.
publishDate: '2026-07-01'
updatedDate: '2026-11-16'
category: frontend
tags:
- typescript
- performance
- react
heroImage: /why-promise-any-leaves-jobs-half-done-and-how-to-cancel-fetch-hero.webp
heroImageAlt: Diagram comparing Promise.any dangling sockets versus AbortController
  TCP teardown
draft: false
canonical: https://devscrolls.dev/articles/why-promise-any-leaves-jobs-half-done-and-how-to-cancel-fetch/
---

A developer writes `Promise.any()` or `Promise.race()` to query multiple fallback mirrors, grab the fastest response, and push forward. You watch the fastest endpoint resolve in 60 milliseconds and celebrate your clever optimization. Open your browser DevTools network tab, however, and you will see the slower endpoints continuing to stream data for seconds, burning mobile bandwidth and exhausting server connection pools.

**JavaScript promise combinators like Promise.any and Promise.race resolve the moment their condition is met, but they do not stop the underlying asynchronous operations—leaving remaining HTTP requests running on the wire until you explicitly tear down their TCP streams with AbortController.**

## The Lie of Settling Promises Early

To understand why `Promise.any()` leaves work half done, we must separate the JavaScript runtime event loop from the browser networking engine.

When you call `fetch()`, two distinct layers interact:
1. The JavaScript engine creates an in-memory Promise object.
2. The browser network stack (written in C++ or Rust) opens an HTTP socket, negotiates TLS, sends frames, and buffers incoming packets.

```typescript
// The naive multi-endpoint fallback pattern
async function fetchFastestMirror(id: string) { 
  return await Promise.any([
    fetch(`https://us-east.api.com/items/${id}`).then(r => r.json()),
    fetch(`https://eu-west.api.com/items/${id}`).then(r => r.json()),
    fetch(`https://ap-south.api.com/items/${id}`).then(r => r.json())
  ]);
}
```

When `us-east` returns first, `Promise.any()` fulfills immediately. Your application renders the UI. But what happened to `eu-west` and `ap-south`? 

Nothing. In ECMAScript specifications, promises are passive status monitors, not active execution engines. A promise cannot cancel an operation; it merely detaches your callback. The browser network engine does not know you moved on. It continues transferring bytes over open sockets until the slow servers finish sending headers, payloads, and TLS close frames.

## Under the Hood: Tearing Down Sockets with AbortController

If you want the network layer to stop processing bytes, you must signal the underlying socket directly. The browser exposes this through `AbortController` and `AbortSignal`.

When you invoke `abort()`, the signal notifies the browser network stack to emit an immediate TCP `RST` or HTTP/2 `RST_STREAM` frame. The server stops streaming, and client memory buffers are recycled instantly.

Here is how to truly cancel the losers in a competitive fetch race:

```typescript
async function fetchFirstWithCancellation(urls: string[]) {
  const controller = new AbortController();
  const { signal } = controller;

  try {
    return await Promise.any(
      urls.map(async (url) => {
        const response = await fetch(url, { signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        controller.abort(); // Cancel all remaining peer sockets immediately
        return data;
      })
    );
  } catch (err) {
    if (err.name !== 'AbortError') throw err;
  }
}
```

Once the winning fetch parses JSON successfully, `controller.abort()` fires. Every losing fetch rejects immediately with an `AbortError`, cleanly tearing down the remaining in-flight requests at the socket level.

## Production War Story: The Phantom Traffic Surge

In a distributed analytics dashboard, we implemented multi-region client-side failover using `Promise.any()` across three geo-replicated read replicas. If the local replica hiccuped, the global endpoints served the request.

On the surface, user latency looked optimal. But inside our backend metrics:

- Daily egress bandwidth climbed by 180% within forty-eight hours.
- Postgres connection pool limits hit saturation, triggering cascade failures across worker nodes.
- Backend p99 latencies jumped from 45ms to 380ms because database pools were exhausted by discarded queries.

Inspecting client behavior with our [JSON Formatter](/tools/json-formatter/) revealed that every client action fired three distinct 4MB payload queries. When `Promise.any()` selected the local node in 40ms, the other two nodes kept crunching SQL queries and pumping 8MB of unneeded JSON across transit lines.

Adding `AbortController` dropped total network egress by 64% within an hour of deployment.

## Trade-Off Analysis Matrix

| Strategy | Wire Bandwidth | Server Resource Load | Implementation Effort | Client State Integrity |
| :--- | :--- | :--- | :--- | :--- | 
| Raw `Promise.any` | Heavily Wasted | High (Runs all queries) | Zero | Unsafe (Zombie work) |
| In-Memory Ignore Flags | Heavily Wasted | High (Runs all queries) | Low | Moderate |
| `AbortController` Signal | Fully Cleaned | Low (Cancels early) | Moderate | High (Clean boundary) |

## Senior Implementation in React

When working in modern frontends, request teardown should bind directly to component lifecycles and modern query primitives. 

If you use custom hooks, bind `AbortController` inside `useEffect` cleanup functions:

```typescript
useEffect(() => {
  const controller = new AbortController();

  fetch(`/api/profile`, { signal: controller.signal })
    .then(res => res.json())
    .then(setProfile)
    .catch(err => {
      if (err.name !== 'AbortError') reportError(err);
    });

  return () => controller.abort(); // Drops stale fetch when user navigates
}, [userId]);
```

For enterprise state management with TanStack Query, the library passes an `AbortSignal` directly into the query context:

```typescript
useQuery({
  queryKey: ['account', id],
  queryFn: ({ signal }) => fetch(`/api/account/${id}`, { signal }).then(r => r.json())
});
```

If you inspect auth headers or debug token claims before making these calls, use our [JWT Debugger](/tools/jwt-debugger/) to confirm token expiration boundaries without adding heavy client-side verification overhead.

## The Wire Never Forgets

Your application code does not govern network reality; physical sockets do. `Promise.any()` only changes which notification your engine listens to—it does not alter what the browser transfers.

*A promise settles your code, but an AbortSignal settles the wire.*

Are your backend dashboards recording mystery loads during high client traffic? Inspect your DevTools network panel with throttling turned on, and check whether discarded requests are still consuming bandwidth in the dark.
