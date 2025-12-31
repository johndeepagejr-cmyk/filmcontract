CREATE TABLE `photoEngagement` (
	`id` int AUTO_INCREMENT NOT NULL,
	`photoId` int NOT NULL,
	`portfolioUserId` int NOT NULL,
	`viewerIp` varchar(45),
	`engagementType` varchar(50) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `photoEngagement_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `portfolioViews` (
	`id` int AUTO_INCREMENT NOT NULL,
	`portfolioUserId` int NOT NULL,
	`viewerIp` varchar(45),
	`viewerUserAgent` text,
	`referrer` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `portfolioViews_id` PRIMARY KEY(`id`)
);
