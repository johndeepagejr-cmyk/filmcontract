CREATE TABLE `contractReminders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`userId` int NOT NULL,
	`reminderType` enum('end_date','payment_due','pending_approval') NOT NULL,
	`reminderDate` timestamp NOT NULL,
	`message` text NOT NULL,
	`status` enum('pending','sent','dismissed') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractReminders_id` PRIMARY KEY(`id`)
);
