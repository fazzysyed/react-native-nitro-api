# Resumable Upload Contract

This document defines the expected backend contract for `uploadResumable`.

## Chunk endpoint

Client method:

- `POST <chunk-endpoint>` per chunk

### Required request headers

- `x-upload-id`: unique upload session ID
- `x-file-name`: original file name
- `x-file-size`: total bytes
- `x-chunk-index`: zero-based chunk index
- `x-total-chunks`: total number of chunks
- `Content-Range`: `bytes <start>-<end>/<total>`
- `Content-Type`: file mime type (or `application/octet-stream`)

### Request body

- raw chunk bytes (`Blob`)

### Recommended chunk response

```json
{
  "uploadId": "<id>",
  "chunkIndex": 3,
  "received": true
}
```

## Finalize endpoint (optional)

Client method:

- `POST <finalize-endpoint>` once all chunks uploaded

### Finalize body

```json
{
  "uploadId": "<id>",
  "fileName": "video.mp4",
  "fileType": "video/mp4",
  "totalChunks": 24,
  "totalBytes": 48219812
}
```

Additional metadata fields may be included.

### Recommended finalize response

```json
{
  "uploadId": "<id>",
  "assetId": "abc123",
  "url": "https://cdn.example.com/abc123.mp4"
}
```

## Status codes

- `200/201`: chunk accepted or finalize success
- `400`: malformed chunk metadata
- `401/403`: unauthorized
- `409`: chunk conflict or out-of-order policy violation
- `413`: payload too large
- `5xx`: transient server errors (client retries per chunk)

## Idempotency and ordering

- Backend should accept duplicate chunk uploads safely.
- Backend can enforce strict ordering or accept out-of-order chunks.
- Backend should expose deterministic conflict semantics.

## Security recommendations

- Authenticate every chunk request.
- Validate upload ID ownership.
- Enforce file size/type limits server-side.
- Expire stale upload sessions.
