"use client";

import { useRef, useState } from "react";

type UploadResult = {
  cid: string;
  uri: string;
  gatewayUrl: string;
};

type ApiResponse = {
  cid?: string;
  uri?: string;
  gatewayUrl?: string;
  error?: string;
};

export default function PinataUploader() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<UploadResult | null>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];

    setError("");
    setResult(null);

    if (!selectedFile) return;

    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

    if (!allowedTypes.includes(selectedFile.type)) {
      setError("Choose a JPEG, PNG, WebP, or GIF image.");
      event.target.value = "";
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      setError("Your image must be 10 MB or smaller.");
      event.target.value = "";
      return;
    }

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
  }

  async function handleUpload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");
    setResult(null);

    if (!file) {
      setError("Please select an image before uploading.");
      return;
    }

    if (!title.trim()) {
      setError("Please enter an artwork title.");
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/image", {
        method: "POST",
        body: formData,
      });

      const responseText = await response.text();

      let data: ApiResponse;

      try {
        data = JSON.parse(responseText) as ApiResponse;
      } catch {
        const preview = responseText
          .replace(/<[^>]*>/g, " ")
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 180);

        throw new Error(
          `Upload API returned a non-JSON response (HTTP ${response.status}). ` +
            `Check that the request is reaching your Next.js app at /api/upload.` +
            (preview ? ` Response: ${preview}` : ""),
        );
      }

      if (!response.ok) {
        throw new Error(
          data.error || `Upload failed with HTTP ${response.status}.`,
        );
      }

      if (!data.cid || !data.uri || !data.gatewayUrl) {
        throw new Error(
          "The server response is missing the IPFS upload details.",
        );
      }

      setResult({
        cid: data.cid,
        uri: data.uri,
        gatewayUrl: data.gatewayUrl,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while uploading your image.",
      );
    } finally {
      setUploading(false);
    }
  }

  function clearImage() {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setFile(null);
    setPreviewUrl("");
    setResult(null);
    setError("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <section className="w-full max-w-2xl rounded-2xl border border-white/10 bg-zinc-950 p-6 text-white sm:p-8">
      <div className="mb-7">
        <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-lime-400">
          Mintlab Studio
        </p>

        <h2 className="text-2xl font-bold sm:text-3xl">Upload your artwork</h2>

        <p className="mt-2 text-sm leading-6 text-zinc-400">
          Upload an image to IPFS using Pinata. Your returned IPFS URI can be
          used when preparing your NFT metadata.
        </p>
      </div>

      <form onSubmit={handleUpload} className="space-y-6">
        <div>
          <label
            htmlFor="artwork-title"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Artwork title
          </label>

          <input
            id="artwork-title"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="e.g. Composition No. 08"
            maxLength={100}
            required
            className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
          />
        </div>

        <div>
          <label
            htmlFor="artwork-description"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Description
          </label>

          <textarea
            id="artwork-description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Tell collectors about your artwork..."
            maxLength={2000}
            rows={4}
            className="w-full resize-y rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-white outline-none transition placeholder:text-zinc-600 focus:border-lime-400"
          />

          <p className="mt-1 text-right text-xs text-zinc-500">
            {description.length}/2000
          </p>
        </div>

        <div>
          <label
            htmlFor="artwork-file"
            className="mb-2 block text-sm font-medium text-zinc-200"
          >
            Artwork image
          </label>

          <input
            ref={fileInputRef}
            id="artwork-file"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="block w-full cursor-pointer rounded-xl border border-white/10 bg-zinc-900 p-3 text-sm text-zinc-400 file:mr-4 file:cursor-pointer file:rounded-lg file:border-0 file:bg-lime-400 file:px-4 file:py-2 file:font-semibold file:text-zinc-950 hover:file:bg-lime-300"
          />

          <p className="mt-2 text-xs text-zinc-500">
            JPEG, PNG, WebP, or GIF · Maximum 10 MB
          </p>
        </div>

        {previewUrl && (
          <div className="overflow-hidden rounded-xl border border-white/10 bg-zinc-900">
            <img
              src={previewUrl}
              alt="Artwork preview"
              className="max-h-96 w-full object-contain"
            />

            <div className="flex items-center justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">
                  {file?.name}
                </p>

                {file && (
                  <p className="text-xs text-zinc-500">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={clearImage}
                disabled={uploading}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Remove
              </button>
            </div>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm leading-6 text-red-300"
          >
            <p className="font-semibold">Upload error</p>
            <p className="mt-1 break-words">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3.5 font-bold text-zinc-950 transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading ? (
            <>
              <span
                className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-950/30 border-t-zinc-950"
                aria-hidden="true"
              />
              Uploading to IPFS...
            </>
          ) : (
            "Upload artwork to IPFS"
          )}
        </button>
      </form>

      {result && (
        <div className="mt-7 space-y-4 rounded-xl border border-lime-400/30 bg-lime-400/5 p-5">
          <div>
            <p className="text-sm font-semibold text-lime-400">
              Image uploaded successfully
            </p>

            <p className="mt-1 text-sm text-zinc-400">
              Your image is pinned to IPFS through Pinata.
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              IPFS CID
            </p>

            <p className="break-all rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-200">
              {result.cid}
            </p>
          </div>

          <div>
            <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              IPFS URI
            </p>

            <p className="break-all rounded-lg bg-zinc-900 p-3 font-mono text-xs text-zinc-200">
              {result.uri}
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <a
              href={result.gatewayUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-lime-400 px-4 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-lime-300"
            >
              View uploaded image ↗
            </a>

            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(result.uri);
              }}
              className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-zinc-200 transition hover:bg-white/5"
            >
              Copy IPFS URI
            </button>
          </div>

          <p className="text-xs leading-5 text-zinc-500">
            The image is uploaded, but the title and description have not yet
            been saved as NFT metadata or minted on-chain.
          </p>
        </div>
      )}
    </section>
  );
}
