"use client";

import { useCallback, useEffect, useState } from "react";
import { collection, getDocs, limit, query, where } from "firebase/firestore";
import { ArtCard } from "./art-card";
import { CameraIcon, CheckIcon, EditIcon, XIcon } from "./icons";
import type { Artwork } from "@/lib/data";
import { firestore } from "@/lib/firebase-client";
import { optimizeArtworkDataUrl, optimizeThumbnailDataUrl } from "@/lib/image-optimizer";
import { useApp } from "./app-provider";

const deliveryChoices = ["Cash on delivery", "After full payment", "Global delivery", "Free delivery"];
type ManagedArtwork = Artwork & { deliveryOptions: string[]; deliveryCharge: number };

export function ArtManager() {
  const { user, accountRole } = useApp();
  const [artworks, setArtworks] = useState<ManagedArtwork[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ManagedArtwork | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [thumbnail, setThumbnail] = useState("");
  const [imageMessage, setImageMessage] = useState("");

  const load = useCallback(async () => {
    if (!firestore || !user) return setArtworks([]);
    const snapshot = await getDocs(query(collection(firestore, "artworks"), where("artistId", "==", user.uid), limit(50)));
    setArtworks(snapshot.docs.map((item) => {
      const data = item.data();
      const options = Array.isArray(data.deliveryOptions) ? data.deliveryOptions.map(String).filter((option) => deliveryChoices.includes(option)) : [];
      return {
        id: item.id,
        name: String(data.name),
        artist: String(data.artistName),
        artistId: String(data.artistId),
        category: String(data.category),
        price: Number(data.price),
        size: String(data.size),
        medium: String(data.medium),
        materials: String(data.materials),
        rating: Number(data.rating ?? 0),
        reviews: Number(data.reviewCount ?? 0),
        delivery: String(data.deliveryLabel),
        deliveryOptions: options.length ? options : ["After full payment"],
        deliveryCharge: Number(data.deliveryCharge ?? 0),
        description: String(data.description),
        tone: "ocean",
        note: String(data.note ?? ""),
        imageUrls: data.thumbnailDataUrl ? [String(data.thumbnailDataUrl)] : [],
      };
    }));
  }, [user]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function startCreate() {
    setEditing(null);
    setSent(false);
    setImages([]);
    setThumbnail("");
    setImageMessage("");
    setError("");
    setOpen(true);
  }

  function startEdit(artwork: ManagedArtwork) {
    setEditing(artwork);
    setSent(false);
    setImages([]);
    setThumbnail("");
    setImageMessage("");
    setError("");
    setOpen(true);
  }

  async function prepareImage(index: number, file?: File) {
    if (!file) return;
    setImageMessage("Optimizing image…");
    setError("");
    try {
      const value = await optimizeArtworkDataUrl(file);
      if (index === 0) setThumbnail(await optimizeThumbnailDataUrl(file));
      setImages((current) => {
        const next = [...current];
        next[index] = value;
        return next;
      });
      setImageMessage(`Image ${index + 1} optimized for Firebase.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image could not be processed.");
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!user || accountRole !== "artist") return setError("Approved artist access is required.");
    const imageCount = images.filter(Boolean).length;
    if ((!editing && imageCount !== 3) || (editing && imageCount > 0 && imageCount !== 3)) {
      return setError(editing ? "Choose all three images to replace the current gallery." : "Please choose all three artwork images.");
    }

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
      if (imageCount === 3) Object.assign(payload, { images, thumbnail });
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
    if (!user || !confirm("Delete this artwork permanently?")) return;
    const response = await fetch(`/api/artist/artworks?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${await user.getIdToken()}` },
    });
    if (response.ok) await load();
    else setError("Artwork could not be deleted.");
  }

  if (accountRole !== "artist") return <div className="empty-state"><h2>Artist approval required</h2><p>Submit your artist request from the About Us page. Approved access appears on this same Google account.</p></div>;

  return <>
    <div className="manager-bar"><div><strong>{artworks.length}</strong><span>live artwork listings</span></div><button className="button primary" onClick={startCreate}>+ Add new artwork</button></div>
    {error && !open && <p className="admin-error">{error}</p>}
    {artworks.length ? <div className="art-grid manage-grid">{artworks.map((art) => <div className="managed-card" key={art.id}><ArtCard art={art} compact/><div className="managed-actions"><button onClick={() => startEdit(art)}><EditIcon size={16}/> Edit listing</button><button className="danger-action" onClick={() => void remove(art.id)}>Delete</button></div></div>)}</div> : <div className="empty-state"><h2>No artwork listed yet.</h2><p>Your first published artwork will appear here and in Explore Arts.</p></div>}
    {open && <div className="modal-backdrop form-backdrop"><section className="art-form-modal"><button className="icon-button modal-close" onClick={() => setOpen(false)} aria-label="Close artwork form"><XIcon/></button>
      {sent ? <div className="success-state"><span><CheckIcon size={32}/></span><h2>{editing ? "Your artwork is updated." : "Your artwork is live."}</h2><p>The latest listing is now available in Explore Arts.</p><button className="button primary" onClick={() => setOpen(false)}>Back to my arts</button></div>
        : <><p className="eyebrow">{editing ? "EDIT LISTING" : "NEW LISTING"}</p><h2>{editing ? "Update original artwork" : "Add original artwork"}</h2><p className="muted">{editing ? "Leave image fields empty to keep the current gallery, or replace all three." : "Images are converted to WebP below 100 KB. Choose files below 1 MB."}</p>
          <form key={editing?.id ?? "new"} className="art-form" onSubmit={submit}>
            <div className="image-upload-row">{["Main image", "Detail image", "Framed / scale image"].map((label, index) => <label key={label}><CameraIcon/><span>{images[index] ? "Ready ✓" : label}</span><small>{editing ? "Optional · replace all 3" : "Max 1 MB"}</small><input required={!editing} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void prepareImage(index, event.target.files?.[0])}/></label>)}</div>
            {imageMessage && <p className="image-status">{imageMessage}</p>}
            <div className="form-grid">
              <label className="full">Artwork name<input name="name" required defaultValue={editing?.name}/></label>
              <label>Category<select name="category" required defaultValue={editing?.category ?? "Canvas Art"}><option>Canvas Art</option><option>Watercolour</option><option>Colour Pencil</option><option>Pencil Art</option><option>Graphic Art</option><option>Digital Art</option></select></label>
              <label>Size<input name="size" required placeholder="e.g. 60 × 45 cm" defaultValue={editing?.size}/></label>
              <label>Medium<input name="medium" required placeholder="e.g. Acrylic on canvas" defaultValue={editing?.medium}/></label>
              <label>Materials<input name="materials" required defaultValue={editing?.materials}/></label>
              <label className="full">Description<textarea name="description" required rows={4} defaultValue={editing?.description}/></label>
              <fieldset className="full"><legend>Delivery options</legend>{deliveryChoices.map((option) => <label key={option}><input name="deliveryOptions" value={option} type="checkbox" defaultChecked={editing?.deliveryOptions.includes(option)}/> {option}</label>)}</fieldset>
              <label>Artwork price (LKR)<input name="price" required type="number" min="1" max="100000000" defaultValue={editing?.price}/></label>
              <label>Delivery charge (LKR)<input name="deliveryCharge" type="number" min="0" max="10000000" defaultValue={editing?.deliveryCharge}/></label>
              <label className="full">Special note<textarea name="note" rows={2} defaultValue={editing?.note}/></label>
              {error && <p className="admin-error full">{error}</p>}
              <button className="button primary full" disabled={busy} type="submit">{busy ? "Saving…" : editing ? "Save artwork changes" : "Publish artwork"}</button>
            </div>
          </form></>}
    </section></div>}
  </>;
}
