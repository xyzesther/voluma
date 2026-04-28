const PROJECT_PREFIX = "voluma_project_";

const  jsonError = ( status, message, extra = {} ) => {
    return new Response(JSON.stringify({ status, message, ...extra }), { status, headers:{
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        } })
}

const  getUserId = async (userPuter) =>{
    try {
        const user = await userPuter.auth.getUser();

        return user?.uuid || null;
    } catch {
        return null;
    }
}

router.post('/api/projects/save', async ({ request, user }) => {
    try {
        const userPuter = user.puter;

        if (!userPuter) return jsonError(401, "Authentication failed");

        const body = await request.json();
        const project = body?.project;
        const visibility = body?.visibility;

        if (!project?.id || !project?.sourceImage) return jsonError(400, "Project ID and source image are required");

        const payload = {
            ...project,
            isPublic: visibility === 'public',
            updatedAt: new Date().toISOString(),
        }

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const key = `${PROJECT_PREFIX}${project.id}`;
        await userPuter.kv.set(key, payload);

        return { saved: true, id: project.id, project: payload }
    } catch (error) {
        return jsonError(500, "Failed to save the project:", { message: error.message || "Unknown error"})
    }
})

router.get('/api/projects/list', async ({ user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const projects = (await userPuter.kv.list(PROJECT_PREFIX, true))
        .map(({ value }) => value)
        .filter((project) => project?.ownerId === userId || project?.isPublic === true);

        return { projects };
    } catch (error) {
        return jsonError(500, "Failed to list projects", { message: error.message || "Unknown error" });
    }
})

router.post('/api/projects/update', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const body = await request.json();
        const { id, isPublic } = body;

        if (!id) return jsonError(400, "Project ID is required");
        if (typeof isPublic !== "boolean") return jsonError(400, "isPublic must be a boolean");

        const key = `${PROJECT_PREFIX}${id}`;
        const existing = await userPuter.kv.get(key);

        if (!existing) return jsonError(404, "Project not found");
        if (existing.ownerId !== userId) return jsonError(403, "Forbidden");

        const updated = { ...existing, isPublic, updatedAt: new Date().toISOString() };
        await userPuter.kv.set(key, updated);

        return { project: updated };
    } catch (error) {
        return jsonError(500, "Failed to update the project", { message: error.message || "Unknown error" });
    }
})

router.get('/api/projects/get', async ({ request, user }) => {
    try {
        const userPuter = user.puter;
        if (!userPuter) return jsonError(401, "Authentication failed");

        const userId = await getUserId(userPuter);
        if (!userId) return jsonError(401, "Authentication failed");

        const url = new URL(request.url);
        const id = url.searchParams.get('id');

        if (!id) return jsonError(400, "Project ID is required");

        const key = `${PROJECT_PREFIX}${id}`;
        const project = await userPuter.kv.get(key);

        if (!project) return jsonError(404, "Project not found");

        return { project };
    } catch (error) {
        return jsonError(500, "Failed to fetch the project", { message: error.message || "Unknown error" });
    }
})