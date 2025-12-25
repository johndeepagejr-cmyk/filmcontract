CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectTitle` varchar(255) NOT NULL,
	`producerId` int NOT NULL,
	`actorId` int NOT NULL,
	`paymentTerms` text NOT NULL,
	`paymentAmount` decimal(12,2),
	`startDate` timestamp,
	`endDate` timestamp,
	`deliverables` text,
	`status` enum('draft','active','pending','completed','cancelled') NOT NULL DEFAULT 'draft',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `userRole` enum('producer','actor');