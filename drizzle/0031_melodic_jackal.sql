CREATE TABLE `audition_invitations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditionId` int NOT NULL,
	`actorId` int NOT NULL,
	`status` enum('pending','accepted','declined','expired') NOT NULL DEFAULT 'pending',
	`message` text,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`respondedAt` timestamp,
	`expiresAt` timestamp,
	CONSTRAINT `audition_invitations_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `audition_participants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`auditionId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('producer','actor','guest') NOT NULL,
	`joinedAt` timestamp,
	`leftAt` timestamp,
	`durationSeconds` int,
	CONSTRAINT `audition_participants_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `video_auditions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectId` int NOT NULL,
	`roleId` int,
	`producerId` int NOT NULL,
	`actorId` int NOT NULL,
	`roomName` varchar(255) NOT NULL,
	`roomUrl` text,
	`scheduledAt` timestamp NOT NULL,
	`durationMinutes` int DEFAULT 30,
	`status` enum('scheduled','in_progress','completed','cancelled','no_show') NOT NULL DEFAULT 'scheduled',
	`notes` text,
	`recordingUrl` text,
	`recordingEnabled` boolean DEFAULT false,
	`startedAt` timestamp,
	`endedAt` timestamp,
	`rating` int,
	`feedback` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `video_auditions_id` PRIMARY KEY(`id`)
);
