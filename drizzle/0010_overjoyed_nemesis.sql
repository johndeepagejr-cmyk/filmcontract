CREATE TABLE `producerReviews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`producerId` int NOT NULL,
	`actorId` int NOT NULL,
	`contractId` int NOT NULL,
	`rating` int NOT NULL,
	`review` text,
	`paymentOnTime` boolean NOT NULL,
	`wouldWorkAgain` boolean NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `producerReviews_id` PRIMARY KEY(`id`)
);
