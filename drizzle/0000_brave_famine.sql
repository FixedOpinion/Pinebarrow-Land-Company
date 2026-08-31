CREATE TABLE `game_profiles` (
	`id` text PRIMARY KEY NOT NULL,
	`device_id` text NOT NULL,
	`slot` integer NOT NULL,
	`name` text NOT NULL,
	`save_json` text NOT NULL,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `game_profiles_device_slot_unique` ON `game_profiles` (`device_id`,`slot`);