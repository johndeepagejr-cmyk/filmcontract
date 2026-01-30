CREATE TABLE `self_tape_feedback` (
	`id` int AUTO_INCREMENT NOT NULL,
	`selfTapeId` int NOT NULL,
	`producerId` int NOT NULL,
	`timestampSeconds` int,
	`note` text NOT NULL,
	`feedbackType` enum('positive','constructive','question','general') NOT NULL DEFAULT 'general',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `self_tape_feedback_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_tape_ratings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`selfTapeId` int NOT NULL,
	`producerId` int NOT NULL,
	`fitScore` int,
	`energyScore` int,
	`deliveryScore` int,
	`technicalScore` int,
	`overallScore` int,
	`summary` text,
	`wouldConsider` boolean,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `self_tape_ratings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_tape_revisions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`selfTapeId` int NOT NULL,
	`producerId` int NOT NULL,
	`requestedChanges` text NOT NULL,
	`priority` enum('low','medium','high') NOT NULL DEFAULT 'medium',
	`deadline` timestamp,
	`status` enum('pending','in_progress','completed','cancelled') NOT NULL DEFAULT 'pending',
	`newTapeId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `self_tape_revisions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `self_tapes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`actorId` int NOT NULL,
	`producerId` int,
	`contractId` int,
	`projectTitle` varchar(255) NOT NULL,
	`roleDescription` text,
	`characterName` varchar(100),
	`videoUrl` text NOT NULL,
	`thumbnailUrl` text,
	`durationSeconds` int,
	`fileSizeBytes` int,
	`slateText` text,
	`slateEnabled` boolean DEFAULT true,
	`trimStart` int DEFAULT 0,
	`trimEnd` int,
	`status` enum('draft','submitted','under_review','approved','rejected','revision_requested') NOT NULL DEFAULT 'draft',
	`actorNotes` text,
	`isRevision` boolean DEFAULT false,
	`originalTapeId` int,
	`revisionNumber` int DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`submittedAt` timestamp,
	CONSTRAINT `self_tapes_id` PRIMARY KEY(`id`)
);
