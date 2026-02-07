ALTER TABLE `contracts` ADD `hellosignSignatureId` varchar(255);--> statement-breakpoint
ALTER TABLE `contracts` ADD `hellosignRequestId` varchar(255);--> statement-breakpoint
ALTER TABLE `contracts` ADD `signatureStatus` enum('pending','signed','declined','expired');--> statement-breakpoint
ALTER TABLE `contracts` ADD `signedDocumentUrl` text;--> statement-breakpoint
ALTER TABLE `contracts` ADD `fullySignedAt` timestamp;