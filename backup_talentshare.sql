--
-- PostgreSQL database dump
--

\restrict xEUuUA8loR3HRcwPM7uXEAHFkwiq0WQwa1M3ReMgDxJo7byxdpzAu8OKFrU2rZ3

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: applications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.applications (
    id bigint NOT NULL,
    job_offer_id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    portfolio_id bigint,
    cover_letter text,
    cv_path character varying(255),
    status character varying(255) DEFAULT 'sent'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    viewed_at timestamp(0) without time zone,
    shortlisted_at timestamp(0) without time zone,
    interview_at timestamp(0) without time zone,
    decided_at timestamp(0) without time zone,
    recruiter_notes text,
    interview_link character varying(255),
    interview_timezone character varying(255) DEFAULT 'Indian/Antananarivo'::character varying NOT NULL,
    interview_reminder_sent boolean DEFAULT false NOT NULL,
    CONSTRAINT applications_status_check CHECK (((status)::text = ANY ((ARRAY['sent'::character varying, 'viewed'::character varying, 'shortlisted'::character varying, 'interview'::character varying, 'accepted'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.applications OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.applications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.applications_id_seq OWNER TO postgres;

--
-- Name: applications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.applications_id_seq OWNED BY public.applications.id;


--
-- Name: availability_windows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.availability_windows (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    start_at date NOT NULL,
    end_at date NOT NULL,
    status character varying(255) DEFAULT 'available'::character varying NOT NULL,
    workload_percent smallint DEFAULT '100'::smallint NOT NULL,
    remote boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    workload_unit character varying(255) DEFAULT 'percentage'::character varying NOT NULL,
    workload_value integer DEFAULT 100 NOT NULL,
    type character varying(255) DEFAULT 'part_time'::character varying NOT NULL,
    location_type character varying(255) DEFAULT 'onsite'::character varying NOT NULL,
    location_city character varying(100),
    notes text,
    is_recurring boolean DEFAULT false NOT NULL,
    recurrence_pattern character varying(50),
    deleted_at timestamp(0) without time zone,
    CONSTRAINT availability_windows_location_type_check CHECK (((location_type)::text = ANY ((ARRAY['onsite'::character varying, 'remote'::character varying, 'hybrid'::character varying])::text[]))),
    CONSTRAINT availability_windows_status_check CHECK (((status)::text = ANY ((ARRAY['available'::character varying, 'partially_available'::character varying, 'unavailable'::character varying, 'on_mission'::character varying])::text[]))),
    CONSTRAINT availability_windows_type_check CHECK (((type)::text = ANY ((ARRAY['full_time'::character varying, 'part_time'::character varying, 'freelance'::character varying, 'internship'::character varying, 'mission'::character varying])::text[]))),
    CONSTRAINT availability_windows_workload_unit_check CHECK (((workload_unit)::text = ANY ((ARRAY['percentage'::character varying, 'hours_per_week'::character varying, 'days_per_week'::character varying])::text[])))
);


ALTER TABLE public.availability_windows OWNER TO postgres;

--
-- Name: availability_windows_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.availability_windows_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.availability_windows_id_seq OWNER TO postgres;

--
-- Name: availability_windows_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.availability_windows_id_seq OWNED BY public.availability_windows.id;


--
-- Name: cache; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache (
    key character varying(255) NOT NULL,
    value text NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache OWNER TO postgres;

--
-- Name: cache_locks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.cache_locks (
    key character varying(255) NOT NULL,
    owner character varying(255) NOT NULL,
    expiration bigint NOT NULL
);


ALTER TABLE public.cache_locks OWNER TO postgres;

--
-- Name: certifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.certifications (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    name character varying(150) NOT NULL,
    issuing_organization character varying(150) NOT NULL,
    issue_date date NOT NULL,
    credential_url character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.certifications OWNER TO postgres;

--
-- Name: certifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.certifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.certifications_id_seq OWNER TO postgres;

--
-- Name: certifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.certifications_id_seq OWNED BY public.certifications.id;


--
-- Name: companies; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.companies (
    id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    name character varying(180) NOT NULL,
    slug character varying(220) NOT NULL,
    description text,
    industry character varying(100),
    size character varying(50),
    country character varying(100),
    city character varying(100),
    address character varying(255),
    latitude numeric(10,7),
    longitude numeric(10,7),
    website character varying(255),
    logo_path character varying(255),
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone
);


ALTER TABLE public.companies OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.companies_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.companies_id_seq OWNER TO postgres;

--
-- Name: companies_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.companies_id_seq OWNED BY public.companies.id;


--
-- Name: company_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.company_members (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    user_id bigint NOT NULL,
    role character varying(255) DEFAULT 'member'::character varying NOT NULL,
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    CONSTRAINT company_members_role_check CHECK (((role)::text = ANY ((ARRAY['owner'::character varying, 'admin'::character varying, 'member'::character varying, 'viewer'::character varying])::text[]))),
    CONSTRAINT company_members_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.company_members OWNER TO postgres;

--
-- Name: company_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.company_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.company_members_id_seq OWNER TO postgres;

--
-- Name: company_members_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.company_members_id_seq OWNED BY public.company_members.id;


--
-- Name: conversation_participants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversation_participants (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    user_id bigint NOT NULL,
    last_read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    is_archived boolean DEFAULT false NOT NULL
);


ALTER TABLE public.conversation_participants OWNER TO postgres;

--
-- Name: conversation_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversation_participants_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversation_participants_id_seq OWNER TO postgres;

--
-- Name: conversation_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversation_participants_id_seq OWNED BY public.conversation_participants.id;


--
-- Name: conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.conversations (
    id bigint NOT NULL,
    subject_type character varying(255),
    subject_id bigint,
    title character varying(180),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.conversations OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.conversations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.conversations_id_seq OWNER TO postgres;

--
-- Name: conversations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.conversations_id_seq OWNED BY public.conversations.id;


--
-- Name: document_history; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_history (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    user_id bigint,
    action character varying(50) NOT NULL,
    old_value character varying(255),
    new_value character varying(255),
    notes text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.document_history OWNER TO postgres;

--
-- Name: document_history_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_history_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_history_id_seq OWNER TO postgres;

--
-- Name: document_history_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_history_id_seq OWNED BY public.document_history.id;


--
-- Name: document_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.document_versions (
    id bigint NOT NULL,
    document_id bigint NOT NULL,
    version_number integer NOT NULL,
    file_path character varying(255) NOT NULL,
    original_name character varying(255) NOT NULL,
    mime_type character varying(255),
    size bigint DEFAULT '0'::bigint NOT NULL,
    notes text,
    uploaded_by bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.document_versions OWNER TO postgres;

--
-- Name: document_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.document_versions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.document_versions_id_seq OWNER TO postgres;

--
-- Name: document_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.document_versions_id_seq OWNED BY public.document_versions.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id bigint NOT NULL,
    documentable_type character varying(255) NOT NULL,
    documentable_id bigint NOT NULL,
    uploaded_by bigint NOT NULL,
    type character varying(255) DEFAULT 'other'::character varying NOT NULL,
    file_path character varying(255) NOT NULL,
    version smallint DEFAULT '1'::smallint NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    original_name character varying(255),
    mime_type character varying(100),
    size bigint,
    document_type character varying(50) DEFAULT 'attachment'::character varying NOT NULL,
    current_version integer DEFAULT 1 NOT NULL,
    expires_at timestamp(0) without time zone,
    signed_at timestamp(0) without time zone,
    signed_by bigint,
    notes text,
    deleted_at timestamp(0) without time zone,
    CONSTRAINT documents_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'pending'::character varying, 'signed'::character varying, 'final'::character varying, 'archived'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[]))),
    CONSTRAINT documents_type_check CHECK (((type)::text = ANY ((ARRAY['contract'::character varying, 'agreement'::character varying, 'invoice'::character varying, 'quote'::character varying, 'attachment'::character varying, 'other'::character varying])::text[])))
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.documents_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.documents_id_seq OWNER TO postgres;

--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: educations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.educations (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    institution character varying(150) NOT NULL,
    degree character varying(150) NOT NULL,
    field_of_study character varying(150),
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    study_level character varying(255),
    is_young_talent boolean DEFAULT false NOT NULL
);


ALTER TABLE public.educations OWNER TO postgres;

--
-- Name: educations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.educations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.educations_id_seq OWNER TO postgres;

--
-- Name: educations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.educations_id_seq OWNED BY public.educations.id;


--
-- Name: employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employees (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    user_id bigint,
    "position" character varying(255),
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    email character varying(255),
    first_name character varying(255),
    last_name character varying(255),
    phone character varying(255),
    has_account boolean DEFAULT false NOT NULL,
    CONSTRAINT employees_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying])::text[])))
);


ALTER TABLE public.employees OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.employees_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.employees_id_seq OWNER TO postgres;

--
-- Name: employees_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.employees_id_seq OWNED BY public.employees.id;


--
-- Name: experiences; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.experiences (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    title character varying(150) NOT NULL,
    company character varying(150) NOT NULL,
    location character varying(120),
    start_date date NOT NULL,
    end_date date,
    is_current boolean DEFAULT false NOT NULL,
    description text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.experiences OWNER TO postgres;

--
-- Name: experiences_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.experiences_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.experiences_id_seq OWNER TO postgres;

--
-- Name: experiences_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.experiences_id_seq OWNED BY public.experiences.id;


--
-- Name: failed_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.failed_jobs (
    id bigint NOT NULL,
    uuid character varying(255) NOT NULL,
    connection character varying(255) NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    exception text NOT NULL,
    failed_at timestamp(0) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.failed_jobs OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.failed_jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.failed_jobs_id_seq OWNER TO postgres;

--
-- Name: failed_jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.failed_jobs_id_seq OWNED BY public.failed_jobs.id;


--
-- Name: job_batches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_batches (
    id character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    total_jobs integer NOT NULL,
    pending_jobs integer NOT NULL,
    failed_jobs integer NOT NULL,
    failed_job_ids text NOT NULL,
    options text,
    cancelled_at integer,
    created_at integer NOT NULL,
    finished_at integer
);


ALTER TABLE public.job_batches OWNER TO postgres;

--
-- Name: job_offer_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_offer_skill (
    id bigint NOT NULL,
    job_offer_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    min_level character varying(255) DEFAULT 'beginner'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT job_offer_skill_min_level_check CHECK (((min_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[])))
);


ALTER TABLE public.job_offer_skill OWNER TO postgres;

--
-- Name: job_offer_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_offer_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_offer_skill_id_seq OWNER TO postgres;

--
-- Name: job_offer_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_offer_skill_id_seq OWNED BY public.job_offer_skill.id;


--
-- Name: job_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_offers (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    created_by bigint NOT NULL,
    title character varying(180) NOT NULL,
    description text NOT NULL,
    offer_type character varying(255) NOT NULL,
    duration_text character varying(100),
    remote boolean DEFAULT false NOT NULL,
    country character varying(100),
    city character varying(100),
    salary_min integer,
    salary_max integer,
    currency character varying(3) DEFAULT 'MGA'::character varying NOT NULL,
    criteria text,
    application_deadline date,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT job_offers_offer_type_check CHECK (((offer_type)::text = ANY ((ARRAY['internship'::character varying, 'apprenticeship'::character varying, 'student_project'::character varying, 'junior_mission'::character varying, 'freelance'::character varying, 'fixed_term'::character varying, 'permanent'::character varying, 'first_job'::character varying])::text[]))),
    CONSTRAINT job_offers_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'closed'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.job_offers OWNER TO postgres;

--
-- Name: job_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.job_offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.job_offers_id_seq OWNER TO postgres;

--
-- Name: job_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.job_offers_id_seq OWNED BY public.job_offers.id;


--
-- Name: jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.jobs (
    id bigint NOT NULL,
    queue character varying(255) NOT NULL,
    payload text NOT NULL,
    attempts smallint NOT NULL,
    reserved_at integer,
    available_at integer NOT NULL,
    created_at integer NOT NULL
);


ALTER TABLE public.jobs OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.jobs_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.jobs_id_seq OWNER TO postgres;

--
-- Name: jobs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.jobs_id_seq OWNED BY public.jobs.id;


--
-- Name: languages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.languages (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    name character varying(80) NOT NULL,
    level character varying(255) DEFAULT 'conversational'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT languages_level_check CHECK (((level)::text = ANY ((ARRAY['basic'::character varying, 'conversational'::character varying, 'fluent'::character varying, 'native'::character varying])::text[])))
);


ALTER TABLE public.languages OWNER TO postgres;

--
-- Name: languages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.languages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.languages_id_seq OWNER TO postgres;

--
-- Name: languages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.languages_id_seq OWNED BY public.languages.id;


--
-- Name: match_interactions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_interactions (
    id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.match_interactions OWNER TO postgres;

--
-- Name: match_interactions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_interactions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_interactions_id_seq OWNER TO postgres;

--
-- Name: match_interactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_interactions_id_seq OWNED BY public.match_interactions.id;


--
-- Name: match_weights; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.match_weights (
    id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.match_weights OWNER TO postgres;

--
-- Name: match_weights_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.match_weights_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.match_weights_id_seq OWNER TO postgres;

--
-- Name: match_weights_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.match_weights_id_seq OWNED BY public.match_weights.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id bigint NOT NULL,
    conversation_id bigint NOT NULL,
    sender_id bigint NOT NULL,
    body text NOT NULL,
    attachment_path character varying(255),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    attachment_name character varying(255),
    attachment_type character varying(255)
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.messages_id_seq OWNER TO postgres;

--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    migration character varying(255) NOT NULL,
    batch integer NOT NULL
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- Name: missions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.missions (
    id bigint NOT NULL,
    proposal_id bigint,
    requesting_company_id bigint,
    supplying_company_id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    start_at date NOT NULL,
    end_at date NOT NULL,
    workload_percent smallint DEFAULT '100'::smallint NOT NULL,
    remote boolean DEFAULT false NOT NULL,
    status character varying(255) DEFAULT 'pending_employee'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    resource_offer_id bigint,
    CONSTRAINT missions_status_check CHECK (((status)::text = ANY ((ARRAY['pending_employee'::character varying, 'planned'::character varying, 'active'::character varying, 'completed'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.missions OWNER TO postgres;

--
-- Name: missions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.missions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.missions_id_seq OWNER TO postgres;

--
-- Name: missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.missions_id_seq OWNED BY public.missions.id;


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    type character varying(60) NOT NULL,
    title character varying(180) NOT NULL,
    body text,
    subject_type character varying(255),
    subject_id bigint,
    read_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    data json
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.notifications_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.notifications_id_seq OWNER TO postgres;

--
-- Name: notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.notifications_id_seq OWNED BY public.notifications.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    email character varying(255) NOT NULL,
    token character varying(255) NOT NULL,
    created_at timestamp(0) without time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.personal_access_tokens (
    id bigint NOT NULL,
    tokenable_type character varying(255) NOT NULL,
    tokenable_id bigint NOT NULL,
    name text NOT NULL,
    token character varying(64) NOT NULL,
    abilities text,
    last_used_at timestamp(0) without time zone,
    expires_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.personal_access_tokens OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.personal_access_tokens_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.personal_access_tokens_id_seq OWNER TO postgres;

--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.personal_access_tokens_id_seq OWNED BY public.personal_access_tokens.id;


--
-- Name: portfolio_projects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolio_projects (
    id bigint NOT NULL,
    portfolio_id bigint NOT NULL,
    title character varying(180) NOT NULL,
    description text,
    project_url character varying(255),
    cover_image_path character varying(255),
    "position" smallint DEFAULT '0'::smallint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    start_date date,
    end_date date,
    technologies json,
    project_type character varying(255) DEFAULT 'professional'::character varying NOT NULL
);


ALTER TABLE public.portfolio_projects OWNER TO postgres;

--
-- Name: portfolio_projects_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.portfolio_projects_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolio_projects_id_seq OWNER TO postgres;

--
-- Name: portfolio_projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.portfolio_projects_id_seq OWNED BY public.portfolio_projects.id;


--
-- Name: portfolios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.portfolios (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    public_slug character varying(220) NOT NULL,
    title character varying(180) NOT NULL,
    summary text,
    visibility character varying(255) DEFAULT 'public'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    theme character varying(255) DEFAULT 'minimal'::character varying NOT NULL,
    accent_color character varying(7) DEFAULT '#6EE7C8'::character varying NOT NULL,
    CONSTRAINT portfolios_theme_check CHECK (((theme)::text = ANY ((ARRAY['minimal'::character varying, 'bold'::character varying, 'corporate'::character varying, 'vibrant'::character varying])::text[]))),
    CONSTRAINT portfolios_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'private'::character varying])::text[])))
);


ALTER TABLE public.portfolios OWNER TO postgres;

--
-- Name: portfolios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.portfolios_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.portfolios_id_seq OWNER TO postgres;

--
-- Name: portfolios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.portfolios_id_seq OWNED BY public.portfolios.id;


--
-- Name: professional_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.professional_profiles (
    id bigint NOT NULL,
    user_id bigint NOT NULL,
    profile_type character varying(255) NOT NULL,
    headline character varying(180) NOT NULL,
    bio text,
    visibility character varying(255) DEFAULT 'network'::character varying NOT NULL,
    country character varying(100),
    city character varying(100),
    portfolio_url character varying(255),
    cv_path character varying(255),
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    avatar_path character varying(255),
    linkedin_url character varying(255),
    github_url character varying(255),
    behance_url character varying(255),
    university character varying(255),
    field_of_study character varying(255),
    study_level character varying(255),
    is_young_talent boolean DEFAULT false NOT NULL,
    looking_for_opportunity boolean DEFAULT false NOT NULL,
    CONSTRAINT professional_profiles_profile_type_check CHECK (((profile_type)::text = ANY ((ARRAY['employee'::character varying, 'student'::character varying])::text[]))),
    CONSTRAINT professional_profiles_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'network'::character varying, 'private'::character varying])::text[])))
);


ALTER TABLE public.professional_profiles OWNER TO postgres;

--
-- Name: professional_profiles_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.professional_profiles_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.professional_profiles_id_seq OWNER TO postgres;

--
-- Name: professional_profiles_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.professional_profiles_id_seq OWNED BY public.professional_profiles.id;


--
-- Name: profile_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.profile_skills (
    id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    level character varying(255) DEFAULT 'intermediate'::character varying NOT NULL,
    years_experience smallint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    notes text,
    is_featured boolean DEFAULT false NOT NULL,
    CONSTRAINT profile_skills_level_check CHECK (((level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[])))
);


ALTER TABLE public.profile_skills OWNER TO postgres;

--
-- Name: profile_skills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.profile_skills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.profile_skills_id_seq OWNER TO postgres;

--
-- Name: profile_skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.profile_skills_id_seq OWNED BY public.profile_skills.id;


--
-- Name: proposals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.proposals (
    id bigint NOT NULL,
    resource_request_id bigint,
    professional_profile_id bigint NOT NULL,
    proposed_by_company_id bigint NOT NULL,
    message text,
    match_score smallint,
    status character varying(20) DEFAULT 'draft'::character varying NOT NULL,
    sent_at timestamp(0) without time zone,
    viewed_at timestamp(0) without time zone,
    responded_at timestamp(0) without time zone,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    resource_offer_id bigint,
    to_company_id bigint,
    description text,
    conditions text,
    start_at date,
    end_at date,
    workload_percent smallint,
    remote boolean DEFAULT false NOT NULL,
    expires_at date,
    cancelled_at timestamp(0) without time zone,
    CONSTRAINT proposals_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'sent'::character varying, 'viewed'::character varying, 'accepted'::character varying, 'declined'::character varying, 'expired'::character varying, 'cancelled'::character varying])::text[])))
);


ALTER TABLE public.proposals OWNER TO postgres;

--
-- Name: proposals_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.proposals_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.proposals_id_seq OWNER TO postgres;

--
-- Name: proposals_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.proposals_id_seq OWNED BY public.proposals.id;


--
-- Name: ratings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ratings (
    id bigint NOT NULL,
    mission_id bigint NOT NULL,
    rated_by bigint NOT NULL,
    rater_role character varying(255) NOT NULL,
    skills_score smallint NOT NULL,
    quality_score smallint NOT NULL,
    communication_score smallint NOT NULL,
    punctuality_score smallint NOT NULL,
    collaboration_score smallint NOT NULL,
    comment text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT ratings_rater_role_check CHECK (((rater_role)::text = ANY ((ARRAY['company'::character varying, 'talent'::character varying])::text[])))
);


ALTER TABLE public.ratings OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ratings_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ratings_id_seq OWNER TO postgres;

--
-- Name: ratings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ratings_id_seq OWNED BY public.ratings.id;


--
-- Name: resource_offer_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_offer_skill (
    resource_offer_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    level character varying(255),
    CONSTRAINT resource_offer_skill_level_check CHECK (((level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[])))
);


ALTER TABLE public.resource_offer_skill OWNER TO postgres;

--
-- Name: resource_offers; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_offers (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    professional_profile_id bigint NOT NULL,
    title character varying(180) NOT NULL,
    description text,
    mission_type character varying(255) DEFAULT 'mission'::character varying NOT NULL,
    start_at date NOT NULL,
    end_at date NOT NULL,
    workload_percent smallint DEFAULT '100'::smallint NOT NULL,
    remote boolean DEFAULT false NOT NULL,
    country character varying(100),
    city character varying(100),
    visibility character varying(255) DEFAULT 'public'::character varying NOT NULL,
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    conditions text,
    daily_rate integer,
    hourly_rate integer,
    workload_unit character varying(255) DEFAULT 'percentage'::character varying NOT NULL,
    workload_value integer DEFAULT 100 NOT NULL,
    location_type character varying(255) DEFAULT 'onsite'::character varying NOT NULL,
    location_city character varying(100),
    deleted_at timestamp(0) without time zone,
    CONSTRAINT resource_offers_location_type_check CHECK (((location_type)::text = ANY ((ARRAY['onsite'::character varying, 'remote'::character varying, 'hybrid'::character varying])::text[]))),
    CONSTRAINT resource_offers_mission_type_check CHECK (((mission_type)::text = ANY ((ARRAY['mission'::character varying, 'staffing'::character varying, 'freelance'::character varying, 'other'::character varying])::text[]))),
    CONSTRAINT resource_offers_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'closed'::character varying])::text[]))),
    CONSTRAINT resource_offers_visibility_check CHECK (((visibility)::text = ANY ((ARRAY['public'::character varying, 'network'::character varying, 'private'::character varying])::text[]))),
    CONSTRAINT resource_offers_workload_unit_check CHECK (((workload_unit)::text = ANY ((ARRAY['percentage'::character varying, 'hours_per_week'::character varying, 'days_per_week'::character varying])::text[])))
);


ALTER TABLE public.resource_offers OWNER TO postgres;

--
-- Name: resource_offers_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_offers_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_offers_id_seq OWNER TO postgres;

--
-- Name: resource_offers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_offers_id_seq OWNED BY public.resource_offers.id;


--
-- Name: resource_request_skill; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_request_skill (
    id bigint NOT NULL,
    resource_request_id bigint NOT NULL,
    skill_id bigint NOT NULL,
    min_level character varying(255) DEFAULT 'intermediate'::character varying NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    CONSTRAINT resource_request_skill_min_level_check CHECK (((min_level)::text = ANY ((ARRAY['beginner'::character varying, 'intermediate'::character varying, 'advanced'::character varying, 'expert'::character varying])::text[])))
);


ALTER TABLE public.resource_request_skill OWNER TO postgres;

--
-- Name: resource_request_skill_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_request_skill_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_request_skill_id_seq OWNER TO postgres;

--
-- Name: resource_request_skill_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_request_skill_id_seq OWNED BY public.resource_request_skill.id;


--
-- Name: resource_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.resource_requests (
    id bigint NOT NULL,
    company_id bigint NOT NULL,
    created_by bigint NOT NULL,
    title character varying(180) NOT NULL,
    description text NOT NULL,
    start_at date NOT NULL,
    end_at date NOT NULL,
    workload_percent smallint DEFAULT '100'::smallint NOT NULL,
    remote boolean DEFAULT false NOT NULL,
    country character varying(100),
    city character varying(100),
    status character varying(255) DEFAULT 'draft'::character varying NOT NULL,
    expires_at date,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    budget_min integer,
    budget_max integer,
    positions_count smallint DEFAULT '1'::smallint NOT NULL,
    urgency character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    tags json,
    views_count integer DEFAULT 0 NOT NULL,
    proposals_count integer DEFAULT 0 NOT NULL,
    closed_reason character varying(20),
    closed_at timestamp(0) without time zone,
    CONSTRAINT resource_requests_status_check CHECK (((status)::text = ANY ((ARRAY['draft'::character varying, 'published'::character varying, 'paused'::character varying, 'closed'::character varying, 'filled'::character varying, 'expired'::character varying])::text[])))
);


ALTER TABLE public.resource_requests OWNER TO postgres;

--
-- Name: resource_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.resource_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.resource_requests_id_seq OWNER TO postgres;

--
-- Name: resource_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.resource_requests_id_seq OWNED BY public.resource_requests.id;


--
-- Name: saved_searches; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.saved_searches (
    id bigint NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.saved_searches OWNER TO postgres;

--
-- Name: saved_searches_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.saved_searches_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.saved_searches_id_seq OWNER TO postgres;

--
-- Name: saved_searches_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.saved_searches_id_seq OWNED BY public.saved_searches.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.sessions (
    id character varying(255) NOT NULL,
    user_id bigint,
    ip_address character varying(45),
    user_agent text,
    payload text NOT NULL,
    last_activity integer NOT NULL
);


ALTER TABLE public.sessions OWNER TO postgres;

--
-- Name: skill_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skill_categories (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    slug character varying(120) NOT NULL,
    parent_id bigint,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    icon character varying(60),
    "position" integer DEFAULT 0 NOT NULL,
    description text
);


ALTER TABLE public.skill_categories OWNER TO postgres;

--
-- Name: skill_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skill_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skill_categories_id_seq OWNER TO postgres;

--
-- Name: skill_categories_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skill_categories_id_seq OWNED BY public.skill_categories.id;


--
-- Name: skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.skills (
    id bigint NOT NULL,
    skill_category_id bigint,
    name character varying(120) NOT NULL,
    slug character varying(140) NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    description text,
    "position" integer DEFAULT 0 NOT NULL
);


ALTER TABLE public.skills OWNER TO postgres;

--
-- Name: skills_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.skills_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.skills_id_seq OWNER TO postgres;

--
-- Name: skills_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.skills_id_seq OWNED BY public.skills.id;


--
-- Name: universities; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.universities (
    id bigint NOT NULL,
    owner_user_id bigint NOT NULL,
    name character varying(180) NOT NULL,
    slug character varying(220) NOT NULL,
    description text,
    country character varying(100),
    city character varying(100),
    address character varying(255),
    latitude numeric(10,7),
    longitude numeric(10,7),
    website character varying(255),
    logo_path character varying(255),
    is_verified boolean DEFAULT false NOT NULL,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone
);


ALTER TABLE public.universities OWNER TO postgres;

--
-- Name: universities_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.universities_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.universities_id_seq OWNER TO postgres;

--
-- Name: universities_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.universities_id_seq OWNED BY public.universities.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id bigint NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    email_verified_at timestamp(0) without time zone,
    password character varying(255) NOT NULL,
    remember_token character varying(100),
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    role character varying(255) DEFAULT 'employee'::character varying NOT NULL,
    phone character varying(255),
    avatar_path character varying(255),
    status character varying(255) DEFAULT 'active'::character varying NOT NULL,
    deleted_at timestamp(0) without time zone,
    first_name character varying(100),
    last_name character varying(100),
    country character varying(100),
    theme_preference character varying(20) DEFAULT 'dark'::character varying NOT NULL,
    font_size character varying(20) DEFAULT 'normal'::character varying NOT NULL,
    high_contrast boolean DEFAULT false NOT NULL,
    reduce_motion boolean DEFAULT false NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['admin'::character varying, 'company'::character varying, 'employee'::character varying, 'student'::character varying, 'university'::character varying])::text[]))),
    CONSTRAINT users_status_check CHECK (((status)::text = ANY ((ARRAY['active'::character varying, 'inactive'::character varying, 'suspended'::character varying])::text[])))
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.users_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.users_id_seq OWNER TO postgres;

--
-- Name: users_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;


--
-- Name: verification_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.verification_requests (
    id bigint NOT NULL,
    verifiable_type character varying(255) NOT NULL,
    verifiable_id bigint NOT NULL,
    requested_by bigint NOT NULL,
    reviewed_by bigint,
    document_path character varying(255),
    status character varying(255) DEFAULT 'pending'::character varying NOT NULL,
    review_note text,
    created_at timestamp(0) without time zone,
    updated_at timestamp(0) without time zone,
    deleted_at timestamp(0) without time zone,
    CONSTRAINT verification_requests_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.verification_requests OWNER TO postgres;

--
-- Name: verification_requests_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.verification_requests_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.verification_requests_id_seq OWNER TO postgres;

--
-- Name: verification_requests_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.verification_requests_id_seq OWNED BY public.verification_requests.id;


--
-- Name: applications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications ALTER COLUMN id SET DEFAULT nextval('public.applications_id_seq'::regclass);


--
-- Name: availability_windows id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_windows ALTER COLUMN id SET DEFAULT nextval('public.availability_windows_id_seq'::regclass);


--
-- Name: certifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications ALTER COLUMN id SET DEFAULT nextval('public.certifications_id_seq'::regclass);


--
-- Name: companies id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies ALTER COLUMN id SET DEFAULT nextval('public.companies_id_seq'::regclass);


--
-- Name: company_members id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members ALTER COLUMN id SET DEFAULT nextval('public.company_members_id_seq'::regclass);


--
-- Name: conversation_participants id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants ALTER COLUMN id SET DEFAULT nextval('public.conversation_participants_id_seq'::regclass);


--
-- Name: conversations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations ALTER COLUMN id SET DEFAULT nextval('public.conversations_id_seq'::regclass);


--
-- Name: document_history id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_history ALTER COLUMN id SET DEFAULT nextval('public.document_history_id_seq'::regclass);


--
-- Name: document_versions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions ALTER COLUMN id SET DEFAULT nextval('public.document_versions_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: educations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.educations ALTER COLUMN id SET DEFAULT nextval('public.educations_id_seq'::regclass);


--
-- Name: employees id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees ALTER COLUMN id SET DEFAULT nextval('public.employees_id_seq'::regclass);


--
-- Name: experiences id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiences ALTER COLUMN id SET DEFAULT nextval('public.experiences_id_seq'::regclass);


--
-- Name: failed_jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs ALTER COLUMN id SET DEFAULT nextval('public.failed_jobs_id_seq'::regclass);


--
-- Name: job_offer_skill id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offer_skill ALTER COLUMN id SET DEFAULT nextval('public.job_offer_skill_id_seq'::regclass);


--
-- Name: job_offers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers ALTER COLUMN id SET DEFAULT nextval('public.job_offers_id_seq'::regclass);


--
-- Name: jobs id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs ALTER COLUMN id SET DEFAULT nextval('public.jobs_id_seq'::regclass);


--
-- Name: languages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages ALTER COLUMN id SET DEFAULT nextval('public.languages_id_seq'::regclass);


--
-- Name: match_interactions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_interactions ALTER COLUMN id SET DEFAULT nextval('public.match_interactions_id_seq'::regclass);


--
-- Name: match_weights id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_weights ALTER COLUMN id SET DEFAULT nextval('public.match_weights_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- Name: missions id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions ALTER COLUMN id SET DEFAULT nextval('public.missions_id_seq'::regclass);


--
-- Name: notifications id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications ALTER COLUMN id SET DEFAULT nextval('public.notifications_id_seq'::regclass);


--
-- Name: personal_access_tokens id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens ALTER COLUMN id SET DEFAULT nextval('public.personal_access_tokens_id_seq'::regclass);


--
-- Name: portfolio_projects id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_projects ALTER COLUMN id SET DEFAULT nextval('public.portfolio_projects_id_seq'::regclass);


--
-- Name: portfolios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolios ALTER COLUMN id SET DEFAULT nextval('public.portfolios_id_seq'::regclass);


--
-- Name: professional_profiles id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_profiles ALTER COLUMN id SET DEFAULT nextval('public.professional_profiles_id_seq'::regclass);


--
-- Name: profile_skills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_skills ALTER COLUMN id SET DEFAULT nextval('public.profile_skills_id_seq'::regclass);


--
-- Name: proposals id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals ALTER COLUMN id SET DEFAULT nextval('public.proposals_id_seq'::regclass);


--
-- Name: ratings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings ALTER COLUMN id SET DEFAULT nextval('public.ratings_id_seq'::regclass);


--
-- Name: resource_offers id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offers ALTER COLUMN id SET DEFAULT nextval('public.resource_offers_id_seq'::regclass);


--
-- Name: resource_request_skill id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_request_skill ALTER COLUMN id SET DEFAULT nextval('public.resource_request_skill_id_seq'::regclass);


--
-- Name: resource_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_requests ALTER COLUMN id SET DEFAULT nextval('public.resource_requests_id_seq'::regclass);


--
-- Name: saved_searches id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_searches ALTER COLUMN id SET DEFAULT nextval('public.saved_searches_id_seq'::regclass);


--
-- Name: skill_categories id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories ALTER COLUMN id SET DEFAULT nextval('public.skill_categories_id_seq'::regclass);


--
-- Name: skills id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills ALTER COLUMN id SET DEFAULT nextval('public.skills_id_seq'::regclass);


--
-- Name: universities id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities ALTER COLUMN id SET DEFAULT nextval('public.universities_id_seq'::regclass);


--
-- Name: users id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);


--
-- Name: verification_requests id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_requests ALTER COLUMN id SET DEFAULT nextval('public.verification_requests_id_seq'::regclass);


--
-- Data for Name: applications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.applications (id, job_offer_id, professional_profile_id, portfolio_id, cover_letter, cv_path, status, created_at, updated_at, viewed_at, shortlisted_at, interview_at, decided_at, recruiter_notes, interview_link, interview_timezone, interview_reminder_sent) FROM stdin;
1	1	4	2	hdkkaloidnhhdkckhhdhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhhh	cvs/AguhwTQqufYEOwoo3q9AIJsHQ40GM3Tx3euCOygv.pdf	interview	2026-09-23 13:06:52	2026-09-23 13:20:26	2026-09-23 13:19:01	\N	2026-09-23 13:20:26	\N	\N	\N	Indian/Antananarivo	f
2	2	3	1	JDHGFKKPSPOIDHGGSUJZIOAOKZJDHDHJKSZOAOUDHYYHHFHHSJJSJD	cvs/gpGykzJlpAeM2go5rIAMRGubNl9q0BGPW9tJMgXB.pdf	interview	2026-09-24 07:01:28	2026-09-24 07:02:01	2026-09-24 07:01:52	\N	2026-09-24 07:02:01	\N	\N	\N	Indian/Antananarivo	f
3	2	4	2	jhdhdooqaojjdhdggdhhbxxvvfsfqfrqysuuudggdggbdhhsjqkki	cvs/AguhwTQqufYEOwoo3q9AIJsHQ40GM3Tx3euCOygv.pdf	interview	2026-10-01 07:07:22	2026-10-01 07:27:40	2026-10-01 07:08:23	\N	2026-10-03 10:00:00	\N	\N	https://meet.jit.si/talentshare-3-aO02rA7Kxj	Indian/Antananarivo	f
4	3	4	2	jspajdiopapkdhdhhhddddddddddddddddddddddddddddddddddddddddd	cvs/AguhwTQqufYEOwoo3q9AIJsHQ40GM3Tx3euCOygv.pdf	accepted	2026-10-01 08:37:17	2026-10-01 11:20:08	2026-10-01 08:38:27	2026-10-01 11:19:54	2026-10-04 17:20:00	2026-10-01 11:20:08	\N	https://meet.jit.si/talentshare-4-1AHUO885WH	Indian/Antananarivo	f
\.


--
-- Data for Name: availability_windows; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.availability_windows (id, professional_profile_id, start_at, end_at, status, workload_percent, remote, created_at, updated_at, workload_unit, workload_value, type, location_type, location_city, notes, is_recurring, recurrence_pattern, deleted_at) FROM stdin;
2	4	2026-01-11	2026-09-03	available	100	f	2026-09-11 09:46:03	2026-09-11 09:46:03	percentage	100	part_time	onsite	\N	laravel	t	weekly	\N
1	3	2026-01-10	2026-12-15	available	25	f	2026-09-10 12:46:31	2026-09-15 12:04:50	percentage	25	freelance	onsite	jsp	haha	t	biweekly	\N
\.


--
-- Data for Name: cache; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache (key, value, expiration) FROM stdin;
talentshare-cache-5c785c036466adea360111aa28563bfd556b5fba:timer	i:1791180060;	1791180060
talentshare-cache-5c785c036466adea360111aa28563bfd556b5fba	i:1;	1791180060
\.


--
-- Data for Name: cache_locks; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.cache_locks (key, owner, expiration) FROM stdin;
\.


--
-- Data for Name: certifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.certifications (id, professional_profile_id, name, issuing_organization, issue_date, credential_url, created_at, updated_at) FROM stdin;
1	1	AWS Certified Developer	Amazon	2025-03-01	\N	2026-09-08 08:12:53	2026-09-08 08:12:53
2	3	HAHA	HAHA	2026-09-09	\N	2026-09-08 13:14:29	2026-09-08 13:14:29
3	3	ATTESTATION	ONG	2026-09-05	https://claude.ai/chat/932f2eec-491b-4dd2-b695-76cf9a3d070c	2026-09-08 16:45:13	2026-09-08 16:45:13
4	3	h	h	2026-09-03	https://claude.ai/chat/932f2eec-491b-4dd2-b695-76cf9a3d070c	2026-09-09 17:00:39	2026-09-09 17:00:39
\.


--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.companies (id, owner_user_id, name, slug, description, industry, size, country, city, address, latitude, longitude, website, logo_path, is_verified, created_at, updated_at, deleted_at) FROM stdin;
1	2	HI Holie	hi-holie	Ventede coussins en gel	TANA	201-500	Madagascar	Blantyre	FIANARANTSOA	1.0000000	1.0000000	http://localhost:5173/company	\N	t	2026-09-07 14:22:51	2026-09-07 19:26:04	\N
3	7	RAN CONSUTING ANGENCY	ran-consuting-angency	JSP EORE	INFORMATIQUE	1-10	Libye	Fianarantsoa	FIANARANTSOA	\N	\N	https://mail.google.com/mail/u/0/#inbox/FMfcgzQhWfWjNdVfrKZcPWGMFFHMCJWW	\N	f	2026-10-01 08:35:31	2026-10-01 08:35:31	\N
2	6	TechCorp	techcorp	RIEN	Informatique	201-500	Madagascar	Manakara	FIANARANTSOA	1.0000000	1.0000000	https://www.portaljob-madagascar.com/emploi/liste?page=1	company-logos/EQ9IbbW5Pgipw4rsU54DV0RwpcxUlf0BEwEUhex3.jpg	f	2026-09-10 20:03:30	2026-10-05 05:58:12	\N
\.


--
-- Data for Name: company_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.company_members (id, company_id, user_id, role, status, created_at, updated_at, deleted_at) FROM stdin;
1	1	2	owner	active	2026-09-07 14:22:51	2026-09-07 14:22:51	\N
2	1	1	member	active	2026-09-07 14:33:30	2026-09-07 14:33:30	\N
3	2	6	owner	active	2026-09-10 20:03:30	2026-09-10 20:03:30	\N
4	2	1	member	active	2026-09-10 20:04:16	2026-09-10 20:04:16	\N
5	3	7	owner	active	2026-10-01 08:35:31	2026-10-01 08:35:31	\N
\.


--
-- Data for Name: conversation_participants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversation_participants (id, conversation_id, user_id, last_read_at, created_at, updated_at, is_archived) FROM stdin;
6	3	2	\N	2026-10-01 11:51:33	2026-10-01 11:51:33	f
8	4	5	\N	2026-10-01 12:19:24	2026-10-01 12:19:24	f
2	1	2	2026-09-14 07:11:47	2026-09-13 08:21:35	2026-09-14 07:11:47	f
4	2	7	2026-10-01 12:34:02	2026-10-01 11:33:27	2026-10-01 12:34:02	f
9	4	7	2026-10-01 12:54:26	2026-10-01 12:19:24	2026-10-01 12:54:26	f
7	4	6	2026-10-01 12:56:11	2026-10-01 12:19:24	2026-10-01 12:56:11	f
1	1	6	2026-09-15 13:06:48	2026-09-13 08:21:35	2026-09-15 13:06:48	f
5	3	7	2026-10-01 12:34:12	2026-10-01 11:51:33	2026-10-01 12:34:12	f
3	2	1	2026-10-01 11:39:41	2026-10-01 11:33:27	2026-10-01 11:39:41	f
\.


--
-- Data for Name: conversations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.conversations (id, subject_type, subject_id, title, created_at, updated_at) FROM stdin;
1	\N	\N	\N	2026-09-13 08:21:35	2026-09-13 08:33:12
2	\N	\N	\N	2026-10-01 11:33:27	2026-10-01 11:39:35
3	\N	\N	\N	2026-10-01 11:51:33	2026-10-01 11:51:38
4	\N	\N	L3 ig 2	2026-10-01 12:19:24	2026-10-01 12:24:45
\.


--
-- Data for Name: document_history; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_history (id, document_id, user_id, action, old_value, new_value, notes, created_at, updated_at) FROM stdin;
1	4	6	created	\N	\N	Document uploadé : ETUDIANT.txt	2026-10-01 13:02:21	2026-10-01 13:02:21
2	4	6	signed	draft	signed	Document marqué comme signé	2026-10-01 13:05:27	2026-10-01 13:05:27
3	4	6	downloaded	\N	\N	Téléchargement	2026-10-01 13:05:31	2026-10-01 13:05:31
\.


--
-- Data for Name: document_versions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.document_versions (id, document_id, version_number, file_path, original_name, mime_type, size, notes, uploaded_by, created_at, updated_at) FROM stdin;
1	4	1	documents/2026/10/TaX4iStzsSu3gO6VkTiczeEgg6fwnJ3TXtSN5MGy.txt	ETUDIANT.txt	text/plain	8796	\N	6	2026-10-01 13:02:21	2026-10-01 13:02:21
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.documents (id, documentable_type, documentable_id, uploaded_by, type, file_path, version, status, created_at, updated_at, original_name, mime_type, size, document_type, current_version, expires_at, signed_at, signed_by, notes, deleted_at) FROM stdin;
1	App\\Models\\Proposal	6	6	attachment	documents/proposals/6/XZzocJierhO0H9WBboMdSJ1wl6URlslDTy86ek7T.pdf	1	draft	2026-09-17 12:43:18	2026-09-17 12:43:18	Document_2026-08-31_141456.pdf	application/pdf	2022932	attachment	1	\N	\N	\N	\N	\N
2	App\\Models\\Proposal	7	6	attachment	documents/proposals/7/kl9U09FvnAoyJ6RjjrtI2HPgQbQb7qeW0sG6YQt0.pdf	1	draft	2026-09-21 06:10:32	2026-09-21 06:10:32	MASTERFILE_Holie_SAV_Historique_Discussions.pdf	application/pdf	28765	attachment	1	\N	\N	\N	\N	\N
4	App\\Models\\Mission	7	6	invoice	documents/2026/10/TaX4iStzsSu3gO6VkTiczeEgg6fwnJ3TXtSN5MGy.txt	1	signed	2026-10-01 13:02:21	2026-10-01 13:05:27	ETUDIANT.txt	text/plain	8796	invoice	1	2026-10-04 00:00:00	2026-10-01 13:05:27	6	\N	\N
\.


--
-- Data for Name: educations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.educations (id, professional_profile_id, institution, degree, field_of_study, start_date, end_date, is_current, created_at, updated_at, study_level, is_young_talent) FROM stdin;
1	1	Universite Antananarivo	Licence Informatique	\N	2020-09-01	2023-06-30	f	2026-09-08 08:12:38	2026-09-08 08:12:38	\N	f
2	3	LOVA	HAHA	HAHA	2026-09-16	\N	f	2026-09-08 13:16:16	2026-09-08 13:16:16	\N	f
3	3	haha	haha	haha	2026-09-03	2026-09-04	f	2026-09-09 13:20:39	2026-09-09 13:20:39	\N	f
4	3	hahaha	hahha	haha	2026-09-01	2026-09-05	t	2026-09-09 17:00:17	2026-09-09 17:00:17	\N	f
5	4	SFX	haha	INFO	2026-09-03	2026-09-23	f	2026-09-23 08:07:27	2026-09-23 08:07:27	L2	t
\.


--
-- Data for Name: employees; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.employees (id, company_id, user_id, "position", status, created_at, updated_at, deleted_at, email, first_name, last_name, phone, has_account) FROM stdin;
1	1	\N	Comunity manager	active	2026-09-08 07:39:36	2026-09-08 07:39:36	\N	anthony@gmail.com	ANTHONY	RAKOTONDRASOA	0342606735	f
2	1	\N	Dévellopeur	active	2026-09-08 07:43:59	2026-09-08 07:43:59	\N	nyavo@gmail.com	NYAVO	RAM	0383701210	f
3	2	1	Dévellopeur laravel backend	active	2026-09-10 20:25:00	2026-09-10 20:25:00	\N	candylovaniaina@gmail.com	Lovaniaina	Candy	0383701210	t
\.


--
-- Data for Name: experiences; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.experiences (id, professional_profile_id, title, company, location, start_date, end_date, is_current, description, created_at, updated_at) FROM stdin;
1	1	Developpeur Laravel	Acme	\N	2024-01-01	\N	t	Dev backend	2026-09-08 08:11:17	2026-09-08 08:11:17
2	3	STAGE	ACCORD KNITS	TANJOMBATO	2026-02-11	2026-09-04	f	LOVA SAGE	2026-09-08 16:44:06	2026-09-08 16:44:06
3	3	haha	haha	haha	2026-09-02	2026-09-08	f	haha	2026-09-09 16:59:57	2026-09-09 16:59:57
\.


--
-- Data for Name: failed_jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.failed_jobs (id, uuid, connection, queue, payload, exception, failed_at) FROM stdin;
\.


--
-- Data for Name: job_batches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_batches (id, name, total_jobs, pending_jobs, failed_jobs, failed_job_ids, options, cancelled_at, created_at, finished_at) FROM stdin;
\.


--
-- Data for Name: job_offer_skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_offer_skill (id, job_offer_id, skill_id, min_level, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: job_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.job_offers (id, company_id, created_by, title, description, offer_type, duration_text, remote, country, city, salary_min, salary_max, currency, criteria, application_deadline, status, created_at, updated_at) FROM stdin;
1	2	6	Dev junior	jkdkdhfhjkslkdnchjkkkshhd	apprenticeship	\N	t	Madagascar	Antananarivo	\N	\N	MGA	\N	2026-09-24	published	2026-09-23 12:43:35	2026-09-23 12:43:35
2	2	6	LOGISTIC COMMERCIAL	JSP ENCORE DE CE QUIPI PAPJD	internship	\N	t	Madagascar	ANTANANARIVO	\N	\N	MGA	\N	2026-09-27	published	2026-09-24 07:00:26	2026-09-24 07:00:26
3	3	7	Assisstante virtuelle	jsp encore mais je suis mapme	first_job	\N	t	Madagascar	Antananarivo	\N	\N	MGA	\N	2026-10-04	published	2026-10-01 08:36:33	2026-10-01 08:36:33
\.


--
-- Data for Name: jobs; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.jobs (id, queue, payload, attempts, reserved_at, available_at, created_at) FROM stdin;
\.


--
-- Data for Name: languages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.languages (id, professional_profile_id, name, level, created_at, updated_at) FROM stdin;
1	1	Francais	native	2026-09-08 08:13:05	2026-09-08 08:13:05
2	3	Portugais	native	2026-09-08 13:16:26	2026-09-08 13:16:26
3	3	Chinois	native	2026-09-08 16:44:30	2026-09-08 16:44:30
4	3	Arabe	fluent	2026-09-09 13:18:09	2026-09-09 13:18:09
5	3	Italien	fluent	2026-09-09 17:00:51	2026-09-09 17:00:51
\.


--
-- Data for Name: match_interactions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_interactions (id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: match_weights; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.match_weights (id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.messages (id, conversation_id, sender_id, body, attachment_path, created_at, updated_at, attachment_name, attachment_type) FROM stdin;
1	1	2	j'ai vu votre offre,et ca m'interesse	\N	2026-09-13 08:21:35	2026-09-13 08:21:35	\N	\N
2	1	6	oui oui c'est encore valable	\N	2026-09-13 08:22:37	2026-09-13 08:22:37	\N	\N
3	1	6	et alors??	\N	2026-09-13 08:28:49	2026-09-13 08:28:49	\N	\N
4	1	2	C'est OK	\N	2026-09-13 08:33:12	2026-09-13 08:33:12	\N	\N
5	2	1	heyyyy	\N	2026-10-01 11:33:35	2026-10-01 11:33:35	\N	\N
6	2	1	🙂‍↔️	\N	2026-10-01 11:39:22	2026-10-01 11:39:22	\N	\N
7	2	1		messages/huVFgLu9Vjpd0T29A9P5IVryZeiLBhDX4f6i30bY.jpg	2026-10-01 11:39:35	2026-10-01 11:39:35	1000023477.jpg	image/jpeg
8	3	7	hahah	\N	2026-10-01 11:51:38	2026-10-01 11:51:38	\N	\N
9	4	7	jjj	\N	2026-10-01 12:24:45	2026-10-01 12:24:45	\N	\N
\.


--
-- Data for Name: migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migrations (id, migration, batch) FROM stdin;
1	0001_01_01_000000_create_users_table	1
2	0001_01_01_000001_create_cache_table	1
3	0001_01_01_000002_create_jobs_table	1
4	2026_08_31_183415_create_personal_access_tokens_table	1
5	2026_09_01_054839_add_role_and_profile_fields_to_users_table	1
6	2026_09_01_054900_create_companies_table	1
7	2026_09_01_054913_create_universities_table	1
8	2026_09_01_054924_create_skill_categories_table	1
9	2026_09_01_055015_create_skills_table	1
10	2026_09_01_055027_create_professional_profiles_table	1
11	2026_09_01_055037_create_profile_skills_table	1
12	2026_09_01_065657_create_availability_windows_table	1
13	2026_09_01_065750_create_portfolios_table	1
14	2026_09_01_065806_create_portfolio_projects_table	1
15	2026_09_01_121242_create_resource_offers_table	1
16	2026_09_01_122915_create_resource_requests_table	1
17	2026_09_01_123041_create_resource_request_skill_table	1
18	2026_09_01_123246_create_proposals_table	1
19	2026_09_01_123402_create_missions_table	1
20	2026_09_02_175837_create_job_offers_table	1
21	2026_09_02_175847_create_job_offer_skill_table	1
22	2026_09_02_175857_create_applications_table	1
23	2026_09_02_190042_create_conversations_table	1
24	2026_09_02_190054_create_conversation_participants_table	1
25	2026_09_02_190104_create_messages_table	1
26	2026_09_02_190112_create_notifications_table	1
27	2026_09_02_190120_create_ratings_table	1
28	2026_09_02_190127_create_verification_requests_table	1
29	2026_09_02_190139_create_documents_table	1
30	2026_09_03_175946_add_avatar_to_professional_profiles_table	1
31	2026_09_07_083522_add_soft_deletes_to_users_table	1
32	2026_09_07_130623_add_soft_deletes_to_companies_table	1
33	2026_09_07_131225_create_company_members_table	1
34	2026_09_07_143444_add_soft_deletes_to_verification_requests_table	2
35	2026_09_08_071921_create_employees_table	3
36	2026_09_08_073144_modify_employees_table_for_guest	3
37	2026_09_08_075346_add_social_links_to_professional_profiles_table	4
38	2026_09_08_075357_create_experiences_table	4
39	2026_09_08_075418_create_educations_table	4
40	2026_09_08_075433_create_certifications_table	4
41	2026_09_08_075443_create_languages_table	4
42	2026_09_08_173031_add_fields_to_portfolio_projects_table	5
43	2026_09_08_183738_add_theme_to_portfolios_table	6
44	2026_09_10_114959_add_fields_to_skill_categories_table	7
45	2026_09_10_115008_add_fields_to_skills_table	7
46	2026_09_10_115026_add_notes_to_profile_skills_table	7
47	2026_09_10_123445_add_fields_to_availability_windows_table	8
48	2026_09_10_194831_add_fields_to_resource_offers_table	9
49	2026_09_11_092219_add_first_last_name_to_users	10
50	2026_09_11_092219_add_first_last_name_to_users	2
51	2026_09_13_082509_add_data_to_notifications_table	11
52	2026_09_13_083505_add_resource_offer_id_to_missions_table	12
54	2026_09_13_084538_make_proposal_id_nullable_on_missions_table	13
55	2026_09_13_085200_make_mission_foreign_keys_nullable	13
56	2026_09_13_113457_add_pending_employee_status_to_missions	14
57	2026_09_14_112953_create_saved_searches_table	15
58	2026_09_14_113002_create_match_interactions_table	15
59	2026_09_14_113003_create_match_weights_table	15
60	2026_09_15_124221_add_p09_fields_to_resource_requests_table	16
61	2026_09_15_124230_update_status_enum_in_resource_requests	16
63	2026_09_17_120110_add_p011_fields_to_proposals_table	17
64	2026_09_17_123244_add_metadata_to_documents_table	17
65	2026_09_21_061157_fix_proposals_status_check_constraint	18
66	2026_09_22_123321_add_preferences_to_users_table	19
67	2026_09_23_074817_add_young_talent_fields_to_educations_table	20
68	2026_09_23_074902_add_project_type_to_portfolio_projects_table	20
69	2026_09_23_074922_add_young_talent_fields_to_professional_profiles_table	20
70	2026_09_23_120232_add_tracking_fields_to_applications_table	21
71	2026_09_24_073120_add_interview_fields_to_applications_table	22
72	2026_10_01_081415_add_interview_reminder_sent_to_applications_table	23
73	2026_10_01_113630_add_attachment_to_messages_table	24
74	2026_10_01_120129_add_is_archived_to_conversation_participants_table	25
75	2026_10_01_124457_enrich_documents_table_for_p023	26
76	2026_10_01_124526_create_document_versions_table	26
77	2026_10_01_124545_create_document_history_table	26
78	2026_10_01_130126_fix_documents_check_constraints	27
79	2026_10_01_130439_add_soft_deletes_to_documents_table	28
\.


--
-- Data for Name: missions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.missions (id, proposal_id, requesting_company_id, supplying_company_id, professional_profile_id, start_at, end_at, workload_percent, remote, status, created_at, updated_at, resource_offer_id) FROM stdin;
5	\N	1	2	4	2026-06-11	2026-09-13	100	t	completed	2026-09-13 12:27:02	2026-09-13 13:11:27	1
6	1	2	2	3	2026-09-18	2026-12-01	50	t	planned	2026-09-15 14:39:25	2026-09-15 14:39:25	\N
7	5	1	2	4	2026-02-10	2026-09-16	100	f	active	2026-09-17 12:22:06	2026-09-17 12:23:00	\N
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.notifications (id, user_id, type, title, body, subject_type, subject_id, read_at, created_at, updated_at, data) FROM stdin;
2	6	new_message	💬 Nouveau message	Holie Hello : C'est OK	App\\Models\\Message	4	\N	2026-09-13 08:33:12	2026-09-13 08:33:12	\N
3	1	mission_created	🎉 Une mission a été créée	Vous êtes prêté à une nouvelle entreprise du 11/06/2026 au 13/09/2026	App\\Models\\Mission	4	2026-09-13 12:30:19	2026-09-13 08:57:34	2026-09-13 12:30:19	\N
5	6	offer_viewed	👀 Votre offre a été consultée	Lovaniaina Candy Aina a consulté votre offre "Développeur Laravel senior".	App\\Models\\ResourceOffer	1	\N	2026-09-13 12:33:58	2026-09-13 12:33:58	\N
4	1	mission_pending_approval	🎯 Nouvelle mission proposée	L'entreprise TechCorp souhaite vous prêter du 11/06/2026 au 13/09/2026. En attente de votre accord.	App\\Models\\Mission	5	2026-09-13 12:34:20	2026-09-13 12:27:03	2026-09-13 12:34:20	\N
1	2	new_message	💬 Nouveau message	TechCorp : et alors??	App\\Models\\Message	3	2026-09-13 12:48:23	2026-09-13 08:28:49	2026-09-13 12:48:23	\N
7	2	mission_accepted	 Mission acceptée	Le salarié a accepté la mission du 11/06/2026. Elle peut démarrer.	App\\Models\\Mission	5	2026-09-13 13:00:24	2026-09-13 12:54:21	2026-09-13 13:00:24	\N
6	6	mission_accepted	✅ Mission acceptée	Lovaniaina Candy Aina a accepté la mission du 11/06/2026 au 13/09/2026.	App\\Models\\Mission	5	2026-09-17 11:38:53	2026-09-13 12:43:00	2026-09-17 11:38:53	\N
8	6	offer_viewed	👀 Votre offre a été consultée	Holie Hello a consulté votre offre "Développeur Laravel senior".	App\\Models\\ResourceOffer	1	2026-09-17 11:39:14	2026-09-13 13:11:48	2026-09-17 11:39:14	\N
9	6	proposal_accepted	Votre proposition a été acceptée	Mission créée pour "Community manager".	App\\Models\\Mission	6	2026-09-17 11:39:38	2026-09-15 14:39:25	2026-09-17 11:39:38	\N
10	2	proposal_received	📥 Nouvelle proposition reçue	TechCorp vous propose : Lovaniaina Candy Aina	App\\Models\\Proposal	5	2026-09-17 12:21:59	2026-09-17 12:21:18	2026-09-17 12:21:59	\N
11	6	proposal_accepted	✅ Votre proposition a été acceptée	Mission créée pour "Lovaniaina Candy Aina".	App\\Models\\Mission	7	2026-09-17 12:22:54	2026-09-17 12:22:06	2026-09-17 12:22:54	\N
13	2	proposal_received	📥 Nouvelle proposition reçue	TechCorp vous propose : Lovaniaina Candy Aina	App\\Models\\Proposal	6	\N	2026-09-17 12:43:23	2026-09-17 12:43:23	\N
14	2	proposal_received	📥 Nouvelle proposition reçue	TechCorp vous propose : Lovaniaina Candy Aina	App\\Models\\Proposal	7	\N	2026-09-21 06:10:24	2026-09-21 06:10:24	\N
12	1	mission_pending_approval	🎯 Nouvelle mission proposée	Vous avez été accepté pour une mission.	App\\Models\\Mission	7	2026-09-21 13:42:47	2026-09-17 12:22:06	2026-09-21 13:42:47	\N
17	5	application_interview	📅 Entretien proposé	TechCorp souhaite vous rencontrer pour « LOGISTIC COMMERCIAL »	App\\Models\\Application	2	2026-09-24 09:15:46	2026-09-24 07:02:01	2026-09-24 09:15:46	{"url":"\\/applications\\/2","application_id":2,"status":"interview","company_name":"TechCorp","job_offer_title":"LOGISTIC COMMERCIAL"}
16	6	new_application	📥 Nouvelle candidature reçue	Nyavoramanandriantsoa a postulé à « LOGISTIC COMMERCIAL »	App\\Models\\Application	2	2026-09-24 21:37:29	2026-09-24 07:01:28	2026-09-24 21:37:29	{"url":"\\/job-offers\\/2\\/applications","application_id":2,"applicant_name":"Nyavoramanandriantsoa","job_offer_title":"LOGISTIC COMMERCIAL"}
18	6	new_application	📥 Nouvelle candidature reçue	Lovaniaina Candy Aina a postulé à « LOGISTIC COMMERCIAL »	App\\Models\\Application	3	2026-10-01 07:08:23	2026-10-01 07:07:22	2026-10-01 07:08:23	{"url":"\\/job-offers\\/2\\/applications","application_id":3,"applicant_name":"Lovaniaina Candy Aina","job_offer_title":"LOGISTIC COMMERCIAL"}
19	1	application_interview	📅 Entretien programmé	TechCorp vous propose un entretien pour « LOGISTIC COMMERCIAL »	App\\Models\\Application	3	\N	2026-10-01 07:27:45	2026-10-01 07:27:45	{"url":"\\/applications\\/3","interview_at":"2026-10-03T10:00:00.000000Z","interview_link":"https:\\/\\/meet.jit.si\\/talentshare-3-aO02rA7Kxj"}
20	7	new_application	📥 Nouvelle candidature reçue	Lovaniaina Candy Aina a postulé à « Assisstante virtuelle »	App\\Models\\Application	4	2026-10-01 08:38:27	2026-10-01 08:37:17	2026-10-01 08:38:27	{"url":"\\/job-offers\\/3\\/applications","application_id":4}
21	1	application_interview	📅 Entretien programmé	RAN CONSUTING ANGENCY vous propose un entretien pour « Assisstante virtuelle »	App\\Models\\Application	4	\N	2026-10-01 08:38:52	2026-10-01 08:38:52	{"url":"\\/applications\\/4","interview_at":"2026-10-04T17:20:00.000000Z","interview_link":"https:\\/\\/meet.jit.si\\/talentshare-4-1AHUO885WH"}
22	1	application_shortlisted	🎉 Vous êtes présélectionné(e) !	RAN CONSUTING ANGENCY a présélectionné votre candidature pour « Assisstante virtuelle »	App\\Models\\Application	4	\N	2026-10-01 11:19:54	2026-10-01 11:19:54	{"url":"\\/applications\\/4","application_id":4,"status":"shortlisted"}
23	1	application_accepted	✅ Candidature acceptée	RAN CONSUTING ANGENCY a accepté votre candidature pour « Assisstante virtuelle »	App\\Models\\Application	4	2026-10-01 11:20:40	2026-10-01 11:20:08	2026-10-01 11:20:40	{"url":"\\/applications\\/4","application_id":4,"status":"accepted"}
24	7	new_message	💬 Nouveau message	Lovaniaina Candy Aina : heyyyy	App\\Models\\Message	5	\N	2026-10-01 11:33:35	2026-10-01 11:33:35	"{\\"conversation_id\\":2}"
25	7	new_message	💬 Nouveau message	Lovaniaina Candy Aina : 🙂‍↔️	App\\Models\\Message	6	\N	2026-10-01 11:39:22	2026-10-01 11:39:22	"{\\"conversation_id\\":2}"
26	7	new_message	💬 Nouveau message	Lovaniaina Candy Aina : 📎 Pièce jointe	App\\Models\\Message	7	\N	2026-10-01 11:39:35	2026-10-01 11:39:35	"{\\"conversation_id\\":2}"
27	2	new_message	💬 Nouveau message	RAN Consulting and Agency : hahah	App\\Models\\Message	8	\N	2026-10-01 11:51:38	2026-10-01 11:51:38	"{\\"conversation_id\\":3}"
28	5	new_message	💬 Nouveau message	RAN Consulting and Agency : jjj	App\\Models\\Message	9	\N	2026-10-01 12:24:45	2026-10-01 12:24:45	"{\\"conversation_id\\":4}"
29	6	new_message	💬 Nouveau message	RAN Consulting and Agency : jjj	App\\Models\\Message	9	\N	2026-10-01 12:24:45	2026-10-01 12:24:45	"{\\"conversation_id\\":4}"
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.password_reset_tokens (email, token, created_at) FROM stdin;
\.


--
-- Data for Name: personal_access_tokens; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.personal_access_tokens (id, tokenable_type, tokenable_id, name, token, abilities, last_used_at, expires_at, created_at, updated_at) FROM stdin;
30	App\\Models\\User	6	talentshare	7144c3d6b87a197997833ab0866d583d2f7d8006b12b59937c605b383a3cf073	["*"]	2026-09-13 07:42:39	\N	2026-09-13 07:41:31	2026-09-13 07:42:39
4	App\\Models\\User	2	talentshare	2e4382e7ce020034ee0fcb1257f8ef676d69625c4b2d608cdb198a00511aafc5	["*"]	2026-09-07 14:31:07	\N	2026-09-07 14:11:49	2026-09-07 14:31:07
26	App\\Models\\User	6	talentshare	45b55f5c23a833a6f0acbc3d713056f31c5c45c32d21cbca7ecc02b6e339ab22	["*"]	2026-09-11 02:30:02	\N	2026-09-10 20:02:23	2026-09-11 02:30:02
6	App\\Models\\User	2	talentshare	c7937ce8ecc80ce7c3780a0148b51c4a6c300c004fc4d25da9918c4038b2ee44	["*"]	2026-09-07 17:48:04	\N	2026-09-07 14:36:26	2026-09-07 17:48:04
7	App\\Models\\User	3	talentshare	ae4f0be4fa6d4ca32b2af31bedde4ca610bf61ad97d8c6a35c64dd7e6d05cced	["*"]	\N	\N	2026-09-07 19:15:08	2026-09-07 19:15:08
1	App\\Models\\User	1	talentshare	058fc095b2e2314f287d0f90d1712f5317c3af5ddf4991bf98a98fc4305a253c	["*"]	2026-09-07 14:01:41	\N	2026-09-07 14:01:28	2026-09-07 14:01:41
27	App\\Models\\User	6	talentshare	38a28a380aba565a8d5d7e0896576e2b0b751999d1736dd146366d7bb4ef067b	["*"]	2026-09-11 08:59:36	\N	2026-09-11 08:44:41	2026-09-11 08:59:36
22	App\\Models\\User	5	talentshare	82d6021848a30f4b6f6d2ec4a5c957f5e57b2a8b8f2e69852bdc22825c7ef134	["*"]	2026-09-10 12:25:46	\N	2026-09-10 12:23:16	2026-09-10 12:25:46
2	App\\Models\\User	1	talentshare	696b1545e109e50b652240fa3429b4ca69b3368ee011c3793091948f4ccb57c7	["*"]	2026-09-07 14:03:08	\N	2026-09-07 14:02:08	2026-09-07 14:03:08
11	App\\Models\\User	3	talentshare	c53b2c6b8d4b3ef4d13808a3539aec3215ab78eeeaaa5af73c7c1a6ec6d271a1	["*"]	2026-09-07 19:24:34	\N	2026-09-07 19:24:24	2026-09-07 19:24:34
21	App\\Models\\User	5	talentshare	a231a08ee3a788033a19c03e970ac759f94dfbe5462833a35824a9812af5917b	["*"]	2026-09-10 12:19:45	\N	2026-09-09 11:44:56	2026-09-10 12:19:45
5	App\\Models\\User	2	talentshare	0c43f2f23e2ef8a8a92c004986448b7ab01bcfd6b7413916b0603b220417b4c4	["*"]	2026-09-07 14:34:21	\N	2026-09-07 14:33:17	2026-09-07 14:34:21
15	App\\Models\\User	4	talentshare	6844fc3559ed57618d279cf5beff793ed18d657a017b9480bf4eb89f82a4f9fb	["*"]	2026-09-08 12:38:49	\N	2026-09-08 08:10:36	2026-09-08 12:38:49
13	App\\Models\\User	2	talentshare	5788f20518db28918d07b6ade97ab5006669ed6011091274b0f0363b26c6cb3f	["*"]	2026-09-08 08:20:21	\N	2026-09-08 07:38:44	2026-09-08 08:20:21
3	App\\Models\\User	2	talentshare	22920baf75008d4fff4f9199d3ff209e637c443355e2a044649df1237b04d91f	["*"]	2026-09-07 14:06:48	\N	2026-09-07 14:04:36	2026-09-07 14:06:48
20	App\\Models\\User	5	talentshare	cd7425c0dd680a6a51ad16e866982088db19df0f9bb0b67c3d6d54e0c477fdcc	["*"]	2026-09-09 11:36:15	\N	2026-09-09 11:15:11	2026-09-09 11:36:15
10	App\\Models\\User	3	talentshare	a6c88c361706a50d4c373095686f87c39aaf860da026eae25e38c616f53964c9	["*"]	2026-09-07 19:26:05	\N	2026-09-07 19:23:08	2026-09-07 19:26:05
14	App\\Models\\User	4	talentshare	c6a4da513110ef1056bd223051688caa76c4548af914a5b821c59bc2828b7493	["*"]	\N	\N	2026-09-08 08:10:23	2026-09-08 08:10:23
16	App\\Models\\User	5	talentshare	d870e6e459660dd9260a3380f79fc113d2d81601367fea669c5b7010c2061553	["*"]	2026-09-08 16:49:40	\N	2026-09-08 08:22:04	2026-09-08 16:49:40
17	App\\Models\\User	5	talentshare	77c0c96694ab629c8184effe642354ccae3711bae51da4d71f3404a5773d7c3e	["*"]	\N	\N	2026-09-08 11:26:52	2026-09-08 11:26:52
8	App\\Models\\User	3	talentshare	8c16e753993714504b48a13b3038cdfb58a92c1cbad020ceacc9eb2e02c509fb	["*"]	2026-09-07 19:22:04	\N	2026-09-07 19:18:16	2026-09-07 19:22:04
29	App\\Models\\User	6	talentshare	378c4e14a19c6dad24cfb3c5362c63cbafcdff4600885debd7d84edb28358594	["*"]	2026-09-11 16:32:53	\N	2026-09-11 10:09:49	2026-09-11 16:32:53
19	App\\Models\\User	5	talentshare	dd08e1c2facb9449b88d3cece5a012d4f3dd59439cd6198a076211942b74df86	["*"]	2026-09-08 19:03:39	\N	2026-09-08 17:44:53	2026-09-08 19:03:39
18	App\\Models\\User	5	talentshare	f7425fc22dd768c359d213993f3c1605d7f08fdcad4c843f60fc8c229df27010	["*"]	2026-09-08 11:28:15	\N	2026-09-08 11:27:05	2026-09-08 11:28:15
25	App\\Models\\User	5	talentshare	5b94f88804fa527306865742b442b34645dd243905dc0c8e2b6716636fe61993	["*"]	2026-09-10 20:00:37	\N	2026-09-10 12:27:28	2026-09-10 20:00:37
9	App\\Models\\User	2	talentshare	86528d9d0f6609e7312231a1fdec07fb844bb65e7fd6492c918b424f34cc3692	["*"]	2026-09-07 19:22:30	\N	2026-09-07 19:22:24	2026-09-07 19:22:30
23	App\\Models\\User	1	talentshare	2e928bba3147e142b6d9656bf500a22ef267b93e50a036d5c5ae81a05c4a4dc8	["*"]	2026-09-10 12:26:34	\N	2026-09-10 12:26:29	2026-09-10 12:26:34
12	App\\Models\\User	2	talentshare	80b23af20778d1c18a6f45d1f68b5a937fdc10bb0ac311978385d15e5c6c03e1	["*"]	2026-09-08 07:31:26	\N	2026-09-07 19:26:25	2026-09-08 07:31:26
28	App\\Models\\User	1	talentshare	6ab592b785eeef7600dd98dd56ed9a9ce5c778718c54e41165e013d0168d4d61	["*"]	2026-09-11 10:09:22	\N	2026-09-11 09:00:44	2026-09-11 10:09:22
32	App\\Models\\User	6	talentshare	c7de0707397a8856b748b098c39b07d69f7d6bb467dea783bf3b0cfe5bcaed87	["*"]	2026-09-13 08:05:54	\N	2026-09-13 07:56:11	2026-09-13 08:05:54
24	App\\Models\\User	2	talentshare	9a7aaedff451fa528b2db089a3c339f28888b5773269e314adff8abcba851d99	["*"]	2026-09-10 12:27:08	\N	2026-09-10 12:27:02	2026-09-10 12:27:08
35	App\\Models\\User	6	talentshare	84e4e7c79d1f711b6845cb78777d21f2f385aa30824139c18ca1de74ccb29148	["*"]	2026-09-13 08:28:49	\N	2026-09-13 08:22:20	2026-09-13 08:28:49
33	App\\Models\\User	6	talentshare	8af92dca30791e97618f595dc999b282dd26d16a60a742e4414429c93c1943b7	["*"]	2026-09-13 08:17:51	\N	2026-09-13 08:06:09	2026-09-13 08:17:51
31	App\\Models\\User	6	talentshare	78533a2f4d20b9c4c817729c98cf04a90ec0c67c08ffb9e1a8595d46477f3e49	["*"]	2026-09-13 07:55:48	\N	2026-09-13 07:42:57	2026-09-13 07:55:48
36	App\\Models\\User	2	talentshare	5abde5526d58245113fa67fc07cd771b1421c287027ff782e237b0fc2ceeaa6c	["*"]	2026-09-13 08:37:38	\N	2026-09-13 08:29:07	2026-09-13 08:37:38
38	App\\Models\\User	6	talentshare	2f20beb76cb14eb76338e38fc9158e186014d84b66f1affcbdd198987f56fccb	["*"]	2026-09-13 12:28:46	\N	2026-09-13 08:56:03	2026-09-13 12:28:46
34	App\\Models\\User	2	talentshare	00943cc435ba6d7e8a7bc376b8f5dcef841f0b7e466a45902ce1eaab2e28b281	["*"]	2026-09-13 08:21:41	\N	2026-09-13 08:18:21	2026-09-13 08:21:41
40	App\\Models\\User	6	talentshare	512535eb596c8ef5295746e0bc5c9eda39dc1d6bfc1bab4c21456d24a34433a3	["*"]	2026-09-13 12:44:28	\N	2026-09-13 12:43:31	2026-09-13 12:44:28
39	App\\Models\\User	1	talentshare	a72f66d645ef9e7c502f33f905eae9f31d9860795122f021527f1a1abd7350cd	["*"]	2026-09-13 12:43:12	\N	2026-09-13 12:29:07	2026-09-13 12:43:12
37	App\\Models\\User	6	talentshare	da32b66c9806896b22c9e76991baf635a2a3a077421e37bd9e3fd8ce13a8ffb9	["*"]	2026-09-13 08:49:15	\N	2026-09-13 08:37:58	2026-09-13 08:49:15
42	App\\Models\\User	6	talentshare	f607c8f3042519a84e3c9a24f90c936f5e4563c4075eec7f511aa2eefbfa447e	["*"]	2026-09-13 12:51:10	\N	2026-09-13 12:49:40	2026-09-13 12:51:10
41	App\\Models\\User	2	talentshare	95021c0625cb15fb1d6e5d3605c9e44e706419b255d524743335d0e5e4b8f721	["*"]	2026-09-13 12:49:24	\N	2026-09-13 12:44:46	2026-09-13 12:49:24
43	App\\Models\\User	2	talentshare	5f4b9d6cfe6510515bccae07cead8346f97a5b42740ae58139372d74627c6c2f	["*"]	2026-09-14 11:10:22	\N	2026-09-13 12:51:40	2026-09-14 11:10:22
66	App\\Models\\User	1	talentshare	5f8c9588d96043c3a63642c156e48f386d1c063b8c9c22596ebb6ab40ff4d048	["*"]	2026-09-23 13:07:10	\N	2026-09-23 12:54:01	2026-09-23 13:07:10
62	App\\Models\\User	1	talentshare	da58732a027acc8b02784f8cebb26c8d3be9edf2f50c11304f954c95b12be77c	["*"]	2026-09-23 08:11:23	\N	2026-09-23 08:10:28	2026-09-23 08:11:23
58	App\\Models\\User	1	talentshare	30ab9c32e0b28ef5232edbed80a6919cf609431a4767c52719e680e802bbd0a1	["*"]	2026-09-21 13:42:48	\N	2026-09-21 13:42:01	2026-09-21 13:42:48
44	App\\Models\\User	1	talentshare	dce9cc86a54ca0c993409a2d6a36190fee08b3dab2b13655fbd9935a250e2547	["*"]	2026-09-14 11:58:55	\N	2026-09-14 11:58:46	2026-09-14 11:58:55
69	App\\Models\\User	1	talentshare	d99d257aafc7a6c3cf878bc10512968501410631aaf37c4a8bc23c7473567ecf	["*"]	2026-09-24 06:58:40	\N	2026-09-23 13:21:19	2026-09-24 06:58:40
80	App\\Models\\User	7	talentshare	0c303073035af726f9481d53e83a05c70afb5ab750d5e9f4e0cb7c21cc1fd5ad	["*"]	2026-10-01 08:36:33	\N	2026-10-01 08:27:52	2026-10-01 08:36:33
50	App\\Models\\User	6	talentshare	9b561f38020c18159333d42b700cc9caca40f1297dc1a2b2f2fbf497a0392237	["*"]	2026-09-15 14:18:15	\N	2026-09-15 14:07:12	2026-09-15 14:18:15
45	App\\Models\\User	1	talentshare	2b91d2d3492e46f2adcf5ee2f35225337c2d2fc31097b6e63ec3e13ff3c8b2d3	["*"]	2026-09-14 12:15:23	\N	2026-09-14 12:15:15	2026-09-14 12:15:23
70	App\\Models\\User	6	talentshare	7b29f56d010438c12978dfe02187c81e2e30a7042c102bb4147e332d0fdcb1d1	["*"]	2026-09-24 07:00:37	\N	2026-09-24 06:59:12	2026-09-24 07:00:37
46	App\\Models\\User	1	talentshare	2b09c809062958fccb37284f32d55d508e3c3d547ba395bd87cf73c501b03154	["*"]	2026-09-14 12:16:08	\N	2026-09-14 12:15:53	2026-09-14 12:16:08
76	App\\Models\\User	6	talentshare	39095ae6b0c0c5ca19a92b4f2122586dfacfa450f60e658819e576a02a9f4b81	["*"]	2026-10-01 07:00:26	\N	2026-10-01 07:00:10	2026-10-01 07:00:26
72	App\\Models\\User	6	talentshare	6da74f857a66e8ceb35555f3c2ac92b1d399ab2a3f1dee96f46a37928ec3afaf	["*"]	2026-09-24 07:02:07	\N	2026-09-24 07:01:47	2026-09-24 07:02:07
56	App\\Models\\User	6	talentshare	7db296718632e74f54e3995c8ca24e63143c11207795c936f834a31d3d4855e1	["*"]	2026-09-21 06:18:45	\N	2026-09-21 06:07:45	2026-09-21 06:18:45
49	App\\Models\\User	5	talentshare	ef800bd2817b8fd03fe8fd651925d036689ec4fd77ef3b298522fc02ad91f81e	["*"]	2026-09-15 14:06:51	\N	2026-09-15 13:55:44	2026-09-15 14:06:51
59	App\\Models\\User	1	talentshare	91f90b1371929d7a9d82d8564538207f5df0429fc0985accc6a39bcfd448f9d2	["*"]	2026-09-22 12:31:42	\N	2026-09-22 07:48:52	2026-09-22 12:31:42
47	App\\Models\\User	5	talentshare	5602d9a203afc426e567400ac3b9e7f2ab14efe974096186ef07e8e2a638c94b	["*"]	2026-09-15 13:05:43	\N	2026-09-15 12:15:13	2026-09-15 13:05:43
52	App\\Models\\User	6	talentshare	26079daa66b212d7e06a375bab7f586a880848d7526f97128964ea9109c8a528	["*"]	2026-09-17 12:21:25	\N	2026-09-17 11:37:57	2026-09-17 12:21:25
48	App\\Models\\User	6	talentshare	2aa911383bc63bdfbc6fd2ebd6d365ae26ac4333b2d9152675f94e4754c1676b	["*"]	2026-09-15 13:55:14	\N	2026-09-15 13:05:55	2026-09-15 13:55:14
57	App\\Models\\User	6	talentshare	fd01e74d0341c023abe14313e7c89b997249e60c2b3b79102a47f180b44e8798	["*"]	2026-09-21 12:21:35	\N	2026-09-21 12:21:34	2026-09-21 12:21:35
60	App\\Models\\User	1	talentshare	bda72a4179e38a61721bde51c25e58866a46b8475273b6a34c847aac96e44628	["*"]	2026-09-23 07:46:42	\N	2026-09-22 12:46:07	2026-09-23 07:46:42
74	App\\Models\\User	5	talentshare	7874d67677075a1df8cf8ed14037af2422ff3fa77bf0c420325f4960af483e6c	["*"]	2026-09-24 21:36:56	\N	2026-09-24 07:02:46	2026-09-24 21:36:56
64	App\\Models\\User	6	talentshare	c0d4297e13bb7b5c51fcaa9f9fd2966201f1678a57818b5c9411a305dfa54c5e	["*"]	2026-09-23 12:44:42	\N	2026-09-23 12:28:28	2026-09-23 12:44:42
61	App\\Models\\User	1	talentshare	d37f4d95d3f3c913d06586c33d8507f7d717abe0344dc05210227e9bbe09a5cb	["*"]	2026-09-23 08:08:04	\N	2026-09-23 07:58:58	2026-09-23 08:08:04
53	App\\Models\\User	2	talentshare	2fac50b9547b846d3340417d27e856f8d8fb60a05aaf03fedf8b1a0a1cd0dbc5	["*"]	2026-09-17 12:22:26	\N	2026-09-17 12:21:51	2026-09-17 12:22:26
51	App\\Models\\User	5	talentshare	486e34104d245219de9ddd03870b9bf84dbe39fa53d23ae67d3add38a1fa968f	["*"]	2026-09-17 11:37:25	\N	2026-09-15 14:18:46	2026-09-17 11:37:25
54	App\\Models\\User	6	talentshare	72ea88bd9c5c9ecc3b2d7faa88175a43e406438dc0259e9af464f8066700e51c	["*"]	2026-09-17 12:32:33	\N	2026-09-17 12:22:45	2026-09-17 12:32:33
55	App\\Models\\User	6	talentshare	35f58d29bbac73219834e4d6ae97694b370edd88fdf19f0382fd75457f96a4cf	["*"]	2026-09-18 16:02:59	\N	2026-09-17 12:42:28	2026-09-18 16:02:59
63	App\\Models\\User	1	talentshare	05b9bdc08e27b7415a081b98564e7079db1a90b30b4483ee35337216bc5c54d7	["*"]	2026-09-23 12:27:40	\N	2026-09-23 11:44:46	2026-09-23 12:27:40
65	App\\Models\\User	6	talentshare	7ea2eca8cf910ec29a2df9b632e3e3020078d65626213236244dad996cc5bd88	["*"]	2026-09-23 12:53:33	\N	2026-09-23 12:51:24	2026-09-23 12:53:33
73	App\\Models\\User	1	talentshare	2952c751bfdfe4e38714c7675bf5f4850fec788d907c34599e62e2b60e897b5a	["*"]	2026-09-24 07:02:23	\N	2026-09-24 07:02:22	2026-09-24 07:02:23
67	App\\Models\\User	6	talentshare	b338d8d860d9107706339db4cac1361f38a273ed18f32000fbe94e085478cc7d	["*"]	2026-09-23 13:09:25	\N	2026-09-23 13:07:34	2026-09-23 13:09:25
68	App\\Models\\User	6	talentshare	02a39d06150ea2b8c550f2f39ba0613cc8ebe9412dd7e2dfd5b0c38506cbffea	["*"]	2026-09-23 13:21:01	\N	2026-09-23 13:18:44	2026-09-23 13:21:01
71	App\\Models\\User	5	talentshare	3014b8ba7fe695dc2ecc094d27a8d2023cf97169fe0b6d109120dbd71d82bc66	["*"]	2026-09-24 07:01:28	\N	2026-09-24 07:00:59	2026-09-24 07:01:28
81	App\\Models\\User	1	talentshare	eb4177bdd7cfe75b3fda7b5118c95fd6fe839f68f8b3c954be12cd413ef341e8	["*"]	2026-10-01 08:37:17	\N	2026-10-01 08:36:57	2026-10-01 08:37:17
75	App\\Models\\User	6	talentshare	0ceacbf9ef77a8d7aa75258691494d0f297eec7d199fa64ca80c2db67973852b	["*"]	2026-09-25 19:27:21	\N	2026-09-24 21:37:23	2026-09-25 19:27:21
79	App\\Models\\User	6	talentshare	d12585f393f3bd8d0b08922da72b3edaf0f84cb9975a9a47ef8b11d998d79b50	["*"]	2026-10-01 08:26:23	\N	2026-10-01 07:08:18	2026-10-01 08:26:23
77	App\\Models\\User	6	talentshare	5040913a77f5a9adf8d9d9680370b762b01ccb4f35c9a4c4ea88647f39b9b883	["*"]	2026-10-01 07:06:39	\N	2026-10-01 07:03:51	2026-10-01 07:06:39
78	App\\Models\\User	1	talentshare	67cdc5c8d138b92d0636e4df0aeea0a92bbbac92504f982f5b5a4320f0502ddb	["*"]	2026-10-01 07:08:05	\N	2026-10-01 07:06:51	2026-10-01 07:08:05
82	App\\Models\\User	7	talentshare	93f0ed4115b299166b94bf92a2c0cf123267fde45582085fe3636b1ce92025b3	["*"]	2026-10-01 11:20:08	\N	2026-10-01 08:38:23	2026-10-01 11:20:08
83	App\\Models\\User	1	talentshare	6560e61475b680f06a14206ad43f8b6ffcbde18ddfff31ae2bdfd1756b9e59e5	["*"]	2026-10-01 11:39:42	\N	2026-10-01 11:20:35	2026-10-01 11:39:42
84	App\\Models\\User	7	talentshare	8d1084e6c91ab70e938d5ae2f912c6008dcc550793befc69d3036ad7a942962d	["*"]	2026-10-01 11:47:19	\N	2026-10-01 11:40:23	2026-10-01 11:47:19
85	App\\Models\\User	7	talentshare	35001ce6f9de14737667123eddd89f8683bb7a112fa5773793acfbfbc249093a	["*"]	2026-10-01 12:55:34	\N	2026-10-01 11:51:13	2026-10-01 12:55:34
86	App\\Models\\User	6	talentshare	a0240cc1a15de0bdac94340017ccc76ff5977b1e65c8b02851f8e75ef782ecba	["*"]	2026-10-05 05:59:09	\N	2026-10-01 12:56:02	2026-10-05 05:59:09
87	App\\Models\\User	1	talentshare	d47695eff70075bd79eaed02bed6100f0a72decb253f8ef3ad07571990e6c0dd	["*"]	2026-10-05 06:03:23	\N	2026-10-05 06:00:02	2026-10-05 06:03:23
\.


--
-- Data for Name: portfolio_projects; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portfolio_projects (id, portfolio_id, title, description, project_url, cover_image_path, "position", created_at, updated_at, start_date, end_date, technologies, project_type) FROM stdin;
1	1	haha	haha	https://www.portaljob-madagascar.com/emploi/liste?page=1	\N	0	2026-09-10 11:08:03	2026-09-10 11:08:03	2026-09-03	2026-09-06	["haha"]	professional
\.


--
-- Data for Name: portfolios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.portfolios (id, professional_profile_id, public_slug, title, summary, visibility, created_at, updated_at, theme, accent_color) FROM stdin;
1	3	nyavoramanandriantsoa-lPPCwv	DEVELLOPEUSE PASSIONNEE	JE SUISMOTIVEE ET PRETE	private	2026-09-09 11:30:52	2026-09-10 13:22:30	corporate	#6EE7C8
2	4	lovaniaina-candy-2bbYAq	Mon portfolio	\N	public	2026-09-11 09:05:11	2026-09-23 07:32:26	corporate	#6EE7C8
\.


--
-- Data for Name: professional_profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.professional_profiles (id, user_id, profile_type, headline, bio, visibility, country, city, portfolio_url, cv_path, is_verified, created_at, updated_at, avatar_path, linkedin_url, github_url, behance_url, university, field_of_study, study_level, is_young_talent, looking_for_opportunity) FROM stdin;
1	4	employee	Developpeur	\N	public	\N	\N	\N	\N	f	2026-09-08 08:10:50	2026-09-08 08:10:50	\N	\N	\N	\N	\N	\N	\N	f	f
4	1	student	Professionnel	haha	public	Maurice	Antsiranana	https://chat.deepseek.com/a/chat/s/a88ff796-85f0-4afb-b1d4-7e81400c9b04	cvs/AguhwTQqufYEOwoo3q9AIJsHQ40GM3Tx3euCOygv.pdf	f	2026-09-11 09:04:23	2026-09-23 08:07:27	avatars/SPbAqBhvYt64IqNScwOnxv0bdEkQEmCES8ZtbOhp.jpg	https://claude.ai/chat/932f2eec-491b-4dd2-b695-76cf9a3d070c	https://www.portaljob-madagascar.com/emploi/liste?page=1	\N	SFX	INFO	L2	t	f
3	5	student	LOVA	INFORMATIQUE IGG	public	Libéria	FIANARANTSOA	https://www.portaljob-madagascar.com/emploi/liste?page=1	cvs/gpGykzJlpAeM2go5rIAMRGubNl9q0BGPW9tJMgXB.pdf	f	2026-09-08 08:35:49	2026-09-09 13:17:01	avatars/lDbPjTI5brl5AKlYstmdptC9XXwco3A51V76wcv4.jpg	https://copilot.microsoft.com/chats/neDjAM7aspvf8LxKw5apr	https://chat.deepseek.com/a/chat/s/eb4154a5-cb84-4e38-8294-88e5ac536f9c	https://talentshare-zdoq25yz.manus.space/explorer	\N	\N	\N	f	f
\.


--
-- Data for Name: profile_skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.profile_skills (id, professional_profile_id, skill_id, level, years_experience, created_at, updated_at, notes, is_featured) FROM stdin;
1	1	34	intermediate	\N	2026-09-08 12:07:14	2026-09-08 12:07:14	\N	f
2	3	35	advanced	\N	2026-09-08 12:09:07	2026-09-08 12:09:07	\N	f
3	3	16	intermediate	\N	2026-09-08 13:15:16	2026-09-08 13:15:16	\N	f
5	3	22	expert	\N	2026-09-08 16:42:36	2026-09-08 16:42:36	\N	f
6	3	32	beginner	\N	2026-09-09 16:59:18	2026-09-09 16:59:18	\N	f
7	3	39	intermediate	3	2026-09-10 12:02:21	2026-09-10 12:02:21	ACTION	t
8	3	3	advanced	0	2026-09-10 12:25:17	2026-09-10 12:25:17	je sais pas encore	t
9	4	7	advanced	1	2026-09-11 09:51:00	2026-09-11 09:51:00	\N	t
10	4	22	intermediate	\N	2026-09-22 11:50:19	2026-09-22 11:50:19	\N	f
\.


--
-- Data for Name: proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.proposals (id, resource_request_id, professional_profile_id, proposed_by_company_id, message, match_score, status, sent_at, viewed_at, responded_at, created_at, updated_at, resource_offer_id, to_company_id, description, conditions, start_at, end_at, workload_percent, remote, expires_at, cancelled_at) FROM stdin;
1	1	3	2	jtm	40	accepted	2026-09-15 13:55:13	\N	2026-09-15 14:39:25	2026-09-15 13:55:13	2026-09-15 14:39:25	\N	\N	\N	\N	\N	\N	\N	f	\N	\N
5	\N	4	2	bonjour	\N	accepted	2026-09-17 12:21:18	\N	2026-09-17 12:22:06	2026-09-17 12:21:08	2026-09-17 12:22:06	\N	\N	\N	\N	\N	\N	\N	f	\N	\N
7	\N	4	2	haha	\N	sent	2026-09-21 06:10:24	\N	\N	2026-09-21 06:10:24	2026-09-21 06:10:24	\N	1	haha	haha	2026-09-03	2026-09-21	100	f	2026-09-21	\N
6	\N	4	2	haha	\N	cancelled	2026-09-17 12:43:23	\N	\N	2026-09-17 12:43:02	2026-09-21 06:18:36	\N	1	\N	\N	2026-01-01	2026-09-01	100	t	2026-09-17	2026-09-21 06:18:36
\.


--
-- Data for Name: ratings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.ratings (id, mission_id, rated_by, rater_role, skills_score, quality_score, communication_score, punctuality_score, collaboration_score, comment, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: resource_offer_skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_offer_skill (resource_offer_id, skill_id, level) FROM stdin;
2	148	intermediate
\.


--
-- Data for Name: resource_offers; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_offers (id, company_id, professional_profile_id, title, description, mission_type, start_at, end_at, workload_percent, remote, country, city, visibility, status, created_at, updated_at, conditions, daily_rate, hourly_rate, workload_unit, workload_value, location_type, location_city, deleted_at) FROM stdin;
2	2	4	DEV	DEV	freelance	2026-02-11	2026-09-11	100	t	Madagascar	\N	public	published	2026-09-11 16:28:44	2026-09-11 16:28:55	500	75	15	days_per_week	5	remote	\N	2026-09-11 16:28:55
1	2	4	Développeur Laravel senior	jsp	freelance	2026-06-11	2026-09-13	100	t	Madagascar	\N	public	closed	2026-09-11 16:26:09	2026-09-13 12:43:00	500euro	75	12	days_per_week	5	remote	\N	\N
\.


--
-- Data for Name: resource_request_skill; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_request_skill (id, resource_request_id, skill_id, min_level, created_at, updated_at) FROM stdin;
1	1	43	advanced	2026-09-15 13:10:35	2026-09-15 13:10:35
2	1	157	advanced	2026-09-15 13:10:35	2026-09-15 13:10:35
\.


--
-- Data for Name: resource_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.resource_requests (id, company_id, created_by, title, description, start_at, end_at, workload_percent, remote, country, city, status, expires_at, created_at, updated_at, budget_min, budget_max, positions_count, urgency, tags, views_count, proposals_count, closed_reason, closed_at) FROM stdin;
1	2	6	Community manager	pour gérer les contenue de reseaux sociaux	2026-09-18	2026-12-01	50	t	Madagascar	Fianarantsoa	closed	2026-09-17	2026-09-15 13:10:35	2026-09-15 14:39:25	500	697	3	urgent	["Design","Data"]	2	0	\N	\N
\.


--
-- Data for Name: saved_searches; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.saved_searches (id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.sessions (id, user_id, ip_address, user_agent, payload, last_activity) FROM stdin;
dIIXiOqIjiEOFCq9X1TzzWil9pVl5HMKQZjzgRhq	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	eyJfdG9rZW4iOiJBU2hRU2puRDg3QkxkYVNrTFhVdThUZXB5TUZHQ09zdkZJVlNJS0o2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9lbWFpbFwvdmVyaWZ5Iiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19	1790842033
pxdnCCCBvqWj6Yg82G6dFm2nm4HbdGi4h0kCSfML	\N	127.0.0.1	Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/154.0.0.0 Safari/537.36	eyJfdG9rZW4iOiJMNWpLeWltUkJ6Vkw3SmZHUFJaMGlaUFZYcUVjYjFXc29CaHBXT2t1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cL2xvY2FsaG9zdDo4MDAwXC9lbWFpbFwvdmVyaWZ5Iiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19	1790853807
\.


--
-- Data for Name: skill_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skill_categories (id, name, slug, parent_id, created_at, updated_at, icon, "position", description) FROM stdin;
2	Développement	informatique-developpement	1	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
3	Data & IA	informatique-data-ia	1	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
5	Comptabilité	finance-comptabilite-comptabilite	4	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
6	Marketing	marketing	\N	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
7	Marketing digital	marketing-marketing-digital	6	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
8	RH	rh	\N	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
9	Ressources humaines	rh-ressources-humaines	8	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0	\N
1	Informatique	informatique	\N	2026-09-10 11:51:35	2026-09-10 12:20:37	💻	0	\N
10	Développement Web	informatique-developpement-web	1	2026-09-10 12:20:37	2026-09-10 12:20:37	\N	0	\N
11	Développement Mobile	informatique-developpement-mobile	1	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
12	Bases de données	informatique-bases-de-donnees	1	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2	\N
13	DevOps & Cloud	informatique-devops-cloud	1	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3	\N
14	Cybersécurité	informatique-cybersecurite	1	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4	\N
15	Data & IA	data-ia	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	🤖	1	\N
16	Data Science	data-ia-data-science	15	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
17	Machine Learning	data-ia-machine-learning	15	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
18	Data Engineering	data-ia-data-engineering	15	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2	\N
19	Business Intelligence	data-ia-business-intelligence	15	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3	\N
4	Finance & Comptabilité	finance-comptabilite	\N	2026-09-10 11:51:35	2026-09-10 12:22:06	💰	2	\N
20	Finance	finance-comptabilite-finance	4	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
21	Contrôle de gestion	finance-comptabilite-controle-de-gestion	4	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2	\N
22	Marketing & Communication	marketing-communication	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	📢	3	\N
23	Marketing digital	marketing-communication-marketing-digital	22	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
24	Communication	marketing-communication-communication	22	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
25	Design	marketing-communication-design	22	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2	\N
26	Ressources Humaines	ressources-humaines	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	👥	4	\N
27	Recrutement	ressources-humaines-recrutement	26	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
28	Gestion RH	ressources-humaines-gestion-rh	26	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
29	Génie civil & BTP	genie-civil-btp	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	🏗️	5	\N
30	Conception	genie-civil-btp-conception	29	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
31	Chantier	genie-civil-btp-chantier	29	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
32	Agriculture & Environnement	agriculture-environnement	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	🌱	6	\N
33	Production agricole	agriculture-environnement-production-agricole	32	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
34	Environnement	agriculture-environnement-environnement	32	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
35	Télécommunications	telecommunications	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	📡	7	\N
36	Réseaux	telecommunications-reseaux	35	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
37	Gestion de projet	gestion-de-projet	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	📊	8	\N
38	Méthodologies	gestion-de-projet-methodologies	37	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
39	Outils	gestion-de-projet-outils	37	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1	\N
40	Langues	langues	\N	2026-09-10 12:22:06	2026-09-10 12:22:06	🌍	9	\N
41	Langues étrangères	langues-langues-etrangeres	40	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0	\N
\.


--
-- Data for Name: skills; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.skills (id, skill_category_id, name, slug, created_at, updated_at, description, "position") FROM stdin;
8	\N	Java	java	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
17	\N	Git	git	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
18	\N	Communication	communication	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
19	\N	Marketing	marketing	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
20	\N	Gestion de projet	gestion-de-projet	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
21	\N	Design UI/UX	design-ui-ux	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
26	\N	Comptabilité	comptabilite	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
28	\N	Recrutement	recrutement	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
32	\N	Facebook Ads	facebook-ads	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
33	\N	Community Management	community-management	2026-09-08 15:03:48	2026-09-08 15:03:48	\N	0
34	\N	Intelligence Artificielle	intelligence-artificielle	2026-09-08 12:06:07	2026-09-08 12:06:07	\N	0
35	\N	assisstante virtuelle	assisstante-virtuelle	2026-09-08 12:09:06	2026-09-08 12:09:06	\N	0
36	3	Machine Learning	machine-learning	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
37	3	SQL	sql	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
38	5	Comptabilité générale	comptabilite-generale	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
39	5	Audit	audit	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
40	7	Réseaux sociaux	reseaux-sociaux	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
41	7	Content Marketing	content-marketing	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
42	9	Paie	paie	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
43	9	Formation	formation	2026-09-10 11:51:35	2026-09-10 11:51:35	\N	0
3	10	Laravel	laravel	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
4	10	React	react	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	1
5	10	Vue.js	vue-js	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	2
6	10	Node.js	node-js	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	3
9	10	PHP	php	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	4
10	10	JavaScript	javascript	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	5
11	10	TypeScript	typescript	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	6
45	10	HTML/CSS	htmlcss	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	7
46	10	Tailwind CSS	tailwind-css	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	8
47	10	Next.js	nextjs	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	9
48	11	React Native	react-native	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
49	11	Flutter	flutter	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
50	11	Swift	swift	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
51	11	Kotlin	kotlin	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
52	11	Android	android	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
53	11	iOS	ios	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
12	12	PostgreSQL	postgresql	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
13	12	MySQL	mysql	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	1
14	12	MongoDB	mongodb	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	2
54	12	Redis	redis	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
55	12	SQLite	sqlite	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
56	12	Oracle	oracle	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
15	13	Docker	docker	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
57	13	Kubernetes	kubernetes	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
16	13	AWS	aws	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	2
58	13	Azure	azure	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
59	13	Google Cloud	google-cloud	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
60	13	CI/CD	cicd	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
61	13	Linux	linux	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	6
62	13	Nginx	nginx	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	7
63	13	Terraform	terraform	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	8
64	14	Pentesting	pentesting	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
65	14	Sécurité réseau	securite-reseau	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
66	14	Cryptographie	cryptographie	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
67	14	OWASP	owasp	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
68	14	SOC	soc	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
7	16	Python	python	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
69	16	Pandas	pandas	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
70	16	NumPy	numpy	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
71	16	Jupyter	jupyter	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
72	16	R	r	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
73	16	Statistiques	statistiques	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
74	17	Scikit-learn	scikit-learn	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
75	17	TensorFlow	tensorflow	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
76	17	PyTorch	pytorch	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
77	17	XGBoost	xgboost	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
78	17	NLP	nlp	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
79	17	Computer Vision	computer-vision	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
80	18	ETL	etl	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
81	18	Airflow	airflow	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
82	18	Spark	spark	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
83	18	Kafka	kafka	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
84	18	dbt	dbt	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
85	18	Snowflake	snowflake	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
86	19	Power BI	power-bi	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
27	20	Analyse financière	analyse-financiere	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
30	23	SEO	seo	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
31	23	Google Ads	google-ads	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	5
29	24	Rédaction	redaction	2026-09-08 15:03:48	2026-09-10 12:22:06	\N	0
22	41	Anglais	anglais	2026-09-08 15:03:48	2026-09-10 12:22:07	\N	0
23	41	Français	francais	2026-09-08 15:03:48	2026-09-10 12:22:07	\N	1
25	41	Espagnol	espagnol	2026-09-08 15:03:48	2026-09-10 12:22:07	\N	2
24	41	Malagasy	malagasy	2026-09-08 15:03:48	2026-09-10 12:22:07	\N	6
87	19	Tableau	tableau	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
88	19	Looker	looker	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
89	19	Metabase	metabase	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
90	19	Excel avancé	excel-avance	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
91	5	Comptabilité analytique	comptabilite-analytique	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
92	5	Fiscalité	fiscalite	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
93	5	SYSCOHADA	syscohada	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
94	20	Modélisation financière	modelisation-financiere	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
95	20	Trésorerie	tresorerie	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
96	20	Évaluation	evaluation	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
97	20	M&A	ma	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
98	21	Budget	budget	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
99	21	Reporting	reporting	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
100	21	KPI	kpi	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
101	21	Costing	costing	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
102	21	Prévisions	previsions	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
103	23	SEA	sea	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
104	23	Email Marketing	email-marketing	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
105	24	Relations presse	relations-presse	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
106	24	Événementiel	evenementiel	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
107	24	Branding	branding	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
108	24	Storytelling	storytelling	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
109	25	Figma	figma	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
110	25	Adobe Photoshop	adobe-photoshop	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
111	25	Adobe Illustrator	adobe-illustrator	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
112	25	UI Design	ui-design	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
113	25	UX Design	ux-design	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
114	25	Canva	canva	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
115	27	Sourcing	sourcing	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
116	27	Entretiens	entretiens	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
117	27	Onboarding	onboarding	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
118	27	ATS	ats	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
119	27	LinkedIn Recruiter	linkedin-recruiter	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
120	28	Droit du travail	droit-du-travail	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
121	28	GPEC	gpec	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
122	28	SIRH	sirh	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
123	30	AutoCAD	autocad	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
124	30	Revit	revit	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
125	30	SketchUp	sketchup	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
126	30	BIM	bim	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
127	30	Dessin technique	dessin-technique	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
128	31	Gestion de chantier	gestion-de-chantier	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
129	31	Topographie	topographie	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
130	31	Béton armé	beton-arme	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
131	31	HSE	hse	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
132	31	Planning	planning	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
133	33	Agronomie	agronomie	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
134	33	Irrigation	irrigation	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
135	33	Permaculture	permaculture	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
136	33	Élevage	elevage	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
137	33	Phytosanitaire	phytosanitaire	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
138	34	Étude d'impact	etude-dimpact	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
139	34	Développement durable	developpement-durable	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
140	34	Gestion des déchets	gestion-des-dechets	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
141	34	Énergies renouvelables	energies-renouvelables	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
142	36	TCP/IP	tcpip	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
143	36	Cisco	cisco	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
144	36	Fibre optique	fibre-optique	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
145	36	4G/5G	4g5g	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
146	36	VSAT	vsat	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
147	36	VoIP	voip	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
148	38	Agile	agile	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
149	38	Scrum	scrum	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
150	38	Kanban	kanban	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
151	38	PRINCE2	prince2	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
152	38	PMP	pmp	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
153	38	Lean	lean	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	5
154	39	Jira	jira	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	0
155	39	Trello	trello	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	1
156	39	Notion	notion	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	2
157	39	Asana	asana	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	3
158	39	Monday.com	mondaycom	2026-09-10 12:22:06	2026-09-10 12:22:06	\N	4
159	41	Allemand	allemand	2026-09-10 12:22:07	2026-09-10 12:22:07	\N	3
160	41	Chinois	chinois	2026-09-10 12:22:07	2026-09-10 12:22:07	\N	4
161	41	Arabe	arabe	2026-09-10 12:22:07	2026-09-10 12:22:07	\N	5
\.


--
-- Data for Name: universities; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.universities (id, owner_user_id, name, slug, description, country, city, address, latitude, longitude, website, logo_path, is_verified, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.users (id, name, email, email_verified_at, password, remember_token, created_at, updated_at, role, phone, avatar_path, status, deleted_at, first_name, last_name, country, theme_preference, font_size, high_contrast, reduce_motion) FROM stdin;
7	RAN Consulting and Agency	ainaannick3@gmail.com	\N	$2y$12$UG/3/Ts.gjRvdqDmCMQhXuKOLTykkR.mUMD8CAPacx9aT2Dgea/6.	\N	2026-10-01 08:27:52	2026-10-01 08:27:52	company	\N	\N	active	\N	\N	\N	\N	dark	normal	f	f
6	TechCorp	techcorp@test.com	2026-10-01 07:16:16	$2y$12$lsSgpoERYolT.evlIrSFeuD.f1PP0LGlBF1tL.IqfMkttz47D4YKa	\N	2026-09-10 20:02:23	2026-10-01 12:57:55	company	\N	\N	active	\N	\N	\N	\N	light	normal	f	f
2	Holie Hello	Cookiemix@gmail.com	2026-10-01 07:16:16	$2y$12$8cBZvfrzkJr.F8D16Yh7le3G0u6KRzGuwnvjyacwE7mQdi1JMJkp6	\N	2026-09-07 14:04:36	2026-10-01 07:16:16	company	\N	\N	active	\N	\N	\N	\N	dark	normal	f	f
3	Admin TalentShare	admin@talentshare.mg	2026-10-01 07:16:16	$2y$12$Wm2kfXtVJsUeYleO8AD0qepRcSAYGEl0qQiEQD3UmK/w4YtSD7AkK	\N	2026-09-07 19:15:07	2026-10-01 07:16:16	admin	\N	\N	active	\N	\N	\N	\N	dark	normal	f	f
4	Test P0-3	testp03@talentshare.mg	2026-10-01 07:16:16	$2y$12$cbOw6wiCMypcSYeyC.cS2umr9pTVm0S0IUR.TlVCkZahR1cVTN242	\N	2026-09-08 08:10:23	2026-10-01 07:16:16	employee	\N	\N	active	\N	\N	\N	\N	dark	normal	f	f
5	Nyavoramanandriantsoa	nyavoramanandriantsoa@gmail.com	2026-10-01 07:16:16	$2y$12$M.ol7s4ju4kGKQ2ueHhaw.f0VvxXeR/IrOA98yHcqy/yEIA/XZvJG	\N	2026-09-08 08:22:04	2026-10-01 07:16:16	employee	\N	\N	active	\N	\N	\N	\N	dark	normal	f	f
1	Lovaniaina Candy Aina	candylovaniaina@gmail.com	2026-10-01 07:16:16	$2y$12$YFNX1bG4ZV9.G1UN8ebpoeufXOBMaDWbKhDdvG5K1yInGTK5zKzR2	\N	2026-09-07 14:01:28	2026-10-01 07:16:16	employee	0344682429	\N	active	\N	Lovaniaina	Candy Aina	Maurice	dark	small	t	f
\.


--
-- Data for Name: verification_requests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.verification_requests (id, verifiable_type, verifiable_id, requested_by, reviewed_by, document_path, status, review_note, created_at, updated_at, deleted_at) FROM stdin;
1	App\\Models\\Company	1	2	3	\N	approved	\N	2026-09-07 14:36:38	2026-09-07 19:26:04	\N
\.


--
-- Name: applications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.applications_id_seq', 4, true);


--
-- Name: availability_windows_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.availability_windows_id_seq', 2, true);


--
-- Name: certifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.certifications_id_seq', 4, true);


--
-- Name: companies_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.companies_id_seq', 3, true);


--
-- Name: company_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.company_members_id_seq', 5, true);


--
-- Name: conversation_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversation_participants_id_seq', 9, true);


--
-- Name: conversations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.conversations_id_seq', 4, true);


--
-- Name: document_history_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_history_id_seq', 3, true);


--
-- Name: document_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.document_versions_id_seq', 1, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.documents_id_seq', 4, true);


--
-- Name: educations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.educations_id_seq', 5, true);


--
-- Name: employees_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.employees_id_seq', 3, true);


--
-- Name: experiences_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.experiences_id_seq', 3, true);


--
-- Name: failed_jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.failed_jobs_id_seq', 1, false);


--
-- Name: job_offer_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_offer_skill_id_seq', 1, false);


--
-- Name: job_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.job_offers_id_seq', 3, true);


--
-- Name: jobs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.jobs_id_seq', 1, false);


--
-- Name: languages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.languages_id_seq', 5, true);


--
-- Name: match_interactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_interactions_id_seq', 1, false);


--
-- Name: match_weights_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.match_weights_id_seq', 1, false);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.messages_id_seq', 9, true);


--
-- Name: migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.migrations_id_seq', 79, true);


--
-- Name: missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.missions_id_seq', 7, true);


--
-- Name: notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.notifications_id_seq', 29, true);


--
-- Name: personal_access_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.personal_access_tokens_id_seq', 87, true);


--
-- Name: portfolio_projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.portfolio_projects_id_seq', 2, true);


--
-- Name: portfolios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.portfolios_id_seq', 2, true);


--
-- Name: professional_profiles_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.professional_profiles_id_seq', 4, true);


--
-- Name: profile_skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.profile_skills_id_seq', 10, true);


--
-- Name: proposals_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.proposals_id_seq', 7, true);


--
-- Name: ratings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.ratings_id_seq', 1, false);


--
-- Name: resource_offers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_offers_id_seq', 2, true);


--
-- Name: resource_request_skill_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_request_skill_id_seq', 6, true);


--
-- Name: resource_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.resource_requests_id_seq', 3, true);


--
-- Name: saved_searches_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.saved_searches_id_seq', 1, false);


--
-- Name: skill_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skill_categories_id_seq', 41, true);


--
-- Name: skills_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.skills_id_seq', 161, true);


--
-- Name: universities_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.universities_id_seq', 1, false);


--
-- Name: users_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.users_id_seq', 7, true);


--
-- Name: verification_requests_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.verification_requests_id_seq', 1, true);


--
-- Name: applications applications_job_offer_id_professional_profile_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_offer_id_professional_profile_id_unique UNIQUE (job_offer_id, professional_profile_id);


--
-- Name: applications applications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_pkey PRIMARY KEY (id);


--
-- Name: availability_windows availability_windows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_windows
    ADD CONSTRAINT availability_windows_pkey PRIMARY KEY (id);


--
-- Name: cache_locks cache_locks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache_locks
    ADD CONSTRAINT cache_locks_pkey PRIMARY KEY (key);


--
-- Name: cache cache_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.cache
    ADD CONSTRAINT cache_pkey PRIMARY KEY (key);


--
-- Name: certifications certifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_pkey PRIMARY KEY (id);


--
-- Name: companies companies_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_pkey PRIMARY KEY (id);


--
-- Name: companies companies_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_slug_unique UNIQUE (slug);


--
-- Name: company_members company_members_company_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT company_members_company_id_user_id_unique UNIQUE (company_id, user_id);


--
-- Name: company_members company_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT company_members_pkey PRIMARY KEY (id);


--
-- Name: conversation_participants conversation_participants_conversation_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_user_id_unique UNIQUE (conversation_id, user_id);


--
-- Name: conversation_participants conversation_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_pkey PRIMARY KEY (id);


--
-- Name: conversations conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversations
    ADD CONSTRAINT conversations_pkey PRIMARY KEY (id);


--
-- Name: document_history document_history_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_pkey PRIMARY KEY (id);


--
-- Name: document_versions document_versions_document_id_version_number_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_version_number_unique UNIQUE (document_id, version_number);


--
-- Name: document_versions document_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: educations educations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.educations
    ADD CONSTRAINT educations_pkey PRIMARY KEY (id);


--
-- Name: employees employees_company_id_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_company_id_user_id_unique UNIQUE (company_id, user_id);


--
-- Name: employees employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_pkey PRIMARY KEY (id);


--
-- Name: experiences experiences_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_pkey PRIMARY KEY (id);


--
-- Name: failed_jobs failed_jobs_uuid_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.failed_jobs
    ADD CONSTRAINT failed_jobs_uuid_unique UNIQUE (uuid);


--
-- Name: job_batches job_batches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_batches
    ADD CONSTRAINT job_batches_pkey PRIMARY KEY (id);


--
-- Name: job_offer_skill job_offer_skill_job_offer_id_skill_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offer_skill
    ADD CONSTRAINT job_offer_skill_job_offer_id_skill_id_unique UNIQUE (job_offer_id, skill_id);


--
-- Name: job_offer_skill job_offer_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offer_skill
    ADD CONSTRAINT job_offer_skill_pkey PRIMARY KEY (id);


--
-- Name: job_offers job_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_pkey PRIMARY KEY (id);


--
-- Name: jobs jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.jobs
    ADD CONSTRAINT jobs_pkey PRIMARY KEY (id);


--
-- Name: languages languages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_pkey PRIMARY KEY (id);


--
-- Name: languages languages_professional_profile_id_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_professional_profile_id_name_unique UNIQUE (professional_profile_id, name);


--
-- Name: match_interactions match_interactions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_interactions
    ADD CONSTRAINT match_interactions_pkey PRIMARY KEY (id);


--
-- Name: match_weights match_weights_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.match_weights
    ADD CONSTRAINT match_weights_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- Name: missions missions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_pkey PRIMARY KEY (id);


--
-- Name: missions missions_proposal_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_proposal_id_unique UNIQUE (proposal_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (email);


--
-- Name: personal_access_tokens personal_access_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_pkey PRIMARY KEY (id);


--
-- Name: personal_access_tokens personal_access_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.personal_access_tokens
    ADD CONSTRAINT personal_access_tokens_token_unique UNIQUE (token);


--
-- Name: portfolio_projects portfolio_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_projects
    ADD CONSTRAINT portfolio_projects_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_pkey PRIMARY KEY (id);


--
-- Name: portfolios portfolios_professional_profile_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_professional_profile_id_unique UNIQUE (professional_profile_id);


--
-- Name: portfolios portfolios_public_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_public_slug_unique UNIQUE (public_slug);


--
-- Name: professional_profiles professional_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_pkey PRIMARY KEY (id);


--
-- Name: professional_profiles professional_profiles_user_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_unique UNIQUE (user_id);


--
-- Name: profile_skills profile_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_pkey PRIMARY KEY (id);


--
-- Name: profile_skills profile_skills_professional_profile_id_skill_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_professional_profile_id_skill_id_unique UNIQUE (professional_profile_id, skill_id);


--
-- Name: proposals proposals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_pkey PRIMARY KEY (id);


--
-- Name: proposals proposals_resource_request_id_professional_profile_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_resource_request_id_professional_profile_id_unique UNIQUE (resource_request_id, professional_profile_id);


--
-- Name: ratings ratings_mission_id_rated_by_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_mission_id_rated_by_unique UNIQUE (mission_id, rated_by);


--
-- Name: ratings ratings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_pkey PRIMARY KEY (id);


--
-- Name: resource_offer_skill resource_offer_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offer_skill
    ADD CONSTRAINT resource_offer_skill_pkey PRIMARY KEY (resource_offer_id, skill_id);


--
-- Name: resource_offers resource_offers_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offers
    ADD CONSTRAINT resource_offers_pkey PRIMARY KEY (id);


--
-- Name: resource_request_skill resource_request_skill_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_request_skill
    ADD CONSTRAINT resource_request_skill_pkey PRIMARY KEY (id);


--
-- Name: resource_request_skill resource_request_skill_resource_request_id_skill_id_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_request_skill
    ADD CONSTRAINT resource_request_skill_resource_request_id_skill_id_unique UNIQUE (resource_request_id, skill_id);


--
-- Name: resource_requests resource_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_pkey PRIMARY KEY (id);


--
-- Name: saved_searches saved_searches_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.saved_searches
    ADD CONSTRAINT saved_searches_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_pkey PRIMARY KEY (id);


--
-- Name: skill_categories skill_categories_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_slug_unique UNIQUE (slug);


--
-- Name: skills skills_name_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_name_unique UNIQUE (name);


--
-- Name: skills skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_pkey PRIMARY KEY (id);


--
-- Name: skills skills_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_slug_unique UNIQUE (slug);


--
-- Name: universities universities_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_pkey PRIMARY KEY (id);


--
-- Name: universities universities_slug_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_slug_unique UNIQUE (slug);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: verification_requests verification_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_pkey PRIMARY KEY (id);


--
-- Name: applications_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX applications_status_index ON public.applications USING btree (status);


--
-- Name: availability_windows_professional_profile_id_start_at_end_at_in; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX availability_windows_professional_profile_id_start_at_end_at_in ON public.availability_windows USING btree (professional_profile_id, start_at, end_at);


--
-- Name: availability_windows_professional_profile_id_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX availability_windows_professional_profile_id_status_index ON public.availability_windows USING btree (professional_profile_id, status);


--
-- Name: cache_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_expiration_index ON public.cache USING btree (expiration);


--
-- Name: cache_locks_expiration_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX cache_locks_expiration_index ON public.cache_locks USING btree (expiration);


--
-- Name: certifications_professional_profile_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX certifications_professional_profile_id_index ON public.certifications USING btree (professional_profile_id);


--
-- Name: companies_owner_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX companies_owner_user_id_index ON public.companies USING btree (owner_user_id);


--
-- Name: conversations_subject_type_subject_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX conversations_subject_type_subject_id_index ON public.conversations USING btree (subject_type, subject_id);


--
-- Name: document_history_action_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX document_history_action_index ON public.document_history USING btree (action);


--
-- Name: document_history_document_id_created_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX document_history_document_id_created_at_index ON public.document_history USING btree (document_id, created_at);


--
-- Name: document_versions_document_id_created_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX document_versions_document_id_created_at_index ON public.document_versions USING btree (document_id, created_at);


--
-- Name: documents_document_type_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_document_type_status_index ON public.documents USING btree (document_type, status);


--
-- Name: documents_documentable_type_documentable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_documentable_type_documentable_id_index ON public.documents USING btree (documentable_type, documentable_id);


--
-- Name: documents_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX documents_expires_at_index ON public.documents USING btree (expires_at);


--
-- Name: educations_professional_profile_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX educations_professional_profile_id_index ON public.educations USING btree (professional_profile_id);


--
-- Name: experiences_professional_profile_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX experiences_professional_profile_id_index ON public.experiences USING btree (professional_profile_id);


--
-- Name: failed_jobs_connection_queue_failed_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX failed_jobs_connection_queue_failed_at_index ON public.failed_jobs USING btree (connection, queue, failed_at);


--
-- Name: job_offers_country_city_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_offers_country_city_index ON public.job_offers USING btree (country, city);


--
-- Name: job_offers_status_offer_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX job_offers_status_offer_type_index ON public.job_offers USING btree (status, offer_type);


--
-- Name: jobs_queue_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX jobs_queue_index ON public.jobs USING btree (queue);


--
-- Name: messages_conversation_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX messages_conversation_id_index ON public.messages USING btree (conversation_id);


--
-- Name: missions_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX missions_status_index ON public.missions USING btree (status);


--
-- Name: notifications_subject_type_subject_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_subject_type_subject_id_index ON public.notifications USING btree (subject_type, subject_id);


--
-- Name: notifications_user_id_read_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX notifications_user_id_read_at_index ON public.notifications USING btree (user_id, read_at);


--
-- Name: personal_access_tokens_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_expires_at_index ON public.personal_access_tokens USING btree (expires_at);


--
-- Name: personal_access_tokens_tokenable_type_tokenable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX personal_access_tokens_tokenable_type_tokenable_id_index ON public.personal_access_tokens USING btree (tokenable_type, tokenable_id);


--
-- Name: portfolio_projects_portfolio_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX portfolio_projects_portfolio_id_index ON public.portfolio_projects USING btree (portfolio_id);


--
-- Name: professional_profiles_profile_type_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX professional_profiles_profile_type_index ON public.professional_profiles USING btree (profile_type);


--
-- Name: proposals_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proposals_expires_at_index ON public.proposals USING btree (expires_at);


--
-- Name: proposals_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proposals_status_index ON public.proposals USING btree (status);


--
-- Name: proposals_to_company_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX proposals_to_company_id_index ON public.proposals USING btree (to_company_id);


--
-- Name: resource_offers_country_city_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_offers_country_city_index ON public.resource_offers USING btree (country, city);


--
-- Name: resource_offers_start_at_end_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_offers_start_at_end_at_index ON public.resource_offers USING btree (start_at, end_at);


--
-- Name: resource_offers_status_visibility_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_offers_status_visibility_index ON public.resource_offers USING btree (status, visibility);


--
-- Name: resource_requests_start_at_end_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_requests_start_at_end_at_index ON public.resource_requests USING btree (start_at, end_at);


--
-- Name: resource_requests_status_expires_at_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_requests_status_expires_at_index ON public.resource_requests USING btree (status, expires_at);


--
-- Name: resource_requests_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_requests_status_index ON public.resource_requests USING btree (status);


--
-- Name: resource_requests_urgency_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX resource_requests_urgency_index ON public.resource_requests USING btree (urgency);


--
-- Name: sessions_last_activity_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_last_activity_index ON public.sessions USING btree (last_activity);


--
-- Name: sessions_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX sessions_user_id_index ON public.sessions USING btree (user_id);


--
-- Name: universities_owner_user_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX universities_owner_user_id_index ON public.universities USING btree (owner_user_id);


--
-- Name: verification_requests_status_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_requests_status_index ON public.verification_requests USING btree (status);


--
-- Name: verification_requests_verifiable_type_verifiable_id_index; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX verification_requests_verifiable_type_verifiable_id_index ON public.verification_requests USING btree (verifiable_type, verifiable_id);


--
-- Name: applications applications_job_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_job_offer_id_foreign FOREIGN KEY (job_offer_id) REFERENCES public.job_offers(id) ON DELETE CASCADE;


--
-- Name: applications applications_portfolio_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_portfolio_id_foreign FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE SET NULL;


--
-- Name: applications applications_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.applications
    ADD CONSTRAINT applications_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: availability_windows availability_windows_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.availability_windows
    ADD CONSTRAINT availability_windows_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: certifications certifications_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.certifications
    ADD CONSTRAINT certifications_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: companies companies_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.companies
    ADD CONSTRAINT companies_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: company_members company_members_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT company_members_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: company_members company_members_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.company_members
    ADD CONSTRAINT company_members_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_conversation_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_conversation_id_foreign FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: conversation_participants conversation_participants_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.conversation_participants
    ADD CONSTRAINT conversation_participants_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: document_history document_history_document_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_document_id_foreign FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_history document_history_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_history
    ADD CONSTRAINT document_history_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: document_versions document_versions_document_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_document_id_foreign FOREIGN KEY (document_id) REFERENCES public.documents(id) ON DELETE CASCADE;


--
-- Name: document_versions document_versions_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.document_versions
    ADD CONSTRAINT document_versions_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: documents documents_signed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_signed_by_foreign FOREIGN KEY (signed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- Name: documents documents_uploaded_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_uploaded_by_foreign FOREIGN KEY (uploaded_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: educations educations_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.educations
    ADD CONSTRAINT educations_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: employees employees_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: employees employees_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employees
    ADD CONSTRAINT employees_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: experiences experiences_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.experiences
    ADD CONSTRAINT experiences_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: job_offer_skill job_offer_skill_job_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offer_skill
    ADD CONSTRAINT job_offer_skill_job_offer_id_foreign FOREIGN KEY (job_offer_id) REFERENCES public.job_offers(id) ON DELETE CASCADE;


--
-- Name: job_offer_skill job_offer_skill_skill_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offer_skill
    ADD CONSTRAINT job_offer_skill_skill_id_foreign FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: job_offers job_offers_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: job_offers job_offers_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_offers
    ADD CONSTRAINT job_offers_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: languages languages_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.languages
    ADD CONSTRAINT languages_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_conversation_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_conversation_id_foreign FOREIGN KEY (conversation_id) REFERENCES public.conversations(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_foreign FOREIGN KEY (sender_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: missions missions_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: missions missions_proposal_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_proposal_id_foreign FOREIGN KEY (proposal_id) REFERENCES public.proposals(id) ON DELETE CASCADE;


--
-- Name: missions missions_requesting_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_requesting_company_id_foreign FOREIGN KEY (requesting_company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: missions missions_resource_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_resource_offer_id_foreign FOREIGN KEY (resource_offer_id) REFERENCES public.resource_offers(id) ON DELETE SET NULL;


--
-- Name: missions missions_supplying_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_supplying_company_id_foreign FOREIGN KEY (supplying_company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: portfolio_projects portfolio_projects_portfolio_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolio_projects
    ADD CONSTRAINT portfolio_projects_portfolio_id_foreign FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id) ON DELETE CASCADE;


--
-- Name: portfolios portfolios_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.portfolios
    ADD CONSTRAINT portfolios_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: professional_profiles professional_profiles_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.professional_profiles
    ADD CONSTRAINT professional_profiles_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: profile_skills profile_skills_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: profile_skills profile_skills_skill_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.profile_skills
    ADD CONSTRAINT profile_skills_skill_id_foreign FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_proposed_by_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_proposed_by_company_id_foreign FOREIGN KEY (proposed_by_company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_resource_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_resource_offer_id_foreign FOREIGN KEY (resource_offer_id) REFERENCES public.resource_offers(id) ON DELETE SET NULL;


--
-- Name: proposals proposals_resource_request_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_resource_request_id_foreign FOREIGN KEY (resource_request_id) REFERENCES public.resource_requests(id) ON DELETE CASCADE;


--
-- Name: proposals proposals_to_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.proposals
    ADD CONSTRAINT proposals_to_company_id_foreign FOREIGN KEY (to_company_id) REFERENCES public.companies(id) ON DELETE SET NULL;


--
-- Name: ratings ratings_mission_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_mission_id_foreign FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: ratings ratings_rated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ratings
    ADD CONSTRAINT ratings_rated_by_foreign FOREIGN KEY (rated_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: resource_offer_skill resource_offer_skill_resource_offer_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offer_skill
    ADD CONSTRAINT resource_offer_skill_resource_offer_id_foreign FOREIGN KEY (resource_offer_id) REFERENCES public.resource_offers(id) ON DELETE CASCADE;


--
-- Name: resource_offer_skill resource_offer_skill_skill_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offer_skill
    ADD CONSTRAINT resource_offer_skill_skill_id_foreign FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: resource_offers resource_offers_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offers
    ADD CONSTRAINT resource_offers_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: resource_offers resource_offers_professional_profile_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_offers
    ADD CONSTRAINT resource_offers_professional_profile_id_foreign FOREIGN KEY (professional_profile_id) REFERENCES public.professional_profiles(id) ON DELETE CASCADE;


--
-- Name: resource_request_skill resource_request_skill_resource_request_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_request_skill
    ADD CONSTRAINT resource_request_skill_resource_request_id_foreign FOREIGN KEY (resource_request_id) REFERENCES public.resource_requests(id) ON DELETE CASCADE;


--
-- Name: resource_request_skill resource_request_skill_skill_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_request_skill
    ADD CONSTRAINT resource_request_skill_skill_id_foreign FOREIGN KEY (skill_id) REFERENCES public.skills(id) ON DELETE CASCADE;


--
-- Name: resource_requests resource_requests_company_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_company_id_foreign FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;


--
-- Name: resource_requests resource_requests_created_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.resource_requests
    ADD CONSTRAINT resource_requests_created_by_foreign FOREIGN KEY (created_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: skill_categories skill_categories_parent_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skill_categories
    ADD CONSTRAINT skill_categories_parent_id_foreign FOREIGN KEY (parent_id) REFERENCES public.skill_categories(id) ON DELETE SET NULL;


--
-- Name: skills skills_skill_category_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.skills
    ADD CONSTRAINT skills_skill_category_id_foreign FOREIGN KEY (skill_category_id) REFERENCES public.skill_categories(id) ON DELETE SET NULL;


--
-- Name: universities universities_owner_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.universities
    ADD CONSTRAINT universities_owner_user_id_foreign FOREIGN KEY (owner_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_requested_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_requested_by_foreign FOREIGN KEY (requested_by) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: verification_requests verification_requests_reviewed_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.verification_requests
    ADD CONSTRAINT verification_requests_reviewed_by_foreign FOREIGN KEY (reviewed_by) REFERENCES public.users(id) ON DELETE SET NULL;


--
-- PostgreSQL database dump complete
--

\unrestrict xEUuUA8loR3HRcwPM7uXEAHFkwiq0WQwa1M3ReMgDxJo7byxdpzAu8OKFrU2rZ3

