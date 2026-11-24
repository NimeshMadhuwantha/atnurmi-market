"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArtCard } from "./art-card";
import { CameraIcon, CheckIcon, EditIcon, TrashIcon, XIcon } from "./icons";
import type { Artwork } from "@/lib/data";
import { optimizeArtworkDataUrl, optimizeThumbnailDataUrl } from "@/lib/image-optimizer";
import { useApp } from "./app-provider";

const deliveryChoices = ["Cash on delivery", "After full payment", "Global delivery", "Free delivery"];
type ManagedArtwork = Artwork & { deliveryOptions: string[]; deliveryCharge: number };
type ImageState = "empty" | "processing" | "ready" | "error";

const emptyImageStates = (): ImageState[] => ["empty", "empty", "empty"];

export function ArtManager() {
  const { user, accountRole } = useApp();
  const [artworks, setArtworks] = useState<ManagedArtwork[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedArtwork | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [imageStates, setImageStates] = useState<ImageState[]>(emptyImageStates);
  const [imagesChanged, setImagesChanged] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<ManagedArtwork | null>(null);
  const imageRequestIds = useRef([0, 0, 0]);

  const load = useCallback(async () => {
    if (!user || accountRole !== "artist") {
      setArtworks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetch("/api/artist/artworks", {
        cache: "no-store",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load your artwork.");
      setArtworks((result.artworks ?? []).map((data: Record<string, unknown>) => {
        const options = Array.isArray(data.deliveryOptions) ? data.deliveryOptions.map(String).filter((option) => deliveryChoices.includes(option)) : [];
        return {
          id: String(data.id),
          name: String(data.name),
          artist: String(data.artist),
          artistId: String(data.artistId),
          category: String(data.category),
          price: Number(data.price),
          size: String(data.size),
          medium: String(data.medium),
          materials: String(data.materials),
          rating: Number(data.rating ?? 0),
          reviews: Number(data.reviews ?? 0),
          delivery: String(data.delivery),
          deliveryOptions: options.length ? options : ["After full payment"],
          deliveryCharge: Number(data.deliveryCharge ?? 0),
          description: String(data.description),
          tone: "ocean",
          note: String(data.note ?? ""),
          imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls.map(String) : [],
        };
      }));
    } catch (cause) {
      setArtworks([]);
      setError(cause instanceof Error ? cause.message : "Unable to load your artwork.");
    } finally {
      setLoading(false);
    }
  }, [user, accountRole]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function startCreate() {
    imageRequestIds.current = imageRequestIds.current.map((requestId) => requestId + 1);
    setEditing(null);
    setSent(false);
    setImages([]);
    setThumbnail("");
    setImagesChanged(false);
    setGalleryLoading(false);
    setImageStates(emptyImageStates());
    setError("");
    setOpen(true);
  }

  async function startEdit(artwork: ManagedArtwork) {
    imageRequestIds.current = imageRequestIds.current.map((requestId) => requestId + 1);
    setEditing(artwork);
    setSent(false);
    setImages([]);
    setThumbnail(artwork.imageUrls?.[0] ?? "");
    setImageStates(emptyImageStates());
    setImagesChanged(false);
    setGalleryLoading(true);
    setError("");
    setOpen(true);
    try {
      if (!user) throw new Error("Sign in again to edit this artwork.");
      const response = await fetch(`/api/artist/artworks?id=${encodeURIComponent(artwork.id)}`, { cache: "no-store", headers: { Authorization: `Bearer ${await user.getIdToken()}` } });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Unable to load the saved gallery.");
      const savedImages = Array.isArray(result.images) ? result.images.map(String).slice(0, 3) : [];
      setImages(savedImages);
      setImageStates(emptyImageStates().map((_, index) => savedImages[index] ? "ready" : "empty"));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load the saved gallery.");
    } finally {
      setGalleryLoading(false);
    }
  }

  async function prepareImage(index: number, file?: File) {
    if (!file) return;
    const requestId = imageRequestIds.current[index] + 1;
    imageRequestIds.current[index] = requestId;
    setImages((current) => {
      const next = [...current];
      next[index] = "";
      return next;
    });
    if (index === 0) setThumbnail("");
    setImageStates((current) => current.map((state, stateIndex) => stateIndex === index ? "processing" : state));
    setError("");
    setImagesChanged(true);
    try {
      const value = await optimizeArtworkDataUrl(file);
      if (imageRequestIds.current[index] !== requestId) return;
      const nextThumbnail = index === 0 ? await optimizeThumbnailDataUrl(file) : "";
      if (imageRequestIds.current[index] !== requestId) return;
      setImages((current) => {
        const next = [...current];
        next[index] = value;
        return next;
      });
      if (index === 0) setThumbnail(nextThumbnail);
      setImageStates((current) => current.map((state, stateIndex) => stateIndex === index ? "ready" : state));
    } catch (cause) {
      if (imageRequestIds.current[index] !== requestId) return;
      setImageStates((current) => current.map((state, stateIndex) => stateIndex === index ? "error" : state));
      setError(cause instanceof Error ? cause.message : "Image could not be processed.");
    }
  }

  function clearImage(index: number) {
    imageRequestIds.current[index] += 1;
    setImages((current) => {
      const next = [...current];
      next[index] = "";
      return next;
    });
    if (index === 0) setThumbnail("");
    setImageStates((current) => current.map((state, stateIndex) => stateIndex === index ? "empty" : state));
    setError("");
    setImagesChanged(true);
  }

  function closeForm() {
    imageRequestIds.current = imageRequestIds.current.map((requestId) => requestId + 1);
    setOpen(false);
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || accountRole !== "artist") return setError("Approved artist access is required.");
    if (imageStates.includes("processing")) return setError("Please wait until all selected images finish processing.");
    const preparedImages = images.filter(Boolean);
    if ((!editing || imagesChanged) && !images[0]) return setError("Please choose a main artwork image.");

    setBusy(true);
    setError("");
    try {
      const form = new FormData(event.currentTarget);
      const options = form.getAll("deliveryOptions").map(String);
      const payload: Record<string, unknown> = {
        name: form.get("name"),
        category: form.get("category"),
        size: form.get("size"),
        medium: form.get("medium"),
        materials: form.get("materials"),
        description: form.get("description"),
        deliveryOptions: options,
        price: form.get("price"),
        deliveryCharge: options.includes("Free delivery") ? 0 : form.get("deliveryCharge"),
        note: form.get("note"),
      };
      if (!editing || imagesChanged) Object.assign(payload, { images: preparedImages, thumbnail });
      const endpoint = editing ? `/api/artist/artworks?id=${encodeURIComponent(editing.id)}` : "/api/artist/artworks";
      const response = await fetch(endpoint, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${await user.getIdToken()}` },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? `Artwork could not be ${editing ? "updated" : "created"}.`);
      setSent(true);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Artwork could not be saved.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    if (!user) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/artist/artworks?id=${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${await user.getIdToken()}` },
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "Artwork could not be deleted.");
      setPendingDelete(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Artwork could not be deleted.");
    } finally { setBusy(false); }
  }

  if (accountRole !== "artist") return <div className="empty-state"><h2>Artist approval required</h2><p>Submit your artist request from the About Us page. Approved access appears on this same Google account.</p></div>;

  return <>
    <div className="manager-bar"><div><strong>{artworks.length}</strong><span>live artwork listings</span></div><button className="button primary" onClick={startCreate}>+ Add new artwork</button></div>
    {error && !open && <p className="admin-error">{error}</p>}
    {loading ? <div className="empty-state compact-state"><h2>Loading your artwork…</h2></div> : artworks.length ? <div className="art-grid manage-grid">{artworks.map((art) => <div className="managed-card" key={art.id}><ArtCard art={art} compact variant="artist"/><div className="managed-actions"><button onClick={() => void startEdit(art)}><EditIcon size={16}/> Edit listing</button><button className="danger-action icon-delete-action" onClick={() => setPendingDelete(art)} aria-label={`Delete ${art.name}`} title="Delete artwork"><TrashIcon size={17}/></button></div></div>)}</div> : <div className="empty-state"><h2>No artwork listed yet.</h2><p>Your first published artwork will appear here and in Explore Arts.</p></div>}
    {open && <div className="modal-backdrop form-backdrop"><section className="art-form-modal"><button className="icon-button modal-close" onClick={closeForm} aria-label="Close artwork form"><XIcon/></button>
      {sent ? <div className="success-state"><span><CheckIcon size={32}/></span><h2>{editing ? "Your artwork is updated." : "Your artwork is live."}</h2><p>The latest listing is now available in Explore Arts.</p><button className="button primary" onClick={closeForm}>Back to my arts</button></div>
        : <><p className="eyebrow">{editing ? "EDIT LISTING" : "NEW LISTING"}</p><h2>{editing ? "Update original artwork" : "Add original artwork"}</h2><p className="muted">Add one main image. The two detail images are optional. Files up to 1 MB are converted to compact WebP and saved with the artwork.</p>
          <form key={editing?.id ?? "new"} className="art-form" onSubmit={submit}>
            <div className="image-upload-row">{["Main image · required", "Detail image · optional", "Framed / scale · optional"].map((label, index) => <div className="image-upload-item" key={label}><label className={`image-upload-choice${images[index] ? " has-image" : ""}`}><input type="file" accept="image/jpeg,image/png,image/webp" aria-label={`Choose ${label.toLowerCase()}`} onChange={(event) => { const file = event.target.files?.[0]; event.target.value = ""; void prepareImage(index, file); }}/>{images[index] ? <><Image className="image-upload-preview" src={images[index]} alt={`${label} preview`} fill unoptimized sizes="33vw"/><span className="image-upload-caption">Click to replace · {label}</span></> : <><CameraIcon/><span>{galleryLoading ? "Loading saved image…" : imageStates[index] === "processing" ? "Processing…" : imageStates[index] === "error" ? "Choose again" : label}</span><small>{imageStates[index] === "processing" ? "Please wait" : "Max 1 MB · JPG, PNG, WebP"}</small></>}</label>{images[index] && <button type="button" className="image-remove" onClick={() => clearImage(index)} aria-label={`Remove ${label.toLowerCase()}`}><XIcon size={16}/></button>}</div>)}</div>
            {imageStates.some((state) => state === "processing")
              ? <p className="image-status" role="status">Processing selected images. Publishing will be available when they are ready.</p>
              : images.filter(Boolean).length > 0 && <p className="image-status" role="status">Main image ready{images.filter(Boolean).length > 1 ? ` · ${images.filter(Boolean).length - 1} optional detail image${images.filter(Boolean).length > 2 ? "s" : ""} ready` : ""}.</p>}
            <div className="form-grid">
              <label className="full">Artwork name<input name="name" required defaultValue={editing?.name}/></label>
              <label>Category<select name="category" required defaultValue={editing?.category ?? "Canvas Art"}><option>Canvas Art</option><option>Watercolour</option><option>Colour Pencil</option><option>Pencil Art</option><option>Graphic Art</option><option>Digital Art</option></select></label>
              <label>Size<input name="size" required placeholder="e.g. 60 × 45 cm" defaultValue={editing?.size}/></label>
              <label>Medium<input name="medium" required placeholder="e.g. Acrylic on canvas" defaultValue={editing?.medium}/></label>
              <label>Materials<input name="materials" required defaultValue={editing?.materials}/></label>
              <label className="full">Description<textarea name="description" required rows={4} defaultValue={editing?.description}/></label>
              <fieldset className="full"><legend>Delivery options</legend>{deliveryChoices.map((option) => <label key={option}><input name="deliveryOptions" value={option} type="checkbox" defaultChecked={editing ? editing.deliveryOptions.includes(option) : option === "After full payment"}/> {option}</label>)}</fieldset>
              <label>Artwork price (LKR)<input name="price" required type="number" min="1" max="100000000" defaultValue={editing?.price}/></label>
              <label>Delivery charge (LKR)<input name="deliveryCharge" type="number" min="0" max="10000000" defaultValue={editing?.deliveryCharge}/></label>
              <label className="full">Special note<textarea name="note" rows={2} defaultValue={editing?.note}/></label>
              {error && <p className="admin-error full" role="alert">{error}</p>}
              <button className="button primary full" disabled={busy || galleryLoading || imageStates.includes("processing")} type="submit">{busy ? "Saving…" : galleryLoading ? "Loading gallery…" : imageStates.includes("processing") ? "Preparing images…" : editing ? "Save artwork changes" : "Publish artwork"}</button>
            </div>
          </form></>}
    </section></div>}
    {pendingDelete && <div className="modal-backdrop"><section className="confirm-modal delete-art-modal" role="dialog" aria-modal="true" aria-labelledby="delete-art-title"><button className="icon-button modal-close" onClick={() => setPendingDelete(null)} aria-label="Close confirmation"><XIcon/></button><span className="delete-modal-icon"><TrashIcon size={23}/></span><h2 id="delete-art-title">Delete this artwork?</h2><p><strong>{pendingDelete.name}</strong> and its saved gallery will be permanently removed.</p><div><button className="button outline" disabled={busy} onClick={() => setPendingDelete(null)}>No, keep it</button><button className="button danger" disabled={busy} onClick={() => void remove(pendingDelete.id)}>{busy ? "Deleting…" : "Yes, delete"}</button></div></section></div>}
  </>;
}
