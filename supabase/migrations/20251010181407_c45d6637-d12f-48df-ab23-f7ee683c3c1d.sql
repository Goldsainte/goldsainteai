-- Create package_marketing_materials table
CREATE TABLE IF NOT EXISTS public.package_marketing_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_name TEXT NOT NULL,
  tagline TEXT,
  description TEXT NOT NULL,
  highlights TEXT[] DEFAULT '{}',
  hero_image_url TEXT,
  gallery_images TEXT[] DEFAULT '{}',
  video_url TEXT,
  promotional_video_url TEXT,
  destination TEXT NOT NULL,
  duration_days INTEGER NOT NULL,
  starting_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  difficulty_level TEXT CHECK (difficulty_level IN ('easy', 'moderate', 'challenging', 'expert')),
  best_season TEXT,
  group_size_min INTEGER,
  group_size_max INTEGER,
  included_items TEXT[] DEFAULT '{}',
  excluded_items TEXT[] DEFAULT '{}',
  requirements TEXT[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  is_published BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create itinerary_templates table
CREATE TABLE IF NOT EXISTS public.itinerary_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id UUID REFERENCES public.package_marketing_materials(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  description TEXT,
  total_days INTEGER NOT NULL,
  is_public BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create template_day_items table
CREATE TABLE IF NOT EXISTS public.template_day_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.itinerary_templates(id) ON DELETE CASCADE,
  day_number INTEGER NOT NULL,
  time_of_day TEXT CHECK (time_of_day IN ('morning', 'afternoon', 'evening', 'full_day')),
  activity_title TEXT NOT NULL,
  activity_description TEXT,
  location TEXT,
  duration_minutes INTEGER,
  activity_type TEXT CHECK (activity_type IN ('accommodation', 'flight', 'transfer', 'meal', 'activity', 'sightseeing', 'free_time', 'other')),
  supplier_id UUID REFERENCES public.suppliers(id),
  estimated_cost NUMERIC,
  currency TEXT DEFAULT 'USD',
  booking_required BOOLEAN DEFAULT false,
  notes TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package_bookings table (for tracking customer bookings of packages)
CREATE TABLE IF NOT EXISTS public.package_bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  package_id UUID NOT NULL REFERENCES public.package_marketing_materials(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_reference TEXT UNIQUE NOT NULL,
  travel_dates_start DATE NOT NULL,
  travel_dates_end DATE NOT NULL,
  number_of_travelers INTEGER NOT NULL DEFAULT 1,
  traveler_details JSONB DEFAULT '[]',
  total_price NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded', 'cancelled')),
  booking_status TEXT NOT NULL DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')),
  special_requests TEXT,
  stripe_payment_intent_id TEXT,
  escrow_transaction_id UUID,
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.package_marketing_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.itinerary_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_day_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_bookings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for package_marketing_materials
CREATE POLICY "Anyone can view published packages"
  ON public.package_marketing_materials FOR SELECT
  USING (is_published = true);

CREATE POLICY "Creators can view their own packages"
  ON public.package_marketing_materials FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create packages"
  ON public.package_marketing_materials FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own packages"
  ON public.package_marketing_materials FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own packages"
  ON public.package_marketing_materials FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for itinerary_templates
CREATE POLICY "Anyone can view public templates"
  ON public.itinerary_templates FOR SELECT
  USING (is_public = true);

CREATE POLICY "Creators can view their own templates"
  ON public.itinerary_templates FOR SELECT
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can create templates"
  ON public.itinerary_templates FOR INSERT
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Creators can update their own templates"
  ON public.itinerary_templates FOR UPDATE
  USING (auth.uid() = creator_id);

CREATE POLICY "Creators can delete their own templates"
  ON public.itinerary_templates FOR DELETE
  USING (auth.uid() = creator_id);

-- RLS Policies for template_day_items
CREATE POLICY "Anyone can view items from public templates"
  ON public.template_day_items FOR SELECT
  USING (template_id IN (SELECT id FROM public.itinerary_templates WHERE is_public = true));

CREATE POLICY "Creators can view items from their templates"
  ON public.template_day_items FOR SELECT
  USING (template_id IN (SELECT id FROM public.itinerary_templates WHERE creator_id = auth.uid()));

CREATE POLICY "Creators can add items to their templates"
  ON public.template_day_items FOR INSERT
  WITH CHECK (template_id IN (SELECT id FROM public.itinerary_templates WHERE creator_id = auth.uid()));

CREATE POLICY "Creators can update items in their templates"
  ON public.template_day_items FOR UPDATE
  USING (template_id IN (SELECT id FROM public.itinerary_templates WHERE creator_id = auth.uid()));

CREATE POLICY "Creators can delete items from their templates"
  ON public.template_day_items FOR DELETE
  USING (template_id IN (SELECT id FROM public.itinerary_templates WHERE creator_id = auth.uid()));

-- RLS Policies for package_bookings
CREATE POLICY "Customers can view their own bookings"
  ON public.package_bookings FOR SELECT
  USING (auth.uid() = customer_id);

CREATE POLICY "Creators can view bookings for their packages"
  ON public.package_bookings FOR SELECT
  USING (package_id IN (SELECT id FROM public.package_marketing_materials WHERE creator_id = auth.uid()));

CREATE POLICY "Customers can create bookings"
  ON public.package_bookings FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Customers can update their own bookings"
  ON public.package_bookings FOR UPDATE
  USING (auth.uid() = customer_id);

-- Triggers for updated_at
CREATE TRIGGER update_package_marketing_materials_updated_at
  BEFORE UPDATE ON public.package_marketing_materials
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_itinerary_templates_updated_at
  BEFORE UPDATE ON public.itinerary_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_package_bookings_updated_at
  BEFORE UPDATE ON public.package_bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_package_materials_creator ON public.package_marketing_materials(creator_id);
CREATE INDEX IF NOT EXISTS idx_package_materials_published ON public.package_marketing_materials(is_published);
CREATE INDEX IF NOT EXISTS idx_package_materials_destination ON public.package_marketing_materials(destination);
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_creator ON public.itinerary_templates(creator_id);
CREATE INDEX IF NOT EXISTS idx_itinerary_templates_package ON public.itinerary_templates(package_id);
CREATE INDEX IF NOT EXISTS idx_template_items_template ON public.template_day_items(template_id);
CREATE INDEX IF NOT EXISTS idx_template_items_day ON public.template_day_items(template_id, day_number);
CREATE INDEX IF NOT EXISTS idx_package_bookings_customer ON public.package_bookings(customer_id);
CREATE INDEX IF NOT EXISTS idx_package_bookings_package ON public.package_bookings(package_id);
