import ArchiveManager from "@/components/admin/ArchiveManager";
import { getArchive } from "@/lib/data";

export default async function AdminArchive() {
  return <ArchiveManager items={await getArchive()} />;
}
