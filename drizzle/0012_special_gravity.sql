CREATE TABLE `actorFilms` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`role` varchar(255) NOT NULL,
	`year` int NOT NULL,
	`description` text,
	`posterUrl` text,
	`projectType` enum('feature_film','short_film','tv_series','commercial','theater','voice_over','other') NOT NULL DEFAULT 'feature_film',
	`director` varchar(255),
	`productionCompany` varchar(255),
	`imdbUrl` varchar(500),
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorFilms_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorPhotos` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`photoUrl` text NOT NULL,
	`caption` text,
	`photoType` enum('headshot','portfolio','behind_scenes') NOT NULL DEFAULT 'portfolio',
	`displayOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `actorPhotos_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `actorProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`bio` text,
	`location` varchar(255),
	`yearsExperience` int,
	`specialties` text,
	`profilePhotoUrl` text,
	`coverPhotoUrl` text,
	`height` varchar(50),
	`weight` varchar(50),
	`eyeColor` varchar(50),
	`hairColor` varchar(50),
	`website` varchar(500),
	`imdbUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `actorProfiles_id` PRIMARY KEY(`id`),
	CONSTRAINT `actorProfiles_userId_unique` UNIQUE(`userId`)
);
