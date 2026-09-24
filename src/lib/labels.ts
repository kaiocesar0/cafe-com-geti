import type { EmployeeRole, ItemKind, Preference } from "@/db/schema";

export const preferenceLabels: Record<Preference, string> = {
  coffee: "Só café",
  milk: "Só leite",
  both: "Café e leite",
};

export const itemKindLabels: Record<ItemKind, string> = {
  coffee: "Café",
  milk: "Leite",
  filter: "Filtro",
};

export const roleLabels: Record<EmployeeRole, string> = {
  funcionario: "funcionário",
  admin: "admin",
  admin_geral: "admin geral",
};
