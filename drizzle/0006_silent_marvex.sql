CREATE TABLE `contractVersions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`versionNumber` int NOT NULL,
	`projectTitle` varchar(255) NOT NULL,
	`actorId` int NOT NULL,
	`paymentTerms` text NOT NULL,
	`paymentAmount` decimal(12,2),
	`startDate` timestamp,
	`endDate` timestamp,
	`deliverables` text,
	`status` varchar(50) NOT NULL,
	`editedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractVersions_id` PRIMARY KEY(`id`)
);
