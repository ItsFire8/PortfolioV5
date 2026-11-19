import { StatusPage } from "@/components/status-page";

export default function NotFound() {
  return <StatusPage icon="404" title="Seite nicht gefunden · Page not found" text="Die angeforderte Seite existiert nicht. · The requested page does not exist." footer={<a href="/" className="text-sm text-primary hover:underline">← Home</a>} />;
}
