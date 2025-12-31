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
  /** Push notification token for mobile notifications */
  pushToken: text("pushToken"),
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

/**
 * Producer reviews table - stores actor reviews and ratings for producers
 * Used for the reputation/transparency system
 */
export const producerReviews = mysqlTable("producerReviews", {
  id: int("id").autoincrement().primaryKey(),
  producerId: int("producerId").notNull(),
  actorId: int("actorId").notNull(),
  contractId: int("contractId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  review: text("review"),
  paymentOnTime: boolean("paymentOnTime").notNull(), // Was payment made on time?
  wouldWorkAgain: boolean("wouldWorkAgain").notNull(), // Would actor work with this producer again?
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProducerReview = typeof producerReviews.$inferSelect;
export type InsertProducerReview = typeof producerReviews.$inferInsert;

/**
 * Actor reviews table - stores producer reviews and ratings for actors
 * Two-way transparency system
 */
export const actorReviews = mysqlTable("actorReviews", {
  id: int("id").autoincrement().primaryKey(),
  actorId: int("actorId").notNull(),
  producerId: int("producerId").notNull(),
  contractId: int("contractId").notNull(),
  rating: int("rating").notNull(), // 1-5 stars
  review: text("review"),
  professionalismRating: int("professionalismRating").notNull(), // 1-5 stars
  reliabilityRating: int("reliabilityRating").notNull(), // 1-5 stars
  wouldHireAgain: boolean("wouldHireAgain").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorReview = typeof actorReviews.$inferSelect;
export type InsertActorReview = typeof actorReviews.$inferInsert;

/**
 * Actor profiles table - extended profile information for actors
 * Facebook-style profile with bio, location, experience, etc.
 */
export const actorProfiles = mysqlTable("actorProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // References users.id
  bio: text("bio"), // Actor's biography/about section
  location: varchar("location", { length: 255 }), // City, State or Country
  yearsExperience: int("yearsExperience"), // Years of acting experience
  specialties: text("specialties"), // JSON array of specialties (Drama, Comedy, Action, etc.)
  profilePhotoUrl: text("profilePhotoUrl"), // Main profile photo
  coverPhotoUrl: text("coverPhotoUrl"), // Cover/banner photo
  height: varchar("height", { length: 50 }), // e.g., "5'10\""
  weight: varchar("weight", { length: 50 }), // e.g., "165 lbs"
  eyeColor: varchar("eyeColor", { length: 50 }),
  hairColor: varchar("hairColor", { length: 50 }),
  website: varchar("website", { length: 500 }),
  imdbUrl: varchar("imdbUrl", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorProfile = typeof actorProfiles.$inferSelect;
export type InsertActorProfile = typeof actorProfiles.$inferInsert;

/**
 * Producer profiles table - detailed information about producers
 */
export const producerProfiles = mysqlTable("producerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  companyName: varchar("companyName", { length: 255 }),
  bio: text("bio"),
  location: varchar("location", { length: 255 }),
  yearsInBusiness: int("yearsInBusiness"),
  website: varchar("website", { length: 500 }),
  profilePhotoUrl: text("profilePhotoUrl"),
  companyLogoUrl: text("companyLogoUrl"),
  specialties: text("specialties"), // JSON array: ["Feature Films", "Commercials", etc.]
  notableProjects: text("notableProjects"), // JSON array of project titles
  awards: text("awards"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ProducerProfile = typeof producerProfiles.$inferSelect;
export type InsertProducerProfile = typeof producerProfiles.$inferInsert;

/**
 * Actor portfolio photos table - gallery of headshots and portfolio images
 */
export const actorPhotos = mysqlTable("actorPhotos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  photoUrl: text("photoUrl").notNull(),
  caption: text("caption"),
  photoType: mysqlEnum("photoType", ["headshot", "portfolio", "behind_scenes"]).default("portfolio").notNull(),
  displayOrder: int("displayOrder").default(0).notNull(), // For ordering photos
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ActorPhoto = typeof actorPhotos.$inferSelect;
export type InsertActorPhoto = typeof actorPhotos.$inferInsert;

/**
 * Actor filmography table - past films and roles
 */
export const actorFilms = mysqlTable("actorFilms", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // References users.id
  title: varchar("title", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }).notNull(), // Character name or role type
  year: int("year").notNull(),
  description: text("description"),
  posterUrl: text("posterUrl"), // Movie poster or still image
  projectType: mysqlEnum("projectType", ["feature_film", "short_film", "tv_series", "commercial", "theater", "voice_over", "other"]).default("feature_film").notNull(),
  director: varchar("director", { length: 255 }),
  productionCompany: varchar("productionCompany", { length: 255 }),
  imdbUrl: varchar("imdbUrl", { length: 500 }),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorFilm = typeof actorFilms.$inferSelect;
export type InsertActorFilm = typeof actorFilms.$inferInsert;
