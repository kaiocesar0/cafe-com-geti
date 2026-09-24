import { expect, it } from "vitest";
import { getDb } from "@/db";
import { sessions } from "@/db/schema";
import { emptyPantry } from "@/test/empty-pantry";
import { hire } from "@/test/fixtures";

it("esvazia também as sessões", async () => {
  const maria = await hire({ name: "Maria", preference: "coffee" });
  await getDb().insert(sessions).values({
    employeeId: maria.id,
    tokenHash: "token-de-teste",
    expiresAt: new Date("2030-01-01T00:00:00Z"),
  });

  await emptyPantry();

  expect(await getDb().select().from(sessions)).toEqual([]);
});
