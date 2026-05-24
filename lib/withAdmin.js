import { requireAdmin } from "./auth";

export function withAdmin(handler) {
  return async (req) => {
    try {
      await requireAdmin();
      return await handler(req);

    } catch (err) {
      if (err.message === "UNAUTHORIZED") {
        return Response.json({ success: false }, { status: 401 });
      }

      if (err.message === "FORBIDDEN") {
        return Response.json({ success: false }, { status: 403 });
      }

      return Response.json({ success: false }, { status: 500 });
    }
  };
}