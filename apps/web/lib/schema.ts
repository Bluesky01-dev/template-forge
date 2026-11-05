import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Mirrors migrations/0001_init.sql
export const analyses = sqliteTable("analyses", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  profile: text("profile").notNull(),
  brandInput: text("brand_input").notNull(),
  palette: text("palette").notNull(),
  ranked: text("ranked").notNull(),
  notes: text("notes"),
  createdAt: integer("created_at").notNull(),
});

export const projects = sqliteTable("projects", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clientUrl: text("client_url"),
  templateId: text("template_id").notNull(),
  analysisId: text("analysis_id"),
  doc: text("doc").notNull(),
  publishedSlug: text("published_slug").unique(),
  publishedDoc: text("published_doc"),
  publishedAt: integer("published_at"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export const versions = sqliteTable(
  "versions",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    doc: text("doc").notNull(),
    ops: text("ops"),
    summary: text("summary").notNull(),
    source: text("source").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("versions_project").on(t.projectId, t.createdAt)],
);

export const messages = sqliteTable(
  "messages",
  {
    id: text("id").primaryKey(),
    projectId: text("project_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    versionId: text("version_id"),
    meta: text("meta"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("messages_project").on(t.projectId, t.createdAt)],
);
