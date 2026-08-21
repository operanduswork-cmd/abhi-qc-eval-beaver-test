#!/usr/bin/env bash
# Refuse a commit that stages a real credential.
#
# Exists because a Supabase PAT was once pasted into .env.example — the *committed*
# template — rather than .env.local. Nothing leaked (no commits existed yet), but the
# only reason it was caught was a manual read. This makes it automatic.
#
# Install:  bash scripts/check-secrets.sh --install
set -uo pipefail

if [ "${1:-}" = "--install" ]; then
  hooks="$(git rev-parse --git-dir)/hooks"
  mkdir -p "$hooks"
  printf '#!/usr/bin/env bash\nexec bash "$(git rev-parse --show-toplevel)/scripts/check-secrets.sh"\n' > "$hooks/pre-commit"
  chmod +x "$hooks/pre-commit"
  echo "installed pre-commit hook -> $hooks/pre-commit"
  exit 0
fi

# label|pattern. The JWT shape catches Supabase anon/service_role keys.
PATTERNS=(
  "supabase PAT|sbp_[A-Za-z0-9]{32,}"
  "openrouter key|sk-or-v1-[A-Za-z0-9]{32,}"
  "anthropic key|sk-ant-[A-Za-z0-9_-]{32,}"
  "supabase JWT key|eyJ[A-Za-z0-9_-]{10,}\.eyJ[A-Za-z0-9_-]{10,}\."
)

fail=0
for entry in "${PATTERNS[@]}"; do
  label="${entry%%|*}"; pat="${entry#*|}"
  # --cached scans the index, -I skips binaries (no null-byte noise on images).
  while IFS= read -r hit; do
    [ -z "$hit" ] && continue
    echo "BLOCKED  ${hit%%:*}  contains a $label"
    fail=1
  done < <(git grep -I -n -E -e "$pat" --cached -- . 2>/dev/null)
done

if [ "$fail" -ne 0 ]; then
  cat <<'MSG'

Commit refused: a real credential is staged.
Secrets belong in .env.local (gitignored). The Supabase PAT belongs in the CLI
credential store via `supabase login --token`, not in any .env file.
Override only if you are certain:  git commit --no-verify
MSG
  exit 1
fi
exit 0
