import type { Artwork } from "./data";
import { firebaseConfig, isFirebaseConfigured } from "./firebase-config";

type FirestoreValue = { stringValue?: string; integerValue?: string; doubleValue?: number; booleanValue?: boolean; timestampValue?: string; arrayValue?: { values?: FirestoreValue[] }; mapValue?: { fields?: Record<string, FirestoreValue> } };
type FirestoreDocument = { name: string; fields?: Record<string, FirestoreValue> };

function decode(value?: FirestoreValue): unknown {
  if (!value) return undefined;
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.integerValue !== undefined) return Number(value.integerValue);
  if (value.doubleValue !== undefined) return value.doubleValue;
  if (value.booleanValue !== undefined) return value.booleanValue;
  if (value.timestampValue !== undefined) return value.timestampValue;
  if (value.arrayValue) return (value.arrayValue.values ?? []).map(decode);
  if (value.mapValue) return Object.fromEntries(Object.entries(value.mapValue.fields ?? {}).map(([key, item]) => [key, decode(item)]));
}

export function artworkFromDocument(document: FirestoreDocument): Artwork {
  const fields = Object.fromEntries(Object.entries(document.fields ?? {}).map(([key, value]) => [key, decode(value)]));
  const thumbnail = String(fields.thumbnailDataUrl ?? "");
  return {
    id: document.name.split("/").at(-1) ?? crypto.randomUUID(), name: String(fields.name ?? "Untitled artwork"),
    artist: String(fields.artistName ?? "Atnurmi Artist"), artistId: String(fields.artistId ?? ""),
    category: String(fields.category ?? "Original Art"), price: Number(fields.price ?? 0), size: String(fields.size ?? "Size on request"),
    medium: String(fields.medium ?? "Mixed media"), materials: String(fields.materials ?? "Artist materials"),
    rating: Number(fields.rating ?? 0), reviews: Number(fields.reviewCount ?? 0), delivery: String(fields.deliveryLabel ?? "Delivery available"),
    description: String(fields.description ?? ""), tone: "ocean", note: fields.note ? String(fields.note) : undefined,
    imageUrls: thumbnail ? [thumbnail] : [],
  };
}

const baseUrl = () => `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;

export async function listPublishedArtworks(): Promise<Artwork[]> {
  if (!isFirebaseConfigured) return [];
  const response = await fetch(`${baseUrl()}:runQuery`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ structuredQuery: {
    from: [{ collectionId: "artworks" }], where: { fieldFilter: { field: { fieldPath: "status" }, op: "EQUAL", value: { stringValue: "published" } } },
    orderBy: [{ field: { fieldPath: "createdAt" }, direction: "DESCENDING" }], limit: 20,
  } }) });
  if (!response.ok) throw new Error(`Firestore artwork query failed (${response.status}).`);
  const rows = await response.json() as { document?: FirestoreDocument }[];
  return rows.flatMap((row) => row.document ? [artworkFromDocument(row.document)] : []);
}
