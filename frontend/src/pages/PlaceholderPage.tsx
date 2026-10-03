import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/shell/Shell";

export default function PlaceholderPage({ title, description }: {
  title: string;
  description?: string;
}) {
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={<Inbox size={22} />}
        title={`${title} — coming soon`}
        description={description ?? "This screen is being built. Check back in the next release."}
      />
    </div>
  );
}
