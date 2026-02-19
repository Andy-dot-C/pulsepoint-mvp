import Link from "next/link";
import { SearchTypeaheadPreview } from "@/components/search-typeahead-preview";

export default function SearchTypeaheadPreviewPage() {
  return (
    <>
      <main className="page-shell">
        <Link href="/" className="back-link">
          Back to feed
        </Link>
      </main>
      <SearchTypeaheadPreview />
    </>
  );
}
