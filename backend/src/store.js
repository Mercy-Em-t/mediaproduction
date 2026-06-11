const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const VERSION_STAGES = new Set(['raw', 'edited', 'final']);
const PREVIEW_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'audio/mpeg',
  'audio/wav'
]);

class MediaProductionStore {
  constructor(storageRoot) {
    this.storageRoot = storageRoot;
    this.projects = new Map();
  }

  createProject(name, managerUserId) {
    const id = randomUUID();
    const now = new Date().toISOString();

    const project = {
      id,
      name,
      createdAt: now,
      members: new Map([[managerUserId, 'project_manager']]),
      scenes: [],
      tasks: [],
      files: []
    };

    this.projects.set(id, project);
    fs.mkdirSync(path.join(this.storageRoot, id), { recursive: true });

    return { id, name, createdAt: now };
  }

  getProject(projectId) {
    return this.projects.get(projectId);
  }

  requireProject(projectId) {
    const project = this.getProject(projectId);
    if (!project) {
      throw new Error('Project not found');
    }
    return project;
  }

  hasRole(projectId, userId, allowedRoles) {
    const project = this.requireProject(projectId);
    const userRole = project.members.get(userId);
    return Boolean(userRole && allowedRoles.includes(userRole));
  }

  addMember(projectId, actorId, userId, role) {
    const project = this.requireProject(projectId);
    const actorRole = project.members.get(actorId);
    if (actorRole !== 'project_manager') {
      throw new Error('Only project managers can add members');
    }

    project.members.set(userId, role);
    return { userId, role };
  }

  createScene(projectId, actorId, title, outline) {
    const project = this.requireProject(projectId);
    if (!this.hasRole(projectId, actorId, ['project_manager', 'scene_director'])) {
      throw new Error('Not authorized to create scenes');
    }

    const scene = {
      id: randomUUID(),
      title,
      outline,
      createdBy: actorId,
      createdAt: new Date().toISOString()
    };
    project.scenes.push(scene);
    return scene;
  }

  createTask(projectId, actorId, payload) {
    const project = this.requireProject(projectId);
    if (!this.hasRole(projectId, actorId, ['project_manager'])) {
      throw new Error('Only project managers can create tasks');
    }

    const task = {
      id: randomUUID(),
      title: payload.title,
      assignee: payload.assignee,
      deadline: payload.deadline,
      jobExpiresAt: payload.jobExpiresAt ?? payload.expiresAt,
      createdAt: new Date().toISOString()
    };

    project.tasks.push(task);
    return task;
  }

  registerFileUpload(projectId, actorId, input) {
    const project = this.requireProject(projectId);
    if (!this.hasRole(projectId, actorId, ['project_manager', 'scene_director', 'contributor'])) {
      throw new Error('Not authorized to upload files');
    }

    if (!VERSION_STAGES.has(input.versionStage)) {
      throw new Error('Invalid version stage');
    }

    const file = {
      id: randomUUID(),
      projectId,
      uploadedBy: actorId,
      versionStage: input.versionStage,
      originalName: input.originalName,
      mimeType: input.mimeType,
      extension: input.extension,
      storedName: input.storedName,
      storagePath: input.storagePath,
      uploadedAt: new Date().toISOString(),
      previewAvailable: PREVIEW_MIME_TYPES.has(input.mimeType)
    };

    project.files.push(file);
    return file;
  }

  listFiles(projectId, actorId) {
    const project = this.requireProject(projectId);
    if (!this.hasRole(projectId, actorId, ['project_manager', 'scene_director', 'contributor', 'viewer'])) {
      throw new Error('Not authorized to view files');
    }
    return project.files;
  }

  getFile(projectId, actorId, fileId) {
    const project = this.requireProject(projectId);
    if (!this.hasRole(projectId, actorId, ['project_manager', 'scene_director', 'contributor', 'viewer'])) {
      throw new Error('Not authorized to view files');
    }

    const file = project.files.find((entry) => entry.id === fileId);
    if (!file) {
      throw new Error('File not found');
    }

    return file;
  }
}

module.exports = {
  MediaProductionStore,
  VERSION_STAGES,
  PREVIEW_MIME_TYPES
};
