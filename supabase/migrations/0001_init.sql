-- BeaverMind Stage-2 QC evaluator — initial schema.
--
-- Two decisions encoded here that are not obvious from the DDL alone:
--
-- 1. uuid v4 (gen_random_uuid()), NOT v7. The run id IS the shareable public URL
--    token. RFC 9562 section 8 states v7 "MUST NOT be used as security capabilities" —
--    it embeds a creation timestamp and carries 48 fewer random bits. The
--    index-locality argument for v7 does not apply to a token only ever looked up
--    by equality.
--
-- 2. RLS is enabled on every table with ZERO policies. That is deliberate, not an
--    oversight. service_role bypasses RLS, so server-side code has full access while
--    anon and authenticated get nothing at all. A "public read by id" policy would in
--    practice be `select using (true)`, which makes the entire runs table enumerable —
--    the uuid protects an individual row, never the table. Runs are served to the
--    public through GET /api/runs/[id] instead.

-- ---------------------------------------------------------------- runs

create table runs (
  id                     uuid primary key default gen_random_uuid(),
  call_type              text not null check (call_type in ('kickoff','coaching')),

  -- canonicalised body: BOM stripped, CRLF/CR -> LF, NFC, each line rstripped,
  -- trailing blank lines dropped. Hash and line-number THIS, never the raw upload.
  transcript_body        text not null,
  transcript_sha256      text not null,

  coach_name             text,
  client_name            text,

  status                 text not null default 'queued'
                         check (status in ('queued','running','succeeded','failed')),
  error_code             text,
  error_message          text,

  -- content hashes, not hand-bumped version strings: an old run stays explainable
  -- because the exact pack and template that produced it are recoverable.
  rubric_pack_sha256     text not null,
  prompt_template_sha256 text not null,

  model_id               text not null,
  resolved_provider      text,          -- persist what actually served it
  effort                 text,
  scorer_version         text not null,

  created_at             timestamptz not null default now(),
  started_at             timestamptz,
  heartbeat_at           timestamptz,
  finished_at            timestamptz
);

-- Same input -> same run, same URL, same score. Determinism at the system level,
-- independent of anything the model does.
create unique index runs_idempotency on runs
  (transcript_sha256, call_type, rubric_pack_sha256, prompt_template_sha256,
   model_id, scorer_version);

-- Supports the stale-heartbeat sweep (>120s without a beat -> worker_died).
create index runs_running_heartbeat on runs (heartbeat_at)
  where status = 'running';

-- ---------------------------------------------------------- run_dimensions

create table run_dimensions (
  run_id          uuid not null references runs(id) on delete cascade,
  dimension_id    text not null,                  -- 'D1'..'D12'
  score           numeric,                        -- null when disabled or not evidenced
  max_points      numeric not null,               -- post-promotion, so D2-N/A is visible here
  bucket_matched  text,
  disabled        boolean not null default false,
  disabled_reason text,
  not_evidenced   boolean not null default false,
  reasoning       text,
  quick_fix       text,
  -- [{line, char_start, char_end, speaker, quote, status}]
  -- status: verified | verified_location_mismatch | not_found
  evidence        jsonb not null default '[]',
  generation_id   text,
  primary key (run_id, dimension_id)
);

-- ---------------------------------------------------------------- run_caps

create table run_caps (
  run_id           uuid not null references runs(id) on delete cascade,
  cap_id           text not null,
  -- three states, never a boolean: a boolean cannot express coaching-01, where a
  -- booking is agreed at L188 and walked back at L193.
  determination    text not null
                   check (determination in ('fired','not_fired','indeterminate')),
  scope            text not null check (scope in ('dimension','total')),
  clamp_value      numeric,
  supporting       jsonb not null default '[]',
  counter_evidence jsonb not null default '[]',
  primary key (run_id, cap_id)
);

-- ------------------------------------------------------------- run_reports

create table run_reports (
  run_id                    uuid primary key references runs(id) on delete cascade,
  one_thing                 text,
  one_thing_projected_score numeric,
  brief                     text,
  red_flags                 jsonb not null default '[]',
  raw_total                 numeric,
  max_possible              numeric,
  normalized_total          numeric,
  band                      text,
  -- e.g. the coaching rubric's own dimensions sum to 105 while it states 100/85,
  -- and its stated 85-with-D4-off is arithmetically wrong (the other eleven sum
  -- to 90). Surfaced rather than papered over.
  rubric_arithmetic_note    text
);

-- ------------------------------------------------------------ rubric_packs

-- Stored by their own content hash so a run from last week still resolves to the
-- exact pack that scored it.
create table rubric_packs (
  sha256    text primary key,
  call_type text not null check (call_type in ('kickoff','coaching')),
  pack      jsonb not null
);

-- ------------------------------------------------------------------- RLS

alter table runs           enable row level security;
alter table run_dimensions enable row level security;
alter table run_caps       enable row level security;
alter table run_reports    enable row level security;
alter table rubric_packs   enable row level security;

-- No policies by design. service_role bypasses RLS; every other role is denied.
