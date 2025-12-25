CREATE TABLE `contractHistory` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`userId` int NOT NULL,
	`eventType` enum('created','edited','status_changed','payment_received') NOT NULL,
	`eventDescription` text NOT NULL,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractHistory_id` PRIMARY KEY(`id`)
);
