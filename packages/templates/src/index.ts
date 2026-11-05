import { SiteDoc, TemplateManifest, type SiteDoc as SiteDocT } from "@tf/schema";
import * as aurora from "./aurora";
import * as noir from "./noir";
import * as harvest from "./harvest";

export interface LibraryTemplate {
  manifest: TemplateManifest;
  doc: SiteDocT;
}

/** All library templates, validated at import time so a bad template fails the build. */
export const templates: LibraryTemplate[] = [aurora, noir, harvest].map((t) => ({
  manifest: TemplateManifest.parse(t.manifest),
  doc: SiteDoc.parse(t.site),
}));

export function getTemplate(id: string): LibraryTemplate | undefined {
  return templates.find((t) => t.manifest.id === id);
}
