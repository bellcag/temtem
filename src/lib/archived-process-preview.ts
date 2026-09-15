import { lazy, type ComponentType, type LazyExoticComponent } from "react";

type GlobModule = Record<string, unknown>;

/**
 * Old Process versions live in ~/tempo-process-archive.
 * Copying a page back into src/pages (./restore.sh v8) is enough —
 * Vite picks it up here as a separate chunk, not in the v16/v17 bundle.
 */
const archivedModules = {
  ...import.meta.glob<GlobModule>("../pages/Process.tsx"),
  ...import.meta.glob<GlobModule>(
    "../pages/ProcessV{2,3,4,5,6,7,8,9,10,11,12,13,14,15}.tsx",
  ),
  ...import.meta.glob<GlobModule>("../pages/ProcessPack.tsx"),
  ...import.meta.glob<GlobModule>("../pages/ProcessIa.tsx"),
};

function routeForFile(
  file: string,
): { path: string; exportName: string } | null {
  if (file === "Process.tsx") {
    return { path: "process-v1", exportName: "ProcessPage" };
  }
  if (file === "ProcessPack.tsx") {
    return { path: "process-pack", exportName: "ProcessPackPage" };
  }
  if (file === "ProcessIa.tsx") {
    return { path: "process-ia", exportName: "ProcessIaPage" };
  }
  const match = file.match(/^ProcessV(\d+)\.tsx$/);
  if (!match) return null;
  const n = Number(match[1]);
  if (n < 2 || n > 15) return null;
  return { path: `process-v${n}`, exportName: `ProcessV${n}Page` };
}

export const archivedProcessPreviews: {
  path: string;
  Page: LazyExoticComponent<ComponentType>;
}[] = Object.entries(archivedModules).flatMap(([modPath, loader]) => {
  const file = modPath.split("/").pop() ?? "";
  const meta = routeForFile(file);
  if (!meta) return [];
  const Page = lazy(() =>
    loader().then((mod) => {
      const Comp = mod[meta.exportName] as ComponentType | undefined;
      if (!Comp) {
        throw new Error(`${file} is missing export ${meta.exportName}`);
      }
      return { default: Comp };
    }),
  );
  return [{ path: meta.path, Page }];
});
