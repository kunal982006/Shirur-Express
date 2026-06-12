-- Add delivery scheduling columns to all three order tables
-- deliveryMode: "now" (default) or "scheduled"
-- scheduledDeliveryTime: the selected time slot string (e.g. "2:00 PM")

ALTER TABLE grocery_orders ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'now';
ALTER TABLE grocery_orders ADD COLUMN IF NOT EXISTS scheduled_delivery_time TEXT;

ALTER TABLE street_food_orders ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'now';
ALTER TABLE street_food_orders ADD COLUMN IF NOT EXISTS scheduled_delivery_time TEXT;

ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS delivery_mode TEXT DEFAULT 'now';
ALTER TABLE restaurant_orders ADD COLUMN IF NOT EXISTS scheduled_delivery_time TEXT;
