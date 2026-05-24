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

// ✏️ UPDATE PROJECT
