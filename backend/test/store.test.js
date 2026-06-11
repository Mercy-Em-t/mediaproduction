const test = require('node:test');
const assert = require('node:assert/strict');
const os = require('node:os');
const path = require('node:path');
const fs = require('node:fs');
const { randomUUID } = require('node:crypto');
const { MediaProductionStore } = require('../src/store');

function createStore() {
  const root = path.join(os.tmpdir(), `mediaproduction-${randomUUID()}`);
  return new MediaProductionStore(root);
}

test('project manager can create isolated projects and members cannot cross access', () => {
  const store = createStore();

  const a = store.createProject('A', 'manager-a');
  const b = store.createProject('B', 'manager-b');

  assert.equal(fs.existsSync(path.join(store.storageRoot, a.id)), true);
  assert.equal(fs.existsSync(path.join(store.storageRoot, b.id)), true);

  store.addMember(a.id, 'manager-a', 'viewer-a', 'viewer');
  assert.deepEqual(store.listFiles(a.id, 'viewer-a'), []);

  assert.throws(() => store.listFiles(b.id, 'viewer-a'), /Not authorized/);
});

test('uploaded file is tracked with version stages and preview capability', () => {
  const store = createStore();
  const project = store.createProject('Shoot', 'manager');

  store.addMember(project.id, 'manager', 'contrib', 'contributor');

  const file = store.registerFileUpload(project.id, 'contrib', {
    versionStage: 'edited',
    originalName: 'clip.mp4',
    mimeType: 'video/mp4',
    extension: '.mp4',
    storedName: '123-clip.mp4',
    storagePath: '/tmp/123-clip.mp4'
  });

  assert.equal(file.versionStage, 'edited');
  assert.equal(file.previewAvailable, true);
});

test('scene director can create scenes but not tasks', () => {
  const store = createStore();
  const project = store.createProject('Film', 'manager');

  store.addMember(project.id, 'manager', 'director', 'scene_director');

  const scene = store.createScene(project.id, 'director', 'Intro', 'Opening shot');
  assert.equal(scene.title, 'Intro');

  assert.throws(
    () => store.createTask(project.id, 'director', { title: 'Edit cut' }),
    /Only project managers/
  );
});

test('task expiry must be an ISO-8601 timestamp when provided', () => {
  const store = createStore();
  const project = store.createProject('Timeline', 'manager');

  assert.throws(
    () => store.createTask(project.id, 'manager', { title: 'Render', expiresAt: 'soon' }),
    /expiresAt must be an ISO-8601 timestamp/
  );
});
