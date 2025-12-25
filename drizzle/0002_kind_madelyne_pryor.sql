ALTER TABLE `contracts` ADD `paymentStatus` enum('unpaid','partial','paid') DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `paidAmount` decimal(12,2) DEFAULT '0';