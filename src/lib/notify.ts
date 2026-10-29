export function chatAlertEnvironmentLabel(
  vercelEnv: string | undefined,
): "produção" | "preview" | "local" {
  if (vercelEnv === "production") return "produção";
  if (vercelEnv === "preview") return "preview";
  return "local";
}

export type StockAlertKind = "low" | "empty" | "restocked";

export function stockAlertKind(
  previous: number,
  next: number,
): StockAlertKind | null {
  if (next === 1 && previous > 1) return "low";
  if (next === 0 && previous > 0) return "empty";
  if (previous <= 1 && next > previous) return "restocked";
  return null;
}

export function formatUnitLabel(quantity: number, unitLabel: string): string {
  return quantity === 1 ? unitLabel : `${unitLabel}s`;
}

export function normalizeAppUrl(
  url: string | undefined | null,
): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;
  return trimmed.replace(/\/+$/, "");
}

function nextPersonLine(nextPerson: string | null): string {
  return nextPerson
    ? `Próximo da vez: *${nextPerson}*`
    : "Próximo da vez: ninguém na fila";
}

function withOptionalAppUrl(body: string, appUrl: string | null): string {
  return appUrl ? `${body}\n${appUrl}` : body;
}

export function buildStockAlertMessage(input: {
  kind: StockAlertKind;
  itemName: string;
  newStock: number;
  unitLabel: string;
  nextPerson: string | null;
  appUrl: string | null;
}): string {
  const { kind, itemName, newStock, unitLabel, nextPerson, appUrl } = input;

  if (kind === "low") {
    return withOptionalAppUrl(
      `⚠️ Estoque baixo: *${itemName}* (1 ${unitLabel})\n${nextPersonLine(nextPerson)}`,
      appUrl,
    );
  }

  if (kind === "empty") {
    return withOptionalAppUrl(
      `⚠️ Acabou: *${itemName}*\n${nextPersonLine(nextPerson)}`,
      appUrl,
    );
  }

  return withOptionalAppUrl(
    `*${itemName}*: estoque agora é ${newStock} ${formatUnitLabel(newStock, unitLabel)}`,
    appUrl,
  );
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

async function postChatMessage(message: string): Promise<{ error?: string }> {
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

export async function notifyStockAlert(message: string): Promise<void> {
  await postChatMessage(message);
}

export async function notifyLowStock(
  message: string,
): Promise<{ error?: string }> {
  return postChatMessage(message);
}
