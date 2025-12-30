CREATE TABLE `actorReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`producerId` int NOT NULL,
	`contractId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`professionalismRating` int NOT NULL,
	`reliabilityRating` int NOT NULL,
	`wouldHireAgain` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorReviews_id` PRIMARY KEY(`id`)
);
