import connectDb from "@/db/connectDb";
import Project from "@/models/project";

// 📄 GET SINGLE PROJECT
export async function GET(req, { params }) {
  try {
    await connectDb();
    const project = await Project.findById(params.id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });
    return Response.json({ success: true, project });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ✏️ PUT — full edit (title, category, description, images)
export async function PUT(req, { params }) {
  try {
    await connectDb();

    const id = params.id;
    const body = await req.json();

    const project = await Project.findById(id);
    if (!project) return Response.json({ error: "Project not found" }, { status: 404 });

    // Update any fields that were sent
    if (body.title !== undefined)       project.title       = body.title;
    if (body.category !== undefined)    project.category    = body.category;
    if (body.description !== undefined) project.description = body.description;
    if (body.images !== undefined)      project.images      = body.images;

    // Legacy: append a single new image
    if (body.newImage) {
      if (!project.images) project.images = [];
      project.images.push(body.newImage);
    }

    await project.save();
    return Response.json({ success: true, project });
  } catch (err) {
    console.error(err);
    return Response.json({ error: err.message }, { status: 500 });
  }
}

// ❌ DELETE PROJECT
export async function DELETE(req, { params }) {
  try {
    await connectDb();
    await Project.findByIdAndDelete(params.id);
    return Response.json({ success: true });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}