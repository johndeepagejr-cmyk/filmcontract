CREATE TABLE `self_tape_analytics` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producerId` int NOT NULL,
	`date` timestamp NOT NULL,
	`submissionsCount` int DEFAULT 0,
	`averageRating` decimal(3,2),
	`revisionsRequested` int DEFAULT 0,
	`averageResponseTime` decimal(5,2),
	`approvalsCount` int DEFAULT 0,
	`rejectionsCount` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `self_tape_analytics_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_tape_templates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producerId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`projectTitle` varchar(255) NOT NULL,
	`roleDescription` text,
	`characterName` varchar(100),
	`requirements` text,
	`suggestedDuration` int,
	`requireSlate` boolean DEFAULT true,
	`usageCount` int DEFAULT 0,
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `self_tape_templates_id` PRIMARY KEY(`id`)
);
