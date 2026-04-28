# Uploads

## Multipart upload (`upload`)

Use for standard file upload forms.

```ts
await api.upload('/media/upload', {
  files: [
    { uri: 'file:///tmp/a.jpg', name: 'a.jpg', type: 'image/jpeg' },
    { uri: 'file:///tmp/b.jpg', name: 'b.jpg', type: 'image/jpeg' },
  ],
  fileFieldName: 'files',
  fields: {
    folder: 'gallery',
    public: true,
  },
});
```

## Link upload (`uploadLink`)

Use for importing media by URL.

```ts
await api.uploadLink('/media/import', 'https://example.com/img.png', {
  folder: 'imports',
});
```

## Resumable upload (`uploadResumable`)

Use for large media and unstable networks.

```ts
const controller = new AbortController();

await api.uploadResumable('/upload/chunk', {
  file: { uri: 'file:///tmp/video.mp4', name: 'video.mp4', type: 'video/mp4' },
  chunkSize: 2 * 1024 * 1024,
  maxRetriesPerChunk: 3,
  onProgress: ({ progress }) => {
    console.log(Math.round(progress * 100));
  },
  finalizeEndpoint: '/upload/finalize',
}, {
  signal: controller.signal,
});

// cancel when needed
// controller.abort();
```

## Recommendations

- Validate file type and size on client and server.
- Use resumable mode for videos and long uploads.
- Keep finalize endpoint idempotent.
- Return deterministic upload IDs for resume support.
