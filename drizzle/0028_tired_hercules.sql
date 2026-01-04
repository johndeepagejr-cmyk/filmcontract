CREATE TABLE `aiRecommendations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`recommendedUserId` int NOT NULL,
	`matchScore` int,
	`reason` text,
	`status` enum('pending','viewed','contacted','hired') DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `aiRecommendations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `castingCalls` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text NOT NULL,
	`roles` text,
	`budget` decimal(10,2),
	`deadline` timestamp,
	`status` enum('open','closed','filled') DEFAULT 'open',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `castingCalls_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `castingSubmissions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`castingCallId` int NOT NULL,
	`actorId` int NOT NULL,
	`videoUrl` text,
	`notes` text,
	`status` enum('submitted','reviewing','shortlisted','rejected','hired') DEFAULT 'submitted',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `castingSubmissions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `groupMembers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`groupId` int NOT NULL,
	`userId` int NOT NULL,
	`joinedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `groupMembers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialFollows` (
	`id` int AUTO_INCREMENT NOT NULL,
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialFollows_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialGroups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`description` text,
	`genre` varchar(50),
	`location` varchar(100),
	`membersCount` int DEFAULT 0,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialGroups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`content` text NOT NULL,
	`imageUrl` text,
	`likesCount` int DEFAULT 0,
	`commentsCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialPosts_id` PRIMARY KEY(`id`)
);
