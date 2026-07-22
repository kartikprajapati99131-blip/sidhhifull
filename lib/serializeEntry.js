// lib/serializeEntry.js
//
// Converts a Mongoose Entry document into a plain object for the client.
// This is the single place responsible for exposing `tags` (on the entry
// AND on each history item) and every other field — if a field is missing
// here, it will silently never reach the popup no matter what the API
// route or the schema does. If you already have a serializeEntry.js,
// diff it against this one and make sure `tags` is included in both
// places marked below.

function serializeActor(actor) {
  if (!actor) return null;
  return {
    id: actor.id,
    name: actor.name,
    role: actor.role,
  };
}

function serializeHistoryItem(h) {
  return {
    id: h._id ? h._id.toString() : h.id,
    type: h.type,
    text: h.text || "",
    tags: h.tags || [], // ← Sittos/Magnus/CPL picked on this specific action
    by: serializeActor(h.by),
    at: h.at ? new Date(h.at).toISOString() : null,
  };
}

export function serializeEntry(doc) {
  const e = typeof doc.toObject === "function" ? doc.toObject() : doc;

  return {
    id: e._id ? e._id.toString() : e.id,
    type: e.type,

    mobile1: e.mobile1 || "",
    mobile2: e.mobile2 || "",
    name: e.name || "",

    siteAddress: e.siteAddress || "",
    permanentAddress: e.permanentAddress || "",
    profession: e.profession || "",
    mistryName: e.mistryName || "",
    mistryNumber: e.mistryNumber || "",
    architectName: e.architectName || "",
    architectNumber: e.architectNumber || "",

    nextMeetingDate: e.nextMeetingDate || "",
    status: e.status,

    tags: e.tags || [], // ← cumulative Sittos/Magnus/CPL tags for this entry

    createdBy: serializeActor(e.createdBy),
    createdAt: e.createdAt ? new Date(e.createdAt).toISOString() : null,
    updatedAt: e.updatedAt ? new Date(e.updatedAt).toISOString() : null,

    history: Array.isArray(e.history) ? e.history.map(serializeHistoryItem) : [],
  };
}