import { useTranslation } from "react-i18next";
import { Inbox } from "lucide-react";

import { EmptyState } from "@/components/ui";
import { PageHeader } from "@/shell/Shell";

export default function PlaceholderPage({ title, description }: {
  title: string;
  description?: string;
}) {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={title} />
      <EmptyState
        icon={<Inbox size={22} />}
        title={t("errors.comingSoon", { title })}
        description={description ?? t("errors.comingSoonDescription")}
      />
    </div>
  );
}
