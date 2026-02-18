ALTER TABLE `castingCalls` ADD `isFeatured` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `castingCalls` ADD `featuredUntil` timestamp;--> statement-breakpoint
ALTER TABLE `castingCalls` ADD `boostPaymentIntentId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeConnectAccountId` varchar(255);--> statement-breakpoint
ALTER TABLE `users` ADD `stripeConnectOnboarded` boolean DEFAULT false;