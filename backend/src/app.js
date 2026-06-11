const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const express = require('express');
const multer = require('multer');
const rateLimit = require('express-rate-limit');
const { MediaProductionStore, VERSION_STAGES, PREVIEW_MIME_TYPES } = require('./store');

const STORAGE_ROOT = path.resolve(__dirname, '..', 'storage');
fs.mkdirSync(STORAGE_ROOT, { recursive: true });

const store = new MediaProductionStore(STORAGE_ROOT);
const MAX_FILE_SIZE_BYTES = 1 * 1024 * 1024 * 1024;
const MAX_FILES_PER_UPLOAD = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 60;
const AUTH_HMAC_SECRET = process.env.AUTH_HMAC_SECRET;
if (!AUTH_HMAC_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('AUTH_HMAC_SECRET is required in production');
}
if (!AUTH_HMAC_SECRET && process.env.NODE_ENV !== 'production') {
  console.warn('AUTH_HMAC_SECRET is not set; using development default');
}
const AUTH_HMAC_SECRET_EFFECTIVE = AUTH_HMAC_SECRET || 'dev-only-change-me';
const FILE_ACCESS_RATE_LIMITER = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS,
  standardHeaders: true,
  legacyHeaders: false
});

const app = express();
app.use(express.json());

const sanitize = (value) => String(value).replace(/[^a-zA-Z0-9_-]/g, '_');

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const projectId = req.params.projectId;
      const stage = req.body.versionStage;
      if (!VERSION_STAGES.has(stage)) {
        cb(new Error('Invalid version stage'));
        return;
      }

      const destination = path.join(STORAGE_ROOT, sanitize(projectId), stage);
      fs.mkdirSync(destination, { recursive: true });
      cb(null, destination);
    },
    filename(req, file, cb) {
      const timestamp = Date.now();
      cb(null, `${timestamp}-${sanitize(file.originalname)}`);
    }
  }),
  fileFilter(req, file, cb) {
    const allowedTopLevelTypes = new Set(['image', 'video', 'audio', 'model']);
    const allowedMimeTypes = new Set([
      'application/zip',
      'application/x-zip-compressed',
      'application/octet-stream',
      'model/gltf-binary',
      'model/gltf+json'
    ]);
    const topLevelType = file.mimetype.split('/')[0];

    if (allowedTopLevelTypes.has(topLevelType) || allowedMimeTypes.has(file.mimetype)) {
      cb(null, true);
      return;
    }

    cb(new Error('Unsupported file type'));
  },
  limits: { files: MAX_FILES_PER_UPLOAD, fileSize: MAX_FILE_SIZE_BYTES }
});

function getActor(req) {
  const actorId = req.header('x-user-id');
  const actorSignature = req.header('x-user-signature');
  if (!actorId) {
    throw new Error('x-user-id header is required');
  }
  if (!actorSignature) {
    throw new Error('x-user-signature header is required');
  }

  const expected = crypto
    .createHmac('sha256', AUTH_HMAC_SECRET_EFFECTIVE)
    .update(actorId)
    .digest('hex');
  const actualBuffer = Buffer.from(actorSignature, 'hex');
  const expectedBuffer = Buffer.from(expected, 'hex');
  if (
    actualBuffer.length !== expectedBuffer.length ||
    !crypto.timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    throw new Error('Invalid user signature');
  }
  return actorId;
}

app.post('/api/projects', (req, res) => {
  try {
    const actorId = getActor(req);
    const project = store.createProject(req.body.name, actorId);
    res.status(201).json(project);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/members', (req, res) => {
  try {
    const actorId = getActor(req);
    const member = store.addMember(req.params.projectId, actorId, req.body.userId, req.body.role);
    res.status(201).json(member);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/scenes', (req, res) => {
  try {
    const actorId = getActor(req);
    const scene = store.createScene(req.params.projectId, actorId, req.body.title, req.body.outline);
    res.status(201).json(scene);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/tasks', (req, res) => {
  try {
    const actorId = getActor(req);
    const task = store.createTask(req.params.projectId, actorId, req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.post('/api/projects/:projectId/files/upload', upload.array('files', MAX_FILES_PER_UPLOAD), (req, res) => {
  try {
    const actorId = getActor(req);
    const files = req.files.map((file) => {
      const extension = path.extname(file.originalname).toLowerCase();
      return store.registerFileUpload(req.params.projectId, actorId, {
        versionStage: req.body.versionStage,
        originalName: file.originalname,
        mimeType: file.mimetype,
        extension,
        storedName: file.filename,
        storagePath: file.path
      });
    });

    res.status(201).json({ files });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId/files', FILE_ACCESS_RATE_LIMITER, (req, res) => {
  try {
    const actorId = getActor(req);
    const files = store.listFiles(req.params.projectId, actorId);
    res.json({ files });
  } catch (error) {
    res.status(403).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId/files/:fileId/download', FILE_ACCESS_RATE_LIMITER, (req, res) => {
  try {
    const actorId = getActor(req);
    const file = store.getFile(req.params.projectId, actorId, req.params.fileId);
    res.download(file.storagePath, file.originalName);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.get('/api/projects/:projectId/files/:fileId/preview', FILE_ACCESS_RATE_LIMITER, (req, res) => {
  try {
    const actorId = getActor(req);
    const file = store.getFile(req.params.projectId, actorId, req.params.fileId);

    if (!PREVIEW_MIME_TYPES.has(file.mimeType)) {
      res.status(415).json({ error: 'Preview is not available for this file type' });
      return;
    }

    res.type(file.mimeType);
    res.sendFile(path.resolve(file.storagePath));
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

app.use((error, req, res, next) => {
  if (error) {
    const status = error.statusCode || error.status || 400;
    const message = status >= 500 ? 'Internal server error' : error.message;
    res.status(status).json({ error: message });
    return;
  }
  next();
});

module.exports = { app, store, STORAGE_ROOT };
