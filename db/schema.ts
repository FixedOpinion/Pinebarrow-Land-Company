import { integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const gameProfiles = sqliteTable(
  "game_profiles",
  {
    id: text("id").primaryKey(),
    deviceId: text("device_id").notNull(),
    slot: integer("slot").notNull(),
    name: text("name").notNull(),
    saveJson: text("save_json").notNull(),
    createdAt: integer("created_at").notNull(),
    updatedAt: integer("updated_at").notNull(),
  },
  (table) => [
    uniqueIndex("game_profiles_device_slot_unique").on(table.deviceId, table.slot),
  ],
);
