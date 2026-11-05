-- Template Forge schema
CREATE TABLE analyses (
  id TEXT PRIMARY KEY,
  url TEXT NOT NULL,
  profile TEXT NOT NULL,      -- BrandProfile JSON
  brand_input TEXT NOT NULL,  -- BrandInput JSON
  palette TEXT NOT NULL,      -- extracted palette JSON
  ranked TEXT NOT NULL,       -- RankedTemplate[] JSON
  notes TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  client_url TEXT,
  template_id TEXT NOT NULL,
  analysis_id TEXT REFERENCES analyses(id),
  doc TEXT NOT NULL,              -- current SiteDoc JSON
  published_slug TEXT UNIQUE,
  published_doc TEXT,             -- SiteDoc snapshot served at /p/:slug
  published_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  doc TEXT NOT NULL,
  ops TEXT,                       -- EditOps that produced this version
  summary TEXT NOT NULL,
  source TEXT NOT NULL,           -- build | chat | manual | restore
  created_at INTEGER NOT NULL
);
CREATE INDEX versions_project ON versions(project_id, created_at);

CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  role TEXT NOT NULL,             -- user | assistant
  content TEXT NOT NULL,
  version_id TEXT,
  meta TEXT,                      -- usage / applied ops JSON
  created_at INTEGER NOT NULL
);
CREATE INDEX messages_project ON messages(project_id, created_at);
