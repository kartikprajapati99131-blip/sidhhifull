// lib/serializeEntry.js

// Converts a Mongoose Entry document into a plain object with string ids,
// matching exactly what the frontend page.jsx already expects.
export function serializeEntry(doc) {
  const obj = doc.toObject ? doc.toObject() : doc;
  return {
    id: obj._id.toString(),
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
    createdAt: obj.createdAt,
    history: (obj.history || []).map((h) => ({
      id: h._id.toString(),
      type: h.type,
      text: h.text || "",
      by: h.by,
      at: h.at,
    })),
  };
}