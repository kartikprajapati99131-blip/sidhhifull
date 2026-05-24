import connectDb from "@/db/connectDb";
import Project from "@/models/project";


// 📄 GET SINGLE PROJECT
export async function GET(req, { params }) {
  try {
    await connectDb();

    const project = await Project.findById(params.id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    return Response.json({ success: true, project });

  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}


export async function PUT(req) {
  try {
    await connectDb();

    // ✅ GET ID FROM URL (SAFE METHOD)
    const url = new URL(req.url);
    const id = url.pathname.split("/").pop();
    const body = await req.json();

    const project = await Project.findById(id);

    if (!project) {
      return Response.json({ error: "Project not found" }, { status: 404 });
    }

    if (!project.images) project.images = [];

    if (body.newImage) {
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