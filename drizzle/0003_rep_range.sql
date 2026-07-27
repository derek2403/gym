ALTER TABLE `template_exercises` ADD `target_reps_min` integer DEFAULT 8 NOT NULL;--> statement-breakpoint
ALTER TABLE `template_exercises` ADD `target_reps_max` integer DEFAULT 12 NOT NULL;--> statement-breakpoint
UPDATE `template_exercises` SET `target_reps_min` = `target_reps`, `target_reps_max` = `target_reps`;--> statement-breakpoint
ALTER TABLE `template_exercises` DROP COLUMN `target_reps`;
