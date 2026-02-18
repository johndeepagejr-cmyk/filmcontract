CREATE TABLE `escrow_payments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`payerId` int NOT NULL,
	`payeeId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`escrowStatus` enum('pending','funded','released','disputed','resolved','refunded','cancelled') NOT NULL DEFAULT 'pending',
	`stripePaymentIntentId` varchar(255),
	`stripeTransferId` varchar(255),
	`description` text,
	`milestoneNumber` int DEFAULT 1,
	`disputeReason` text,
	`resolutionNotes` text,
	`disputedBy` int,
	`fundedAt` timestamp,
	`releasedAt` timestamp,
	`disputedAt` timestamp,
	`resolvedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `escrow_payments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` varchar(50) NOT NULL,
	`title` varchar(255) NOT NULL,
	`body` text NOT NULL,
	`data` text,
	`isRead` boolean NOT NULL DEFAULT false,
	`groupKey` varchar(100),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `notifications_id` PRIMARY KEY(`id`)
);
