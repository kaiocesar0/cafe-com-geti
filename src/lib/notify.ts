export function chatAlertEnvironmentLabel(
  vercelEnv: string | undefined,
): "produção" | "preview" | "local" {
  if (vercelEnv === "production") return "produção";
  if (vercelEnv === "preview") return "preview";
  return "local";
}

export function shouldNotifyStockCrossedOne(
  previous: number,
  next: number,
): boolean {
  return previous > 1 && next <= 1;
}

export async function notifyLowStock(
  message: string,
): Promise<{ error?: string }> {
  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!url) {
    console.warn("GOOGLE_CHAT_WEBHOOK_URL não configurada; alerta ignorado");
    return { error: "Webhook do Google Chat não configurado neste ambiente" };
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: message }),
    });
    if (!response.ok) {
      console.error(
        "Falha ao enviar alerta Google Chat:",
        response.status,
        await response.text(),
      );
      return { error: "Falha ao enviar o aviso ao Google Chat" };
    }
    return {};
  } catch (error) {
    console.error("Erro ao enviar alerta Google Chat:", error);
    return { error: "Falha ao enviar o aviso ao Google Chat" };
  }
}

export function buildLowStockMessage(
  itemName: string,
  newStock: number,
  nextPerson: string | null | string[],
): string {
  const names = Array.isArray(nextPerson)
    ? nextPerson
    : nextPerson
      ? [nextPerson]
      : [];

  const nextBlock =
    names.length === 0
      ? "🤑 Próximo da vez:\nninguém na fila"
      : `🤑 Próximo da vez:\n${names
          .map((name, i) => `${i + 1}º ${name}${i < names.length - 1 ? ";" : ""}`)
          .join("\n")}`;

  return `⚠️ Estoque baixo: ${itemName} (${newStock} restante)\n${nextBlock}`;
}
