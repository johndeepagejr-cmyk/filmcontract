CREATE TABLE `actorVideos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`title` varchar(255) NOT NULL,
	`description` text,
	`duration` int,
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorVideos_id` PRIMARY KEY(`id`)
);
