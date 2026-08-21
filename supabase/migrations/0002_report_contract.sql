-- Store the ReportContract whole, alongside the normalised columns.
--
-- The normalised tables (run_dimensions, run_caps, run_reports) remain the queryable record —
-- they are what you would aggregate over to compare coaches. But rebuilding the page's contract
-- from them is lossy: the talk-share interval, each cap's statement, which branch an
-- indeterminate cap was scored on, and the derived char offsets behind every quote have no
-- column of their own, and inventing columns for each would be schema churn in service of one
-- consumer.
--
-- So the page reads exactly what the scorer produced, byte for byte. A report rendered next week
-- is the report that was computed, not a reconstruction of it that might differ in a detail
-- nobody checks. That is the same reason rubric packs are stored by content hash.
alter table run_reports add column if not exists contract jsonb;

comment on column run_reports.contract is
  'The full ReportContract (lib/report/contract.ts) as produced by the scorer. Source of truth for rendering.';
