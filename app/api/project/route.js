import connectDb from "@/db/connectDb";
import Project from "@/models/project";


// ➕ CREATE PROJECT
export async function POST(req) {
    try {
        await connectDb();

        const body = await req.json();

        if (!body.title) {
            return Response.json({ error: "Title is required" }, { status: 400 });
        }

        const project = await Project.create(body);

        return Response.json({ success: true, project });

    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}


// 📋 GET ALL PROJECTS
export async function GET() {
    try {
        await connectDb();

        const projects = await Project.find().sort({ createdAt: -1 });

        return Response.json({ success: true, projects });

    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// ❌ DELETE — bulk delete by ids[] OR all projects in a category
// Body: { ids: ["id1","id2"] }  OR  { category: "Kitchen" }
export async function DELETE(req) {
    try {
        await connectDb();

        const body = await req.json().catch(() => ({}));

        if (Array.isArray(body.ids) && body.ids.length > 0) {
            // Delete specific projects by ID array
            const result = await Project.deleteMany({ _id: { $in: body.ids } });
            return Response.json({ success: true, deleted: result.deletedCount });
        }

        if (body.category) {
            // Delete all projects in a category
            const result = await Project.deleteMany({ category: body.category });
            return Response.json({ success: true, deleted: result.deletedCount });
        }

        return Response.json(
            { error: "Provide ids[] or category to delete" },
            { status: 400 }
        );

    } catch (err) {
        return Response.json({ error: err.message }, { status: 500 });
    }
}

// ✏️ UPDATE PROJECT