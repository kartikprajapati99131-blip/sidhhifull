// lib/serializeEntry.js
//
// Converts a Mongoose Entry document into a plain JSON-safe object for API
// responses. Keeps the shape stable regardless of whether the doc came from
// .find() (Mongoose document), .lean() (plain object), or was just created.
export function serializeEntry(doc) {
  const obj = typeof doc.toObject === "function" ? doc.toObject() : doc;

  return {
    id: String(obj._id),
    type: obj.type,
    mobile1: obj.mobile1 || "",
    mobile2: obj.mobile2 || "",
    name: obj.name || "",
    siteAddress: obj.siteAddress || "",
    permanentAddress: obj.permanentAddress || "",
    profession: obj.profession || "",
    mistryName: obj.mistryName || "",
    mistryNumber: obj.mistryNumber || "",
    architectName: obj.architectName || "",
    architectNumber: obj.architectNumber || "",
    nextMeetingDate: obj.nextMeetingDate || "",
    status: obj.status,
    createdBy: obj.createdBy,
    history: (obj.history || []).map((h) => ({
      id: String(h._id),
      type: h.type,
      text: h.text || "",
      by: h.by,
      at: h.at,
    })),
    createdAt: obj.createdAt,
    updatedAt: obj.updatedAt,
  };
}
