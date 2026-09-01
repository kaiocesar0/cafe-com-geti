export function shouldNotifyStockCrossedOne(
  previous: number,
  next: number,
): boolean {
  return previous > 1 && next <= 1;
}

export async function notifyLowStock(message: string): Promise<void> {
  const url = process.env.GOOGLE_CHAT_WEBHOOK_URL;
  if (!url) {
    console.warn("GOOGLE_CHAT_WEBHOOK_URL não configurada; alerta ignorado");
    return;
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
    }
  } catch (error) {
    console.error("Erro ao enviar alerta Google Chat:", error);
  }
}

export function buildLowStockMessage(
  itemName: string,
  newStock: number,
  nextPerson: string | null,
): string {
  const nextLine = nextPerson
    ? `Próximo da vez: *${nextPerson}*`
    : "Próximo da vez: ninguém na fila";
  return `⚠️ Estoque baixo: *${itemName}* (${newStock} restante)\n${nextLine}`;
}
