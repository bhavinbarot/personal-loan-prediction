# 007 — Keep inference stateless

## Context

The public demo scores synthetic customers and user-entered profiles. Nothing in
the product story requires remembering those inputs, and the profiles contain
financial attributes that should not be retained.

## Decision

The API holds only the loaded model in memory. No database, cache server, queue,
or session store is added. User-entered customer values are never persisted,
never logged, and never sent to third-party analytics. Request logs contain
routing metadata only.

## Alternatives considered

- **Store scored profiles for "recent customers" features**: nice to have, but
  turns a demo into a data controller for financial attributes.
- **Cache rankings server-side**: unnecessary at demo scale; the population is
  deterministic and scoring 200 rows takes milliseconds.

## Why

Statelessness keeps deployment to a single container per service, makes
horizontal scaling trivial, and eliminates a class of privacy risk.

## Tradeoffs

No cross-session history and no server-side rate limiting state. Both are
acceptable for a read-only portfolio demo and can be added behind a proxy later.

## Status

Accepted.
