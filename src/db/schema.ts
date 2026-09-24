import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const preferenceEnum = pgEnum("preference", ["coffee", "milk", "both"]);
export const itemKindEnum = pgEnum("item_kind", ["coffee", "milk", "filter"]);
export const employeeRoleEnum = pgEnum("employee_role", [
  "funcionario",
  "admin",
  "admin_geral",
]);

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  preference: preferenceEnum("preference").notNull(),
  active: boolean("active").notNull().default(true),
  role: employeeRoleEnum("role").notNull().default("funcionario"),
  username: text("username").unique(),
  passwordHash: text("password_hash"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  unitLabel: text("unit_label").notNull(),
  kind: itemKindEnum("kind").notNull(),
  stock: integer("stock").notNull().default(0),
});

export const contributions = pgTable("contributions", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id),
  itemId: uuid("item_id")
    .notNull()
    .references(() => items.id),
  quantity: integer("quantity").notNull(),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
  affectsStock: boolean("affects_stock").notNull().default(true),
});

export type Employee = typeof employees.$inferSelect;
export type PublicEmployee = Omit<Employee, "passwordHash">;
export type Item = typeof items.$inferSelect;
export type Contribution = typeof contributions.$inferSelect;
export type Session = typeof sessions.$inferSelect;
export type Preference = (typeof preferenceEnum.enumValues)[number];
export type ItemKind = (typeof itemKindEnum.enumValues)[number];
export type EmployeeRole = (typeof employeeRoleEnum.enumValues)[number];
