import { describe, expect, it } from "vitest";
import { isValidUsername, normalizeUsername, parseUsername } from "@/lib/username";

describe("normalizeUsername", () => {
  it("baixa a caixa e apara os espaços", () => {
    expect(normalizeUsername("  Kaio-Cesar  ")).toBe("kaio-cesar");
  });
});

describe("isValidUsername", () => {
  it("aceita de 3 a 32 caracteres começando com letra", () => {
    expect(isValidUsername("ana")).toBe(true);
    expect(isValidUsername("a".repeat(32))).toBe(true);
    expect(isValidUsername("ana-maria-2")).toBe(true);
  });

  it("recusa curto demais, longo demais e início fora de letra", () => {
    expect(isValidUsername("an")).toBe(false);
    expect(isValidUsername("a".repeat(33))).toBe(false);
    expect(isValidUsername("1ana")).toBe(false);
    expect(isValidUsername("-ana")).toBe(false);
  });

  it("recusa caracteres fora de letras minúsculas, números e hífen", () => {
    expect(isValidUsername("ana maria")).toBe(false);
    expect(isValidUsername("ana_maria")).toBe(false);
    expect(isValidUsername("ana.maria")).toBe(false);
    expect(isValidUsername("joão")).toBe(false);
    expect(isValidUsername("Ana")).toBe(false);
  });
});

describe("parseUsername", () => {
  it("normaliza antes de validar", () => {
    expect(parseUsername(" ANA-Maria ")).toEqual({ username: "ana-maria" });
  });

  it("devolve erro no formato inválido", () => {
    expect(parseUsername("an").error).toBeTruthy();
    expect(parseUsername("ana maria").error).toBeTruthy();
  });
});
