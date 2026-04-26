import { NotebooksView } from "@/components/notebooks-view";
import { notebooks } from "@/lib/content";

export default async function NotebooksPage() {
  return <NotebooksView notebooks={notebooks} />;
}
