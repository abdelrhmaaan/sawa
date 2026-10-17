# Contract: Language negotiation on the SAWA API (006)

This applies to every endpoint under `/api/`. No endpoint, field, or status code is added or removed.

## Request

| Header | Values | Behaviour |
|---|---|---|
| `Accept-Language` | `en`, `ar` (region tags like `ar-EG` and q-lists are accepted) | Picks the response language. Missing, unsupported (e.g. `fr`), or malformed values fall back to **English**; the request never fails because of this header. |

The SAWA frontend always sends `Accept-Language` with the current UI language (`en` or `ar`).

## Response

| Header | Value |
|---|---|
| `Content-Language` | `en` or `ar`: the language actually used |
| `Vary` | includes `Accept-Language` |

## What gets translated

| Response part | Translated? |
|---|---|
| `detail` strings (401/403/404/400/429/500) | Yes |
| Field validation messages (`{"field": ["…"]}`) | Yes |
| `message` in `GET /api/notifications/` items | Yes, when the notification has a known `kind`; older notifications return their stored English text |
| Enum **values** (`status`, `type`, `role`: e.g. `"submitted"`, `"leave"`) | **No.** These are stable machine values; the frontend translates labels from them |
| User-entered fields (`title`, `description`, `note`, `comment`, names, email) | **No.** Returned exactly as stored |
| Dates and times (ISO 8601) | **No.** The frontend formats them |

## Examples

```http
POST /api/auth/token/
Accept-Language: ar
{"email": "sara@sawa.demo", "password": "wrong"}

401  Content-Language: ar
{"detail": "لم يتم العثور على حساب نشط للبيانات المقدمة"}
```

```http
GET /api/notifications/?page_size=1
Accept-Language: ar

200  Content-Language: ar
{"count": 1, "unread_count": 1, "next": null, "previous": null,
 "results": [{"id": 7, "message": "<Arabic sentence containing: Sara Hassan … \"Eid leave\">",
              "link": "/requests/12", "is_read": false, "created_at": "2026-10-17T09:00:00Z"}]}
```

The Arabic wording in these examples is illustrative. The reviewed catalog is the source of truth (spec FR-013).

## Notification item shape: unchanged

`{id, message, link, is_read, created_at}`. `kind` and `params` are internal and are **not** exposed. This keeps the API surface the same and avoids leaking raw params.
