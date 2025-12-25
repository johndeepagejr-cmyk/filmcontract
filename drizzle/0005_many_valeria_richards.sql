CREATE TABLE `contractTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int,
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` enum('feature_film','commercial','voice_over','tv_series','custom') NOT NULL DEFAULT 'custom',
	`defaultPaymentTerms` text,
	`defaultDeliverables` text,
	`isSystemTemplate` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractTemplates_id` PRIMARY KEY(`id`)
);
