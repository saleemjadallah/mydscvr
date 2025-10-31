-- Add image_regeneration_count column to menu_items table
ALTER TABLE menu_items 
ADD COLUMN IF NOT EXISTS image_regeneration_count INTEGER DEFAULT 0;
