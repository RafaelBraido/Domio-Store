import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Domínio Store - Celulares e Smartphones" },
      {
        name: "description",
        content:
          "Vitrine da Domínio Store: smartphones premium, intermediários e de entrada com estoque em tempo real.",
      },
      { property: "og:title", content: "Domínio Store - Celulares e Smartphones" },
      {
        property: "og:description",
        content: "Compre smartphones na Domínio Store com estoque em tempo real e checkout rápido.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  useEffect(() => {
    window.location.replace("/loja/index.html");
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="text-sm text-muted-foreground">Abrindo a Domínio Store…</p>
    </div>
  );
}
