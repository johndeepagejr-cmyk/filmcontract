CREATE TABLE `contractAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`fileUrl` text NOT NULL,
	`fileSize` int NOT NULL,
	`fileType` varchar(100) NOT NULL,
	`uploadedBy` int NOT NULL,
	`uploadedAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractAttachments_id` PRIMARY KEY(`id`)
);
