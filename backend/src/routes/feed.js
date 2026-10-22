import { Router } from "express";
import { ObjectId } from "mongodb";
import {
  feedPostsCol,
  likesCol,
  commentsCol,
  savedItemsCol,
  routeAlertsCol,
} from "../mongo.js";
import { findUserById } from "../usuarios.js";
import { upsertMediaBuffer } from "./media.js";

export const feedRouter = Router();

function toObjectId(id) {
  try {
    return new ObjectId(String(id));
  } catch {
    return null;
  }
}

function formatDateCl(date) {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

async function enrichPosts(docs, userId) {
  if (!docs.length) return [];
  const ids = docs.map((d) => String(d._id));

  const [userLikes, userSaves, allComments] = await Promise.all([
    userId
      ? likesCol()
          .find({ userId, targetType: "post", targetId: { $in: ids } })
          .toArray()
      : Promise.resolve([]),
    userId
      ? savedItemsCol()
          .find({ userId, targetType: "post", targetId: { $in: ids } })
          .toArray()
      : Promise.resolve([]),
    commentsCol()
      .find({ targetType: "post", targetId: { $in: ids } })
      .sort({ createdAt: 1 })
      .toArray(),
  ]);

  const likedSet = new Set(userLikes.map((l) => l.targetId));
  const savedSet = new Set(userSaves.map((s) => s.targetId));
  const commentsByPost = new Map();

  for (const c of allComments) {
    const list = commentsByPost.get(c.targetId) || [];
    list.push({
      id: String(c._id),
      author: c.authorName,
      authorAvatar: c.authorAvatar || "/api/media/slug/svg-simbolo-angachilla-app",
      text: c.text,
      date: formatDateCl(c.createdAt),
    });
    commentsByPost.set(c.targetId, list);
  }

  return docs.map((d) => {
    const id = String(d._id);
    const comments = commentsByPost.get(id) || [];
    return {
      id,
      type: d.type || "post",
      title: d.title,
      summary: d.summary || d.content || "",
      fullText: d.content || d.summary || "",
      description: d.content || d.summary || "",
      category: d.category || "comunidad",
      image: d.imageUrl || "/api/media/slug/estacion-s3-foto-1",
      imageUrl: d.imageUrl || "/api/media/slug/estacion-s3-foto-1",
      visitedPlace: d.visitedPlace || "Reserva Comunitaria Bosque Humedal Angachilla",
      stationCodigo: d.stationCodigo || "S3",
      routeSlug:
        d.routeSlug ||
        (["S5", "E8", "E9"].includes(String(d.stationCodigo || ""))
          ? "ruta-canelos"
          : "ruta-circuito"),
      tags: Array.isArray(d.tags) ? d.tags : ["Comunidad", "Humedal"],
      aspectRatio: d.aspectRatio || "tall",
      author: d.authorName || "Visitante",
      authorId: d.authorId || null,
      authorName: d.authorName || "Visitante",
      authorEmail: d.authorEmail || "",
      authorAvatar: d.authorAvatar || "/api/media/slug/svg-simbolo-angachilla-app",
      date: formatDateCl(d.createdAt),
      createdAt: d.createdAt,
      status: d.status || "aprobado",
      approved: d.status === "aprobado",
      isCommunity: true,
      likes: Number(d.likesCount ?? 0),
      likedByMe: likedSet.has(id),
      isSaved: savedSet.has(id),
      commentsCount: comments.length,
      comments,
      reviewedBy: d.reviewedBy || undefined,
      reviewedAt: d.reviewedAt ? formatDateCl(d.reviewedAt) : undefined,
      adminFeedback: d.adminFeedback || undefined,
    };
  });
}

// 1. Obtener el Feed comunitario público (sólo aprobados por el administrador)
feedRouter.get("/", async (req, res) => {
  const type = req.query.type ? String(req.query.type) : null;
  const query = { status: "aprobado" };
  if (type) query.type = type;

  const docs = await feedPostsCol().find(query).sort({ createdAt: -1 }).limit(100).toArray();
  const posts = await enrichPosts(docs, req.userId ?? null);
  res.json({ posts });
});

// 2. Obtener cola de moderación (Admin)
feedRouter.get("/moderacion", async (req, res) => {
  const user = req.userId ? await findUserById(req.userId) : null;
  if (!user || user.rol !== "admin") {
    return res.status(403).json({ error: "Se requieren permisos de administrador" });
  }

  const docs = await feedPostsCol().find({}).sort({ createdAt: -1 }).limit(200).toArray();
  const tickets = docs.map((d) => ({
    id: String(d._id),
    type: d.type === "photo_pin" ? "foto_comunidad" : d.ticketType || "aviso_novedad",
    authorId: d.authorId || null,
    authorName: d.authorName || "Visitante",
    authorEmail: d.authorEmail || "vecino@angachilla.cl",
    submittedAt: formatDateCl(d.createdAt),
    title: d.title,
    description: d.content || d.summary || "",
    locationName: d.visitedPlace || "Reserva Comunitaria Bosque Humedal Angachilla",
    imageUrl: d.imageUrl || "/api/media/slug/estacion-s3-foto-1",
    status: d.status || "pendiente",
    reviewedBy: d.reviewedBy || undefined,
    reviewedAt: d.reviewedAt ? formatDateCl(d.reviewedAt) : undefined,
    adminFeedback: d.adminFeedback || undefined,
  }));

  res.json({ tickets });
});

// 3. Obtener actividad del usuario en MongoDB (para /perfil)
feedRouter.get("/mis-datos", async (req, res) => {
  if (!req.userId) {
    return res.json({ myPosts: [], likedPosts: [], savedPosts: [] });
  }

  const user = await findUserById(req.userId);
  const [myDocs, myLikes, mySaves] = await Promise.all([
    feedPostsCol()
      .find({
        $or: [
          { authorId: req.userId },
          ...(user?.email ? [{ authorEmail: user.email }] : []),
        ],
      })
      .sort({ createdAt: -1 })
      .toArray(),
    likesCol().find({ userId: req.userId, targetType: "post" }).toArray(),
    savedItemsCol().find({ userId: req.userId, targetType: "post" }).toArray(),
  ]);

  const likedObjIds = myLikes.map((l) => toObjectId(l.targetId)).filter(Boolean);
  const savedObjIds = mySaves.map((s) => toObjectId(s.targetId)).filter(Boolean);

  const [likedDocs, savedDocs] = await Promise.all([
    likedObjIds.length
      ? feedPostsCol().find({ _id: { $in: likedObjIds }, status: "aprobado" }).toArray()
      : Promise.resolve([]),
    savedObjIds.length
      ? feedPostsCol().find({ _id: { $in: savedObjIds }, status: "aprobado" }).toArray()
      : Promise.resolve([]),
  ]);

  const [myPosts, likedPosts, savedPosts] = await Promise.all([
    enrichPosts(myDocs, req.userId),
    enrichPosts(likedDocs, req.userId),
    enrichPosts(savedDocs, req.userId),
  ]);

  res.json({ myPosts, likedPosts, savedPosts });
});

// 4. Crear nueva publicación o foto/pin en el Feed (se guarda en MongoDB y la imagen en PostgreSQL)
feedRouter.post("/", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Debes iniciar sesión para publicar en el Feed" });
  }
  const user = await findUserById(req.userId);
  if (!user) {
    return res.status(401).json({ error: "Sesión no válida" });
  }

  const b = req.body ?? {};
  const title = String(b.title || "").trim();
  const content = String(b.fullText || b.description || b.summary || "").trim();
  const summary = String(b.summary || content.slice(0, 160)).trim();
  if (!title) {
    return res.status(400).json({ error: "El título de la publicación es obligatorio" });
  }

  // Si viene imagen en DataURL, la guardamos como binario en PostgreSQL (imagen_archivo)
  let imageUrl = String(b.imageUrl || b.image || "").trim();
  if (imageUrl.startsWith("data:image/")) {
    const match = imageUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) {
      return res.status(400).json({ error: "Formato de imagen inválido" });
    }
    const buffer = Buffer.from(match[2], "base64");
    const savedMedia = await upsertMediaBuffer({
      buffer,
      mimeType: match[1] === "image/jpg" ? "image/jpeg" : match[1],
      nombreOriginal: `feed-${Date.now()}.jpg`,
      categoria: "usuario_upload",
      subidoPor: user.id,
    });
    imageUrl = `/api/media/${savedMedia.id}`;
  } else if (!imageUrl || imageUrl.includes("images.unsplash.com")) {
    imageUrl = "/api/media/slug/estacion-s3-foto-1";
  }

  const isAdmin = user.rol === "admin";
  const status = isAdmin ? "aprobado" : "pendiente";
  const now = new Date();

  const doc = {
    type: b.type === "photo_pin" ? "photo_pin" : "post",
    ticketType: b.ticketType || (b.type === "photo_pin" ? "foto_comunidad" : "aviso_novedad"),
    title,
    summary,
    content: content || summary,
    category: b.category || "comunidad",
    imageUrl,
    visitedPlace: b.visitedPlace || b.locationName || "Estación 3: Mirador Espejo del Angachilla",
    stationCodigo: b.stationCodigo || "S3",
    tags: Array.isArray(b.tags) ? b.tags : ["Comunidad", "Humedal"],
    aspectRatio: b.aspectRatio || "tall",
    authorId: user.id,
    authorName: user.nombre,
    authorEmail: user.email,
    authorAvatar: user.avatar_url || "/api/media/slug/svg-simbolo-angachilla-app",
    status,
    likesCount: 0,
    commentsCount: 0,
    reviewedBy: isAdmin ? user.nombre : null,
    reviewedAt: isAdmin ? now : null,
    createdAt: now,
  };

  const result = await feedPostsCol().insertOne(doc);
  const [enriched] = await enrichPosts([{ ...doc, _id: result.insertedId }], user.id);

  res.status(201).json({
    post: enriched,
    requiresModeration: !isAdmin,
  });
});

// 5. Dar / quitar "Me gusta" (Regla estricta: 1 Like máximo por usuario en MongoDB)
feedRouter.post("/:id/like", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Inicia sesión para dar Me gusta" });
  }
  const objId = toObjectId(req.params.id);
  if (!objId) {
    return res.status(400).json({ error: "ID de publicación inválido" });
  }
  const targetId = String(objId);

  const post = await feedPostsCol().findOne({ _id: objId });
  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  const existing = await likesCol().findOne({
    userId: req.userId,
    targetType: "post",
    targetId,
  });

  let likedByMe = false;
  let delta = 0;

  if (existing) {
    await likesCol().deleteOne({ _id: existing._id });
    likedByMe = false;
    delta = -1;
  } else {
    await likesCol().insertOne({
      userId: req.userId,
      targetType: "post",
      targetId,
      createdAt: new Date(),
    });
    likedByMe = true;
    delta = 1;
  }

  const newLikesCount = Math.max(0, Number(post.likesCount ?? 0) + delta);
  await feedPostsCol().updateOne({ _id: objId }, { $set: { likesCount: newLikesCount } });

  res.json({
    likedByMe,
    likes: newLikesCount,
  });
});

// 6. Guardar / Quitar de guardados en MongoDB
feedRouter.post("/:id/save", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Inicia sesión para guardar publicaciones" });
  }
  const objId = toObjectId(req.params.id);
  if (!objId) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const targetId = String(objId);

  const existing = await savedItemsCol().findOne({
    userId: req.userId,
    targetType: "post",
    targetId,
  });

  let isSaved = false;
  if (existing) {
    await savedItemsCol().deleteOne({ _id: existing._id });
    isSaved = false;
  } else {
    await savedItemsCol().insertOne({
      userId: req.userId,
      targetType: "post",
      targetId,
      createdAt: new Date(),
    });
    isSaved = true;
  }

  res.json({ isSaved });
});

// 7. Agregar comentario en MongoDB
feedRouter.post("/:id/comments", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Inicia sesión para comentar" });
  }
  const user = await findUserById(req.userId);
  if (!user) {
    return res.status(401).json({ error: "Sesión inválida" });
  }

  const objId = toObjectId(req.params.id);
  if (!objId) {
    return res.status(400).json({ error: "ID inválido" });
  }
  const text = String(req.body?.text ?? "").trim();
  if (!text) {
    return res.status(400).json({ error: "El comentario no puede estar vacío" });
  }

  const targetId = String(objId);
  const now = new Date();
  const commentDoc = {
    targetType: "post",
    targetId,
    userId: user.id,
    authorName: user.nombre,
    authorAvatar: user.avatar_url || "/api/media/slug/svg-simbolo-angachilla-app",
    text: text.slice(0, 500),
    createdAt: now,
  };

  const ins = await commentsCol().insertOne(commentDoc);
  const totalComments = await commentsCol().countDocuments({ targetType: "post", targetId });
  await feedPostsCol().updateOne({ _id: objId }, { $set: { commentsCount: totalComments } });

  res.status(201).json({
    comment: {
      id: String(ins.insertedId),
      author: commentDoc.authorName,
      authorAvatar: commentDoc.authorAvatar,
      text: commentDoc.text,
      date: formatDateCl(now),
    },
    commentsCount: totalComments,
  });
});

// 8. Moderar publicación (Aprobar / Rechazar por Admin)
feedRouter.patch("/:id/moderar", async (req, res) => {
  const user = req.userId ? await findUserById(req.userId) : null;
  if (!user || user.rol !== "admin") {
    return res.status(403).json({ error: "Se requieren permisos de administrador" });
  }

  const objId = toObjectId(req.params.id);
  if (!objId) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const status = req.body?.status === "rechazado" ? "rechazado" : "aprobado";
  const adminFeedback = req.body?.adminFeedback ? String(req.body.adminFeedback) : null;

  await feedPostsCol().updateOne(
    { _id: objId },
    {
      $set: {
        status,
        reviewedBy: user.nombre,
        reviewedAt: new Date(),
        adminFeedback,
      },
    }
  );

  res.json({ ok: true, status });
});

// 9. Eliminar publicación (Admin o autor)
feedRouter.delete("/:id", async (req, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "No autenticado" });
  }
  const user = await findUserById(req.userId);
  const objId = toObjectId(req.params.id);
  if (!objId) {
    return res.status(400).json({ error: "ID inválido" });
  }

  const post = await feedPostsCol().findOne({ _id: objId });
  if (!post) {
    return res.status(404).json({ error: "Publicación no encontrada" });
  }

  if (user?.rol !== "admin" && post.authorId !== req.userId) {
    return res.status(403).json({ error: "No tienes permiso para eliminar esta publicación" });
  }

  const targetId = String(objId);
  await Promise.all([
    feedPostsCol().deleteOne({ _id: objId }),
    likesCol().deleteMany({ targetType: "post", targetId }),
    commentsCol().deleteMany({ targetType: "post", targetId }),
    savedItemsCol().deleteMany({ targetType: "post", targetId }),
  ]);

  res.status(204).end();
});

// 10. Alertas en ruta sobre el mapa (MongoDB route_alerts)
feedRouter.get("/alertas-ruta", async (_req, res) => {
  const docs = await routeAlertsCol().find({}).sort({ createdAt: -1 }).limit(30).toArray();
  res.json({
    alerts: docs.map((d) => ({
      id: String(d._id),
      type: d.type || "fauna",
      title: d.title,
      description: d.description || "",
      coordinates: Array.isArray(d.coordinates) ? d.coordinates : [-39.85675, -73.23785],
      reportedBy: d.reportedBy || "Visitante",
      timeAgo: formatDateCl(d.createdAt),
    })),
  });
});

feedRouter.post("/alertas-ruta", async (req, res) => {
  const b = req.body ?? {};
  const title = String(b.title || "").trim();
  if (!title) {
    return res.status(400).json({ error: "El título del reporte es obligatorio" });
  }
  const user = req.userId ? await findUserById(req.userId) : null;
  const doc = {
    type: b.type || "fauna",
    title,
    description: String(b.description || "Reporte en ruta de la Reserva Angachilla"),
    coordinates: Array.isArray(b.coordinates) ? b.coordinates : [-39.85675, -73.23785],
    reportedBy: user?.nombre || b.reportedBy || "Visitante",
    userId: user?.id || null,
    createdAt: new Date(),
  };
  const ins = await routeAlertsCol().insertOne(doc);
  res.status(201).json({
    alert: {
      id: String(ins.insertedId),
      ...doc,
      timeAgo: "Ahora mismo",
    },
  });
});
