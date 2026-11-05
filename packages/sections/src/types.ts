import type { SectionOf, SectionType } from "@tf/schema";

export interface SectionComponentProps<T extends SectionType> {
  section: SectionOf<T>;
  /** tone CSS variables computed by the renderer */
  vars?: Record<string, string>;
}

export type SectionComponent<T extends SectionType> = (props: SectionComponentProps<T>) => React.ReactNode;
