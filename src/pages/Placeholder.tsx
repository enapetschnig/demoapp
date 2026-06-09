import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Construction } from "lucide-react";

export default function Placeholder({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <PageHeader title={title} subtitle={subtitle} />
      <Card className="flex flex-col items-center justify-center gap-3 py-20 text-center">
        <Construction className="h-10 w-10 text-muted-foreground/50" />
        <p className="text-muted-foreground">Dieses Modul wird gerade gebaut.</p>
      </Card>
    </div>
  );
}
