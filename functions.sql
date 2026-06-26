| schema | function_name                   | definition                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| ------ | ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| public | create_product_by_slug          | CREATE OR REPLACE FUNCTION public.create_product_by_slug(p_id character varying, p_slug text, p_title text, p_price bigint, p_description text, p_attributes jsonb, p_images jsonb DEFAULT '[]'::jsonb, p_video jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO product_items (id, category_id, title, price, description, attributes, images, video)
    VALUES (
        p_id, 
        (SELECT id FROM product_categories WHERE slug = p_slug), 
        p_title, 
        p_price,
        p_attributes,
        p_images
    );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | create_product_by_slug          | CREATE OR REPLACE FUNCTION public.create_product_by_slug(p_id character varying, p_slug text, p_title text, p_price bigint, p_attributes jsonb, p_description text, p_product_images jsonb DEFAULT '[]'::jsonb, p_product_video jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO product_items (
        id, 
        category_id, 
        title, 
        price, 
        attributes, 
        description, 
        product_images, -- Ensure table column matches
        product_video   -- Ensure table column matches
    )
    VALUES (
        p_id, 
        (SELECT id FROM product_categories WHERE slug = p_slug), 
        p_title, 
        p_price,
        p_attributes,
        p_description,
        p_product_images,
        p_product_video
    );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| public | create_product_by_slug          | CREATE OR REPLACE FUNCTION public.create_product_by_slug(p_id character varying, p_vendor_id character varying, p_slug text, p_title text, p_price bigint, p_attributes jsonb, p_description text, p_product_images jsonb DEFAULT '[]'::jsonb, p_product_video jsonb DEFAULT NULL::jsonb)
 RETURNS void
 LANGUAGE plpgsql
AS $function$
BEGIN
    INSERT INTO product_items (
        id, 
        vendor_id,
        category_id, 
        title, 
        price, 
        attributes, 
        description, 
        product_images, -- Ensure table column matches
        product_video   -- Ensure table column matches
    )
    VALUES (
        p_id, 
        p_vendor_id,
        (SELECT id FROM product_categories WHERE slug = p_slug), 
        p_title, 
        p_price,
        p_attributes,
        p_description,
        p_product_images,
        p_product_video
    );
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| public | update_room_on_new_message      | CREATE OR REPLACE FUNCTION public.update_room_on_new_message()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  UPDATE chat_rooms
  SET updated_at = NEW.created_at
  WHERE id = NEW.chat_room_id;
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | update_vendor_metrics_on_rating | CREATE OR REPLACE FUNCTION public.update_vendor_metrics_on_rating()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
DECLARE
    -- Determine the vendor ID based on the operation type
    v_vendor_id VARCHAR(10); 
    new_avg_rating NUMERIC;
    new_total_count INTEGER;
BEGIN
    -- 1. Determine the relevant vendor ID for the change.
    --    For INSERT/UPDATE, use NEW.vendor_id. 
    --    For DELETE, use OLD.vendor_id.
    IF TG_OP = 'DELETE' THEN
        v_vendor_id := OLD.vendor_id;
    ELSE
        v_vendor_id := NEW.vendor_id;
    END IF;

    -- 2. CRITICAL FIX: Gracefully handle NULL vendor_id
    IF v_vendor_id IS NULL THEN
        RETURN NULL; 
    END IF;

    -- *** NEW CRITICAL SAFETY CHECK ***
    -- If the user does not exist in the users table, they are likely 
    -- being deleted. We must exit now to avoid a Foreign Key violation.
    IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = v_vendor_id) THEN
        IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
    END IF;

    -- 3. Recalculate the aggregate rating metrics for the vendor.
    SELECT 
        COALESCE(AVG(score), 0), 
        COUNT(*)               
    INTO 
        new_avg_rating,        
        new_total_count        
    FROM 
        public.vendor_ratings
    WHERE 
        vendor_id = v_vendor_id;

    -- 4. Insert or Update the vendor_metrics table using ON CONFLICT.
    --    The check in Step 2 ensures v_vendor_id is valid in the 'users' table.
    INSERT INTO public.vendor_metrics (user_id, current_rating, total_ratings, updated_at)
    VALUES (v_vendor_id, new_avg_rating, new_total_count, NOW())
    ON CONFLICT (user_id) DO UPDATE 
    SET 
        current_rating = EXCLUDED.current_rating,
        total_ratings = EXCLUDED.total_ratings,
        updated_at = NOW();

    -- Return the appropriate row
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$function$
 |
| public | protect_immutable_fields        | CREATE OR REPLACE FUNCTION public.protect_immutable_fields()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  -- Block update ONLY IF the existing value is NOT NULL
  IF (OLD.first_name IS NOT NULL AND OLD.first_name IS DISTINCT FROM NEW.first_name) OR
     (OLD.last_name IS NOT NULL AND OLD.last_name IS DISTINCT FROM NEW.first_name) OR
     (OLD.username IS NOT NULL AND OLD.username IS DISTINCT FROM NEW.username) THEN
    
    RAISE EXCEPTION 'Fields first_name, last_name, and username are immutable once set.';
  END IF;

  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| public | update_hostel_search_document   | CREATE OR REPLACE FUNCTION public.update_hostel_search_document()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.search_document :=
    setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(NEW.location, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.room_type, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(NEW.description, '')), 'C') ||
    setweight(to_tsvector('english', coalesce(NEW.toilet_access, '')), 'D') ||
    setweight(to_tsvector('english', coalesce(NEW.kitchen_access, '')), 'D');
  RETURN NEW;
END
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| public | set_updated_at                  | CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$function$
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |