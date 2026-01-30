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
  /** Verification status for established professionals */
  isVerified: boolean("isVerified").default(false).notNull(),
  /** Timestamp when user was verified */
  verifiedAt: timestamp("verifiedAt"),
  /** Trust score (0-100) based on contracts, ratings, and on-time performance */
  trustScore: int("trustScore").default(0),
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
  phoneNumber: varchar("phoneNumber", { length: 20 }), // Contact phone number
  portfolioTheme: mysqlEnum("portfolioTheme", ["grid", "masonry", "carousel"]).default("grid").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorProfile = typeof actorProfiles.$inferSelect;
export type InsertActorProfile = typeof actorProfiles.$inferInsert;

/**
 * Producer profiles table - detailed information about producers
 */
/**
 * Portfolio photos table - gallery of photos for both actors and producers
 */
export const portfolioPhotos = mysqlTable("portfolioPhotos", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  photoUrl: text("photoUrl").notNull(),
  caption: text("caption"),
  displayOrder: int("displayOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PortfolioPhoto = typeof portfolioPhotos.$inferSelect;
export type InsertPortfolioPhoto = typeof portfolioPhotos.$inferInsert;

export const producerProfiles = mysqlTable("producerProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(), // References users.id
  companyName: varchar("companyName", { length: 255 }),
  bio: text("bio"), // Producer/company biography
  location: varchar("location", { length: 255 }),
  yearsInBusiness: int("yearsInBusiness"),
  specialties: text("specialties"), // JSON array of specialties
  profilePhotoUrl: text("profilePhotoUrl"),
  companyLogoUrl: text("companyLogoUrl"),
  website: varchar("website", { length: 500 }),
  notableProjects: text("notableProjects"), // JSON array of notable projects
  awards: text("awards"), // JSON array of awards
  phoneNumber: varchar("phoneNumber", { length: 20 }), // Contact phone number
  portfolioTheme: mysqlEnum("portfolioTheme", ["grid", "masonry", "carousel"]).default("grid").notNull(),
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

/**
 * Portfolio views analytics table - tracks portfolio page views
 */
export const portfolioViews = mysqlTable("portfolioViews", {
  id: int("id").autoincrement().primaryKey(),
  portfolioUserId: int("portfolioUserId").notNull(), // User whose portfolio was viewed
  viewerIp: varchar("viewerIp", { length: 45 }),
  viewerUserAgent: text("viewerUserAgent"),
  referrer: text("referrer"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PortfolioView = typeof portfolioViews.$inferSelect;
export type InsertPortfolioView = typeof portfolioViews.$inferInsert;

/**
 * Photo engagement analytics table - tracks photo interactions
 */
export const photoEngagement = mysqlTable("photoEngagement", {
  id: int("id").autoincrement().primaryKey(),
  photoId: int("photoId").notNull(),
  portfolioUserId: int("portfolioUserId").notNull(),
  viewerIp: varchar("viewerIp", { length: 45 }),
  engagementType: varchar("engagementType", { length: 50 }).notNull(), // 'view', 'click', 'zoom'
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PhotoEngagement = typeof photoEngagement.$inferSelect;
export type InsertPhotoEngagement = typeof photoEngagement.$inferInsert;


/**
 * Favorites table - stores user's favorited actors and producers
 */
export const favorites = mysqlTable("favorites", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // User who favorited
  favoritedUserId: int("favoritedUserId").notNull(), // User being favorited (actor or producer)
  type: mysqlEnum("type", ["actor", "producer"]).notNull(), // Type of user being favorited
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Favorite = typeof favorites.$inferSelect;
export type InsertFavorite = typeof favorites.$inferInsert;

/**
 * Payment History table - tracks all payments made for contracts
 */
export const paymentHistory = mysqlTable("paymentHistory", {
  id: int("id").autoincrement().primaryKey(),
  contractId: int("contractId").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("paymentDate").notNull(),
  receiptUrl: text("receiptUrl"), // S3 URL of payment receipt/proof
  notes: text("notes"),
  recordedBy: int("recordedBy").notNull(), // User ID who recorded the payment
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PaymentHistory = typeof paymentHistory.$inferSelect;
export type InsertPaymentHistory = typeof paymentHistory.$inferInsert;

/**
 * Saved Filter Presets table - stores user's saved search filter combinations
 */
export const savedFilterPresets = mysqlTable("savedFilterPresets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(), // User-defined preset name
  filterType: mysqlEnum("filterType", ["actor", "producer"]).notNull(),
  filters: text("filters").notNull(), // JSON string of filter values
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SavedFilterPreset = typeof savedFilterPresets.$inferSelect;
export type InsertSavedFilterPreset = typeof savedFilterPresets.$inferInsert;


export const actorReels = mysqlTable("actorReels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  description: text("description"),
  videoUrl: text("videoUrl").notNull(), // S3 URL of video
  duration: int("duration"), // Duration in seconds
  isPrimary: boolean("isPrimary").default(false), // Primary reel for profile
  views: int("views").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorReel = typeof actorReels.$inferSelect;
export type InsertActorReel = typeof actorReels.$inferInsert;

/**
 * Actor Resumes table - resume/CV documents
 */
export const actorResumes = mysqlTable("actorResumes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 100 }).notNull(),
  resumeUrl: text("resumeUrl").notNull(), // S3 URL of PDF/document
  isPrimary: boolean("isPrimary").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorResume = typeof actorResumes.$inferSelect;
export type InsertActorResume = typeof actorResumes.$inferInsert;

/**
 * Actor Credits table - past film/TV credits
 */
export const actorCredits = mysqlTable("actorCredits", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(), // Film/TV title
  role: varchar("role", { length: 100 }).notNull(), // Character name or role type
  creditType: mysqlEnum("creditType", ["film", "tv", "theater", "commercial", "web"]).notNull(),
  year: int("year"),
  director: varchar("director", { length: 100 }),
  description: text("description"),
  imdbUrl: text("imdbUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorCredit = typeof actorCredits.$inferSelect;
export type InsertActorCredit = typeof actorCredits.$inferInsert;

/**
 * Actor Unions table - union memberships
 */
export const actorUnions = mysqlTable("actorUnions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  union: mysqlEnum("union", ["SAG-AFTRA", "EQUITY", "AGVA", "OTHER"]).notNull(),
  membershipNumber: varchar("membershipNumber", { length: 50 }),
  joinDate: timestamp("joinDate"),
  isVerified: boolean("isVerified").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorUnion = typeof actorUnions.$inferSelect;
export type InsertActorUnion = typeof actorUnions.$inferInsert;

/**
 * Actor Availability table - availability calendar and blocks
 */
export const actorAvailability = mysqlTable("actorAvailability", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  startDate: timestamp("startDate").notNull(),
  endDate: timestamp("endDate").notNull(),
  availabilityStatus: mysqlEnum("availabilityStatus", ["available", "unavailable", "tentative"]).notNull(),
  reason: varchar("reason", { length: 255 }), // e.g., "On set", "Vacation", "Audition"
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ActorAvailability = typeof actorAvailability.$inferSelect;
export type InsertActorAvailability = typeof actorAvailability.$inferInsert;



/**
 * Social Posts table - for social feed
 */
export const socialPosts = mysqlTable("socialPosts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  content: text("content").notNull(),
  imageUrl: text("imageUrl"),
  likesCount: int("likesCount").default(0),
  commentsCount: int("commentsCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

/**
 * Social Follows table - for following relationships
 */
export const socialFollows = mysqlTable("socialFollows", {
  id: int("id").autoincrement().primaryKey(),
  followerId: int("followerId").notNull(),
  followingId: int("followingId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialFollow = typeof socialFollows.$inferSelect;
export type InsertSocialFollow = typeof socialFollows.$inferInsert;

/**
 * Social Groups table - for genre/location based communities
 */
export const socialGroups = mysqlTable("socialGroups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  genre: varchar("genre", { length: 50 }),
  location: varchar("location", { length: 100 }),
  membersCount: int("membersCount").default(0),
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SocialGroup = typeof socialGroups.$inferSelect;
export type InsertSocialGroup = typeof socialGroups.$inferInsert;

/**
 * Group Members table - tracks group memberships
 */
export const groupMembers = mysqlTable("groupMembers", {
  id: int("id").autoincrement().primaryKey(),
  groupId: int("groupId").notNull(),
  userId: int("userId").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
});

export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMember = typeof groupMembers.$inferInsert;

/**
 * Casting Calls table - job postings by producers
 */
export const castingCalls = mysqlTable("castingCalls", {
  id: int("id").autoincrement().primaryKey(),
  producerId: int("producerId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description").notNull(),
  roles: text("roles"), // JSON array of roles
  budget: decimal("budget", { precision: 10, scale: 2 }),
  deadline: timestamp("deadline"),
  status: mysqlEnum("status", ["open", "closed", "filled"]).default("open"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CastingCall = typeof castingCalls.$inferSelect;
export type InsertCastingCall = typeof castingCalls.$inferInsert;

/**
 * Casting Submissions table - actor submissions for casting calls
 */
export const castingSubmissions = mysqlTable("castingSubmissions", {
  id: int("id").autoincrement().primaryKey(),
  castingCallId: int("castingCallId").notNull(),
  actorId: int("actorId").notNull(),
  videoUrl: text("videoUrl"),
  notes: text("notes"),
  status: mysqlEnum("status", ["submitted", "reviewing", "shortlisted", "rejected", "hired"]).default("submitted"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CastingSubmission = typeof castingSubmissions.$inferSelect;
export type InsertCastingSubmission = typeof castingSubmissions.$inferInsert;

/**
 * AI Recommendations table - smart matching suggestions
 */
export const aiRecommendations = mysqlTable("aiRecommendations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(), // Director/Producer
  recommendedUserId: int("recommendedUserId").notNull(), // Actor
  matchScore: int("matchScore"), // 0-100 score
  reason: text("reason"), // Why they match
  status: mysqlEnum("status", ["pending", "viewed", "contacted", "hired"]).default("pending"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AiRecommendation = typeof aiRecommendations.$inferSelect;
export type InsertAiRecommendation = typeof aiRecommendations.$inferInsert;


/**
 * Conversations table - tracks message threads between users
 */
export const conversations = mysqlTable("conversations", {
  id: int("id").autoincrement().primaryKey(),
  participant1Id: int("participant1Id").notNull(), // First user in conversation
  participant2Id: int("participant2Id").notNull(), // Second user in conversation
  lastMessageAt: timestamp("lastMessageAt").defaultNow().notNull(),
  lastMessagePreview: varchar("lastMessagePreview", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Conversation = typeof conversations.$inferSelect;
export type InsertConversation = typeof conversations.$inferInsert;

/**
 * Messages table - individual messages in conversations
 */
export const messages = mysqlTable("messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  senderId: int("senderId").notNull(),
  content: text("content").notNull(),
  isRead: boolean("isRead").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Message = typeof messages.$inferSelect;
export type InsertMessage = typeof messages.$inferInsert;


/**
 * Video Auditions table - stores scheduled video call auditions between producers and actors
 * Integrated with Daily.co for live video calls
 */
export const videoAuditions = mysqlTable("video_auditions", {
  id: int("id").autoincrement().primaryKey(),
  /** The project this audition is for */
  projectId: int("projectId").notNull(),
  /** The role being auditioned for */
  roleId: int("roleId"),
  /** Producer who created the audition */
  producerId: int("producerId").notNull(),
  /** Actor being auditioned */
  actorId: int("actorId").notNull(),
  /** Daily.co room name/URL */
  roomName: varchar("roomName", { length: 255 }).notNull(),
  /** Daily.co room URL */
  roomUrl: text("roomUrl"),
  /** Scheduled start time */
  scheduledAt: timestamp("scheduledAt").notNull(),
  /** Duration in minutes */
  durationMinutes: int("durationMinutes").default(30),
  /** Audition status */
  status: mysqlEnum("status", ["scheduled", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled").notNull(),
  /** Optional notes from producer */
  notes: text("notes"),
  /** Recording URL if recorded */
  recordingUrl: text("recordingUrl"),
  /** Whether recording is enabled */
  recordingEnabled: boolean("recordingEnabled").default(false),
  /** Actual start time */
  startedAt: timestamp("startedAt"),
  /** Actual end time */
  endedAt: timestamp("endedAt"),
  /** Producer's rating of the audition (1-5) */
  rating: int("rating"),
  /** Producer's feedback */
  feedback: text("feedback"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type VideoAudition = typeof videoAuditions.$inferSelect;
export type InsertVideoAudition = typeof videoAuditions.$inferInsert;

/**
 * Audition Participants - tracks who joined the video call
 */
export const auditionParticipants = mysqlTable("audition_participants", {
  id: int("id").autoincrement().primaryKey(),
  auditionId: int("auditionId").notNull(),
  userId: int("userId").notNull(),
  /** Role in the call */
  role: mysqlEnum("role", ["producer", "actor", "guest"]).notNull(),
  /** When they joined */
  joinedAt: timestamp("joinedAt"),
  /** When they left */
  leftAt: timestamp("leftAt"),
  /** Duration in seconds */
  durationSeconds: int("durationSeconds"),
});

export type AuditionParticipant = typeof auditionParticipants.$inferSelect;
export type InsertAuditionParticipant = typeof auditionParticipants.$inferInsert;

/**
 * Audition Invitations - tracks invitations sent to actors
 */
export const auditionInvitations = mysqlTable("audition_invitations", {
  id: int("id").autoincrement().primaryKey(),
  auditionId: int("auditionId").notNull(),
  actorId: int("actorId").notNull(),
  /** Invitation status */
  status: mysqlEnum("status", ["pending", "accepted", "declined", "expired"]).default("pending").notNull(),
  /** Message from producer */
  message: text("message"),
  /** When invitation was sent */
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  /** When actor responded */
  respondedAt: timestamp("respondedAt"),
  /** Expiration time */
  expiresAt: timestamp("expiresAt"),
});

export type AuditionInvitation = typeof auditionInvitations.$inferSelect;
export type InsertAuditionInvitation = typeof auditionInvitations.$inferInsert;


/**
 * Self-Tapes table - stores recorded video auditions from actors
 * Similar to WeAudition/coldRead style self-tape submissions
 */
export const selfTapes = mysqlTable("self_tapes", {
  id: int("id").autoincrement().primaryKey(),
  /** Actor who created the self-tape */
  actorId: int("actorId").notNull(),
  /** Optional producer who requested the tape */
  producerId: int("producerId"),
  /** Optional contract/project reference */
  contractId: int("contractId"),
  /** Project title for this audition */
  projectTitle: varchar("projectTitle", { length: 255 }).notNull(),
  /** Role description being auditioned for */
  roleDescription: text("roleDescription"),
  /** Character name if applicable */
  characterName: varchar("characterName", { length: 100 }),
  /** Video file URL (S3 or local storage) */
  videoUrl: text("videoUrl").notNull(),
  /** Thumbnail image URL */
  thumbnailUrl: text("thumbnailUrl"),
  /** Video duration in seconds */
  durationSeconds: int("durationSeconds"),
  /** File size in bytes */
  fileSizeBytes: int("fileSizeBytes"),
  /** Slate text overlay (actor name, role, etc.) */
  slateText: text("slateText"),
  /** Whether slate overlay is enabled */
  slateEnabled: boolean("slateEnabled").default(true),
  /** Trim start time in seconds */
  trimStart: int("trimStart").default(0),
  /** Trim end time in seconds (null = end of video) */
  trimEnd: int("trimEnd"),
  /** Self-tape status */
  status: mysqlEnum("status", ["draft", "submitted", "under_review", "approved", "rejected", "revision_requested"]).default("draft").notNull(),
  /** Actor's notes about the performance */
  actorNotes: text("actorNotes"),
  /** Whether this is a revision of a previous tape */
  isRevision: boolean("isRevision").default(false),
  /** Reference to original tape if this is a revision */
  originalTapeId: int("originalTapeId"),
  /** Revision number (1, 2, 3, etc.) */
  revisionNumber: int("revisionNumber").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  submittedAt: timestamp("submittedAt"),
});

export type SelfTape = typeof selfTapes.$inferSelect;
export type InsertSelfTape = typeof selfTapes.$inferInsert;

/**
 * Self-Tape Feedback table - timestamped notes from producers
 */
export const selfTapeFeedback = mysqlTable("self_tape_feedback", {
  id: int("id").autoincrement().primaryKey(),
  selfTapeId: int("selfTapeId").notNull(),
  producerId: int("producerId").notNull(),
  /** Timestamp in video (seconds) where feedback applies */
  timestampSeconds: int("timestampSeconds"),
  /** The feedback note */
  note: text("note").notNull(),
  /** Type of feedback */
  feedbackType: mysqlEnum("feedbackType", ["positive", "constructive", "question", "general"]).default("general").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SelfTapeFeedback = typeof selfTapeFeedback.$inferSelect;
export type InsertSelfTapeFeedback = typeof selfTapeFeedback.$inferInsert;

/**
 * Self-Tape Ratings table - multi-criteria ratings from producers
 */
export const selfTapeRatings = mysqlTable("self_tape_ratings", {
  id: int("id").autoincrement().primaryKey(),
  selfTapeId: int("selfTapeId").notNull(),
  producerId: int("producerId").notNull(),
  /** Fit for the role (1-10) */
  fitScore: int("fitScore"),
  /** Energy/presence (1-10) */
  energyScore: int("energyScore"),
  /** Delivery/performance (1-10) */
  deliveryScore: int("deliveryScore"),
  /** Technical quality (1-10) */
  technicalScore: int("technicalScore"),
  /** Overall impression (1-10) */
  overallScore: int("overallScore"),
  /** Written summary */
  summary: text("summary"),
  /** Would consider for role */
  wouldConsider: boolean("wouldConsider"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SelfTapeRating = typeof selfTapeRatings.$inferSelect;
export type InsertSelfTapeRating = typeof selfTapeRatings.$inferInsert;

/**
 * Self-Tape Revision Requests table - producer requests for changes
 */
export const selfTapeRevisions = mysqlTable("self_tape_revisions", {
  id: int("id").autoincrement().primaryKey(),
  selfTapeId: int("selfTapeId").notNull(),
  producerId: int("producerId").notNull(),
  /** What changes are requested */
  requestedChanges: text("requestedChanges").notNull(),
  /** Priority level */
  priority: mysqlEnum("priority", ["low", "medium", "high"]).default("medium").notNull(),
  /** Deadline for revision */
  deadline: timestamp("deadline"),
  /** Status of the revision request */
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "cancelled"]).default("pending").notNull(),
  /** ID of the new tape if revision was submitted */
  newTapeId: int("newTapeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SelfTapeRevision = typeof selfTapeRevisions.$inferSelect;
export type InsertSelfTapeRevision = typeof selfTapeRevisions.$inferInsert;


/**
 * Self-Tape Templates table - reusable templates for requesting self-tapes
 */
export const selfTapeTemplates = mysqlTable("self_tape_templates", {
  id: int("id").autoincrement().primaryKey(),
  /** Producer who created the template */
  producerId: int("producerId").notNull(),
  /** Template name */
  name: varchar("name", { length: 255 }).notNull(),
  /** Template description */
  description: text("description"),
  /** Project title template */
  projectTitle: varchar("projectTitle", { length: 255 }).notNull(),
  /** Role description template */
  roleDescription: text("roleDescription"),
  /** Character name template */
  characterName: varchar("characterName", { length: 100 }),
  /** Specific requirements for the self-tape */
  requirements: text("requirements"),
  /** Suggested duration in seconds */
  suggestedDuration: int("suggestedDuration"),
  /** Whether to include slate overlay */
  requireSlate: boolean("requireSlate").default(true),
  /** Number of times this template has been used */
  usageCount: int("usageCount").default(0),
  /** Whether template is active */
  isActive: boolean("isActive").default(true),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SelfTapeTemplate = typeof selfTapeTemplates.$inferSelect;
export type InsertSelfTapeTemplate = typeof selfTapeTemplates.$inferInsert;

/**
 * Self-Tape Analytics table - aggregated metrics for dashboard
 */
export const selfTapeAnalytics = mysqlTable("self_tape_analytics", {
  id: int("id").autoincrement().primaryKey(),
  /** Producer ID for analytics */
  producerId: int("producerId").notNull(),
  /** Date of the analytics snapshot */
  date: timestamp("date").notNull(),
  /** Total submissions on this date */
  submissionsCount: int("submissionsCount").default(0),
  /** Average rating received */
  averageRating: decimal("averageRating", { precision: 3, scale: 2 }),
  /** Total revisions requested */
  revisionsRequested: int("revisionsRequested").default(0),
  /** Average response time in hours */
  averageResponseTime: decimal("averageResponseTime", { precision: 5, scale: 2 }),
  /** Number of approved tapes */
  approvalsCount: int("approvalsCount").default(0),
  /** Number of rejected tapes */
  rejectionsCount: int("rejectionsCount").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SelfTapeAnalytic = typeof selfTapeAnalytics.$inferSelect;
export type InsertSelfTapeAnalytic = typeof selfTapeAnalytics.$inferInsert;
