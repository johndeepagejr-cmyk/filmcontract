import {
  boolean,
  decimal,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** User role in the film industry (producer or actor) */
  userRole: mysqlEnum("userRole", ["producer", "actor"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Contracts table - stores contract information between producers and actors
 */
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  projectTitle: varchar("projectTitle", { length: 255 }).notNull(),
  producerId: int("producerId").notNull(),
  actorId: int("actorId").notNull(),
  paymentTerms: text("paymentTerms").notNull(),
  paymentAmount: decimal("paymentAmount", { precision: 12, scale: 2 }),
  paymentStatus: mysqlEnum("paymentStatus", ["unpaid", "partial", "paid"])
    .default("unpaid")
    .notNull(),
  paidAmount: decimal("paidAmount", { precision: 12, scale: 2 }).default("0"),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  deliverables: text("deliverables"),
  status: mysqlEnum("status", ["draft", "active", "pending", "completed", "cancelled"])
    .default("draft")
    .notNull(),
  producerSignature: text("producerSignature"), // Base64 encoded signature image
  actorSignature: text("actorSignature"), // Base64 encoded signature image
  producerSignedAt: timestamp("producerSignedAt"),
  actorSignedAt: timestamp("actorSignedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

/**
 * Contract history table - tracks all changes and events for contracts
 */
export const contractHistory = mysqlTable("contractHistory", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", [
    "created",
    "edited",
    "status_changed",
    "payment_received",
  ]).notNull(),
  eventDescription: text("eventDescription").notNull(),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractHistory = typeof contractHistory.$inferSelect;
export type InsertContractHistory = typeof contractHistory.$inferInsert;

/**
 * Contract templates table - predefined templates for common contract types
 */
export const contractTemplates = mysqlTable("contractTemplates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId"), // null for system templates, user ID for custom templates
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  category: mysqlEnum("category", ["feature_film", "commercial", "voice_over", "tv_series", "custom"])
    .default("custom")
    .notNull(),
  defaultPaymentTerms: text("defaultPaymentTerms"),
  defaultDeliverables: text("defaultDeliverables"),
  isSystemTemplate: boolean("isSystemTemplate").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractTemplate = typeof contractTemplates.$inferSelect;
export type InsertContractTemplate = typeof contractTemplates.$inferInsert;

/**
 * Contract versions table - stores historical versions of contracts when edited
 */
/**
 * Contract reminders table - stores reminders for important contract dates
 */
export const contractReminders = mysqlTable("contractReminders", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  reminderType: mysqlEnum("reminderType", ["end_date", "payment_due", "pending_approval"]).notNull(),
  reminderDate: timestamp("reminderDate").notNull(),
  message: text("message").notNull(),
  status: mysqlEnum("status", ["pending", "sent", "dismissed"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractReminder = typeof contractReminders.$inferSelect;
export type InsertContractReminder = typeof contractReminders.$inferInsert;

/**
 * Contract notes table - stores comments and discussions between parties
 */
export const contractAttachments = mysqlTable("contractAttachments", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  fileName: varchar("fileName", { length: 255 }).notNull(),
  fileUrl: text("fileUrl").notNull(),
  fileSize: int("fileSize").notNull(), // in bytes
  fileType: varchar("fileType", { length: 100 }).notNull(),
  uploadedBy: int("uploadedBy").notNull(),
  uploadedAt: timestamp("uploadedAt").defaultNow().notNull(),
});

export type ContractAttachment = typeof contractAttachments.$inferSelect;
export type InsertContractAttachment = typeof contractAttachments.$inferInsert;

export const contractNotes = mysqlTable("contractNotes", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  userId: int("userId").notNull(),
  userName: varchar("userName", { length: 255 }).notNull(),
  userRole: mysqlEnum("userRole", ["producer", "actor"]).notNull(),
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractNote = typeof contractNotes.$inferSelect;
export type InsertContractNote = typeof contractNotes.$inferInsert;

export const contractVersions = mysqlTable("contractVersions", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  versionNumber: int("versionNumber").notNull(),
  projectTitle: varchar("projectTitle", { length: 255 }).notNull(),
  actorId: int("actorId").notNull(),
  paymentTerms: text("paymentTerms").notNull(),
  paymentAmount: decimal("paymentAmount", { precision: 12, scale: 2 }),
  startDate: timestamp("startDate"),
  endDate: timestamp("endDate"),
  deliverables: text("deliverables"),
  status: varchar("status", { length: 50 }).notNull(),
  editedBy: int("editedBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ContractVersion = typeof contractVersions.$inferSelect;
export type InsertContractVersion = typeof contractVersions.$inferInsert;
