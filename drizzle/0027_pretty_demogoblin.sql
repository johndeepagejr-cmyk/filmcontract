CREATE TABLE `actorAvailability` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`availabilityStatus` enum('available','unavailable','tentative') NOT NULL,
	`reason` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorAvailability_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorCredits` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`role` varchar(100) NOT NULL,
	`creditType` enum('film','tv','theater','commercial','web') NOT NULL,
	`year` int,
	`director` varchar(100),
	`description` text,
	`imdbUrl` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorCredits_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorReels` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`description` text,
	`videoUrl` text NOT NULL,
	`duration` int,
	`isPrimary` boolean DEFAULT false,
	`views` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorReels_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorResumes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(100) NOT NULL,
	`resumeUrl` text NOT NULL,
	`isPrimary` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorResumes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorUnions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`union` enum('SAG-AFTRA','EQUITY','AGVA','OTHER') NOT NULL,
	`membershipNumber` varchar(50),
	`joinDate` timestamp,
	`isVerified` boolean DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorUnions_id` PRIMARY KEY(`id`)
);
