import { beforeEach, vi } from "vitest";
import { loadTestDatabaseUrl } from "./resolve-test-database-url";

process.env.DATABASE_URL = loadTestDatabaseUrl();
delete process.env.GOOGLE_CHAT_WEBHOOK_URL;

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@/lib/notify", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/notify")>();
  return {
    ...actual,
    notifyLowStock: vi.fn(async () => {}),
  };
});

beforeEach(async () => {
  const { emptyPantry } = await import("./empty-pantry");
  await emptyPantry();
  vi.clearAllMocks();
});
