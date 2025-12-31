CREATE TABLE `producerProfiles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`companyName` varchar(255),
	`bio` text,
	`location` varchar(255),
	`yearsInBusiness` int,
	`website` varchar(500),
	`profilePhotoUrl` text,
	`companyLogoUrl` text,
	`specialties` text,
	`notableProjects` text,
	`awards` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `producerProfiles_id` PRIMARY KEY(`id`)
);
