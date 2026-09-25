import { beforeEach, vi } from "vitest";
import { loadTestDatabaseUrl } from "./resolve-test-database-url";

process.env.DATABASE_URL = loadTestDatabaseUrl();
process.env.AUTH_PEPPER = "pepper-da-suite";
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

vi.mock("next/headers", async () => {
  const { cookieJar } = await import("./cookie-jar");
  return {
    cookies: async () => cookieJar(),
  };
});

vi.mock("@/lib/clock", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/clock")>();
  const { testNow } = await import("./clock");
  return {
    ...actual,
    now: testNow,
  };
});

beforeEach(async () => {
  const { resetCookies } = await import("./cookie-jar");
  const { resetClock } = await import("./clock");
  const { emptyPantry } = await import("./empty-pantry");
  resetCookies();
  resetClock();
  await emptyPantry();
  vi.clearAllMocks();
});
