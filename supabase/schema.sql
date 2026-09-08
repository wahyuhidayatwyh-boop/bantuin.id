-- ============================================================================
-- BANTUIN — PRODUCTION POSTGRESQL SCHEMA WITH ROW LEVEL SECURITY (RLS)
-- Master Database Schema for Bantuin Platform
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. ENUMS & TYPES
-- ----------------------------------------------------------------------------
DO $$ BEGIN
    CREATE TYPE verification_status AS ENUM ('unverified', 'pending_review', 'verified', 'rejected', 'suspended');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_mode AS ENUM ('offline', 'online');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE request_status AS ENUM (
        'draft',
        'published',
        'has_offers',
        'helper_selected',
        'in_progress',
        'awaiting_confirmation',
        'completed',
        'cancelled',
        'disputed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE offer_status AS ENUM ('submitted', 'accepted', 'rejected', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE order_status AS ENUM (
        'room_created',
        'on_the_way',
        'item_picked_up',
        'task_delivered',
        'proof_submitted',
        'completed',
        'disputed',
        'cancelled'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE booking_status AS ENUM (
        'temp_locked',
        'confirmed_by_owner',
        'payment_held',
        'handed_over',
        'in_use',
        'returned',
        'verified_settled',
        'cancelled',
        'disputed'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ----------------------------------------------------------------------------
-- 2. TABLES
-- ----------------------------------------------------------------------------

-- PROFILES (Syncs with Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone_number TEXT,
    avatar_url TEXT,
    bio TEXT,
    campus_name TEXT DEFAULT 'Universitas Indonesia',
    faculty TEXT,
    verification_status verification_status DEFAULT 'unverified',
    id_card_url TEXT,
    selfie_url TEXT,
    verification_notes TEXT,
    is_partner BOOLEAN DEFAULT FALSE,
    partner_business_name TEXT,
    is_admin BOOLEAN DEFAULT FALSE,
    
    -- Reputation & Metrics
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    rating_count INTEGER DEFAULT 0,
    completed_helps_count INTEGER DEFAULT 0,
    reliability_score INTEGER DEFAULT 100, -- 0 to 100%
    response_time_minutes INTEGER DEFAULT 15,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BANTUIN POINTS (Safe Meeting Points)
CREATE TABLE IF NOT EXISTS public.bantuin_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL, -- 'campus_gate', 'minimarket', 'library', 'partner_hub'
    campus TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    is_verified_safe BOOLEAN DEFAULT TRUE,
    operational_hours TEXT DEFAULT '07:00 - 21:00 WIB',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REQUESTS (Errands & Bantuan)
CREATE TABLE IF NOT EXISTS public.requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category TEXT NOT NULL, -- 'Ambil Dokumen', 'Print & Fotokopi', 'Antar Barang', 'Bantuan Belanja', 'Jasa Desain', etc.
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    mode request_mode NOT NULL DEFAULT 'offline',
    
    -- Location (Preserve privacy with radius for public view)
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    bantuin_point_id UUID REFERENCES public.bantuin_points(id),
    is_public_location BOOLEAN DEFAULT TRUE,
    
    -- Time & Budget
    deadline TIMESTAMPTZ NOT NULL,
    reward_amount NUMERIC(12,2) NOT NULL CHECK (reward_amount >= 0),
    is_voluntary BOOLEAN DEFAULT FALSE, -- Mode Bantuan Gratis / Sukarela
    
    -- Status & Matching
    status request_status DEFAULT 'published',
    selected_helper_id UUID REFERENCES public.profiles(id),
    attachments TEXT[] DEFAULT '{}',
    cancellation_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- OFFERS (Helper Bids)
CREATE TABLE IF NOT EXISTS public.offers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    helper_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    pitch_message TEXT NOT NULL,
    proposed_price NUMERIC(12,2),
    estimated_arrival_minutes INTEGER,
    status offer_status DEFAULT 'submitted',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(request_id, helper_id)
);

-- ORDER ROOMS (Locked Transaction Room)
CREATE TABLE IF NOT EXISTS public.order_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID UNIQUE NOT NULL REFERENCES public.requests(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES public.profiles(id),
    helper_id UUID NOT NULL REFERENCES public.profiles(id),
    locked_amount NUMERIC(12,2) NOT NULL,
    platform_fee NUMERIC(12,2) DEFAULT 0.00,
    helper_payout_amount NUMERIC(12,2) NOT NULL,
    
    order_status order_status DEFAULT 'room_created',
    xendit_invoice_id TEXT,
    xendit_payment_status TEXT DEFAULT 'PENDING',
    xendit_disbursement_id TEXT,
    
    -- Checkpoints & Evidence
    started_at TIMESTAMPTZ,
    proof_photo_urls TEXT[] DEFAULT '{}',
    proof_notes TEXT,
    proof_submitted_at TIMESTAMPTZ,
    auto_approve_deadline TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    dispute_reason TEXT,
    dispute_opened_by UUID REFERENCES public.profiles(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CHAT MESSAGES (Transaction-Bound)
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_room_id UUID NOT NULL REFERENCES public.order_rooms(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id),
    message TEXT NOT NULL,
    attachment_urls TEXT[] DEFAULT '{}',
    has_warning_flag BOOLEAN DEFAULT FALSE,
    warning_reason TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTALS (Products & Goods)
CREATE TABLE IF NOT EXISTS public.rentals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Kamera & Lensa', 'Laptop & Gadget', 'Audio & Sound', 'Proyektor', 'Peralatan Event'
    description TEXT NOT NULL,
    daily_price NUMERIC(12,2) NOT NULL CHECK (daily_price > 0),
    deposit_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
    photo_urls TEXT[] NOT NULL DEFAULT '{}',
    terms_and_conditions TEXT,
    pickup_location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_available BOOLEAN DEFAULT TRUE,
    is_verified_item BOOLEAN DEFAULT FALSE,
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    rating_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RENTAL BOOKINGS
CREATE TABLE IF NOT EXISTS public.rental_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rental_id UUID NOT NULL REFERENCES public.rentals(id) ON DELETE CASCADE,
    renter_id UUID NOT NULL REFERENCES public.profiles(id),
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_days INTEGER NOT NULL,
    rental_fee NUMERIC(12,2) NOT NULL,
    deposit_fee NUMERIC(12,2) NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    
    booking_status booking_status DEFAULT 'temp_locked',
    lock_expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '15 minutes'),
    
    -- Condition Checklists & Photos
    initial_condition_notes TEXT,
    initial_condition_photos TEXT[] DEFAULT '{}',
    return_condition_notes TEXT,
    return_condition_photos TEXT[] DEFAULT '{}',
    
    deposit_refund_amount NUMERIC(12,2),
    deposit_deduction_reason TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SERVICES (Jasa Keahlian)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Desain Grafis', 'Fotografi & Videografi', 'Web & Programming', 'Tutor & Penulisan'
    description TEXT NOT NULL,
    starting_price NUMERIC(12,2) NOT NULL,
    portfolio_urls TEXT[] DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    rating_avg NUMERIC(3,2) DEFAULT 5.00,
    rating_count INTEGER DEFAULT 0,
    completed_orders INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- REVIEWS (Rating & Feedback)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL, -- reference order_room or rental_booking
    transaction_type TEXT NOT NULL, -- 'request', 'rental', 'service'
    reviewer_id UUID NOT NULL REFERENCES public.profiles(id),
    reviewee_id UUID NOT NULL REFERENCES public.profiles(id),
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    tags TEXT[] DEFAULT '{}', -- e.g. 'Cepat', 'Tepat Waktu', 'Ramah', 'Rapi'
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPORTS (Trust & Safety)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id),
    target_user_id UUID REFERENCES public.profiles(id),
    target_request_id UUID REFERENCES public.requests(id),
    target_rental_id UUID REFERENCES public.rentals(id),
    category TEXT NOT NULL, -- 'penipuan', 'pelecehan', 'barang_rusak', 'disintermediasi', 'konten_ilegal'
    description TEXT NOT NULL,
    evidence_urls TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'pending', -- 'pending', 'investigating', 'resolved', 'dismissed'
    admin_notes TEXT,
    resolved_by UUID REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ
);

-- AUDIT LOGS (Immutable Security Trail)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id),
    actor_email TEXT,
    action TEXT NOT NULL, -- 'user.verify', 'user.suspend', 'dispute.resolve', 'payout.release', 'request.cancel'
    target_entity TEXT NOT NULL,
    target_id UUID,
    payload JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 3. ROW LEVEL SECURITY (RLS) POLICIES
-- ----------------------------------------------------------------------------

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bantuin_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rentals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- PROFILES RLS
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- BANTUIN POINTS RLS
CREATE POLICY "Bantuin points are viewable by everyone" 
    ON public.bantuin_points FOR SELECT USING (true);

-- REQUESTS RLS
CREATE POLICY "Published requests are viewable by everyone" 
    ON public.requests FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create requests" 
    ON public.requests FOR INSERT WITH CHECK (auth.uid() = requester_id);

CREATE POLICY "Requesters can update their own requests" 
    ON public.requests FOR UPDATE USING (auth.uid() = requester_id);

-- OFFERS RLS
CREATE POLICY "Requesters and offer owners can view offers" 
    ON public.offers FOR SELECT USING (
        auth.uid() = helper_id OR 
        auth.uid() IN (SELECT requester_id FROM public.requests WHERE id = request_id)
    );

CREATE POLICY "Helpers can submit offers" 
    ON public.offers FOR INSERT WITH CHECK (auth.uid() = helper_id);

CREATE POLICY "Helpers can update their own offers" 
    ON public.offers FOR UPDATE USING (auth.uid() = helper_id);

-- ORDER ROOMS RLS
CREATE POLICY "Participants can view their order rooms" 
    ON public.order_rooms FOR SELECT USING (
        auth.uid() = requester_id OR auth.uid() = helper_id
    );

CREATE POLICY "Participants can update order rooms" 
    ON public.order_rooms FOR UPDATE USING (
        auth.uid() = requester_id OR auth.uid() = helper_id
    );

-- CHAT MESSAGES RLS
CREATE POLICY "Order room participants can view chat messages" 
    ON public.chat_messages FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.order_rooms 
            WHERE id = order_room_id 
            AND (requester_id = auth.uid() OR helper_id = auth.uid())
        )
    );

CREATE POLICY "Order room participants can send chat messages" 
    ON public.chat_messages FOR INSERT WITH CHECK (
        auth.uid() = sender_id AND
        EXISTS (
            SELECT 1 FROM public.order_rooms 
            WHERE id = order_room_id 
            AND (requester_id = auth.uid() OR helper_id = auth.uid())
        )
    );

-- RENTALS & SERVICES RLS
CREATE POLICY "Rentals are viewable by everyone" 
    ON public.rentals FOR SELECT USING (true);

CREATE POLICY "Owners can manage their rentals" 
    ON public.rentals FOR ALL USING (auth.uid() = owner_id);

CREATE POLICY "Services are viewable by everyone" 
    ON public.services FOR SELECT USING (true);

CREATE POLICY "Providers can manage their services" 
    ON public.services FOR ALL USING (auth.uid() = provider_id);

-- RENTAL BOOKINGS RLS
CREATE POLICY "Rental booking participants can view their bookings" 
    ON public.rental_bookings FOR SELECT USING (
        auth.uid() = renter_id OR auth.uid() = owner_id
    );

CREATE POLICY "Renters can create bookings" 
    ON public.rental_bookings FOR INSERT WITH CHECK (auth.uid() = renter_id);

CREATE POLICY "Participants can update bookings" 
    ON public.rental_bookings FOR UPDATE USING (
        auth.uid() = renter_id OR auth.uid() = owner_id
    );

-- REVIEWS RLS
CREATE POLICY "Reviews are viewable by everyone" 
    ON public.reviews FOR SELECT USING (true);

CREATE POLICY "Reviewers can write reviews" 
    ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- REPORTS RLS
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Reporters can view their submitted reports" 
    ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- AUDIT LOGS RLS (Strict Admin Only)
CREATE POLICY "Admins can view audit logs" 
    ON public.audit_logs FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
    );

-- ----------------------------------------------------------------------------
-- 4. TRIGGERS & FUNCTIONS
-- ----------------------------------------------------------------------------

-- Automatically create profile on auth.user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url)
    VALUES (
        new.id,
        new.email,
        COALESCE(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
        COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://avatar.vercel.sh/' || new.id)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated At timestamp updater
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_requests_modtime BEFORE UPDATE ON public.requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offers_modtime BEFORE UPDATE ON public.offers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_order_rooms_modtime BEFORE UPDATE ON public.order_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rentals_modtime BEFORE UPDATE ON public.rentals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rental_bookings_modtime BEFORE UPDATE ON public.rental_bookings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_modtime BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
