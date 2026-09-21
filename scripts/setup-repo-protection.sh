#!/usr/bin/env bash
#
# ตั้งค่าฝั่ง "กติกาของ repo" ที่ตั้งในไฟล์ workflow ไม่ได้
#   1. label ที่ workflow แจ้งเตือนใช้
#   2. ruleset ของ branch main — บังคับให้ผ่านด่านตรวจก่อน merge
#
# ต้องมีสิทธิ์ admin ของ repo และติดตั้ง gh CLI แล้ว (gh auth login)
#
#   ./scripts/setup-repo-protection.sh <owner>/<repo>

set -euo pipefail

REPO="${1:-$(gh repo view --json nameWithOwner -q .nameWithOwner)}"
echo "กำลังตั้งค่าให้ repo: ${REPO}"

# ---------------------------------------------------------------------------
# 1) label
# ---------------------------------------------------------------------------
create_label() {
  local name="$1" color="$2" desc="$3"
  if gh label list --repo "${REPO}" --json name -q '.[].name' | grep -qx "${name}"; then
    gh label edit "${name}" --repo "${REPO}" --color "${color}" --description "${desc}" >/dev/null
    echo "  อัปเดต label: ${name}"
  else
    gh label create "${name}" --repo "${REPO}" --color "${color}" --description "${desc}" >/dev/null
    echo "  สร้าง label: ${name}"
  fi
}

create_label security        "d73a4a" "เรื่องความปลอดภัยที่ต้องจัดการ"
create_label automated       "ededed" "สร้างโดยระบบอัตโนมัติ"
create_label dependencies    "0366d6" "การอัปเดต dependency"
create_label "github-actions" "000000" "เกี่ยวกับ workflow ของ GitHub Actions"
create_label docker          "1d76db" "เกี่ยวกับ container / Dockerfile"

# ---------------------------------------------------------------------------
# 2) ruleset ของ branch main
#
# ประกอบด้วย
#   - ห้าม push ตรงเข้า main ต้องผ่าน Pull Request
#   - ต้องมีคนรีวิวอย่างน้อย 1 คน และรีวิวเก่าถูกยกเลิกเมื่อมี commit ใหม่
#   - ด่านตรวจทั้ง 5 ต้องเป็นสีเขียว (required status checks)
#   - ถ้ามี code scanning alert ระดับสูงค้างอยู่ ให้บล็อกการ merge
#
# หมายเหตุ: ชื่อใน required_status_checks ต้องตรงกับชื่อ "job" ไม่ใช่ชื่อ workflow
#
# ⚠️ bypass_actors ข้างล่างเปิดให้ "Repository admin" (actor_id 5) ข้ามกฎได้
#    เพราะ repo สอนนี้มีผู้ดูแลคนเดียว จึงไม่มีใครมากด approve ให้
#    **ในทีมจริงให้ลบส่วน bypass_actors ทิ้ง** ไม่งั้นกฎที่ตั้งไว้จะมีค่าเท่ากับคำแนะนำ
# ---------------------------------------------------------------------------
RULESET_NAME="ด่านตรวจโค้ดก่อนเข้า main"

RULESET_PAYLOAD=$(cat <<'JSON'
{
  "name": "RULESET_NAME_PLACEHOLDER",
  "target": "branch",
  "enforcement": "active",
  "bypass_actors": [
    {
      "actor_id": 5,
      "actor_type": "RepositoryRole",
      "bypass_mode": "always"
    }
  ],
  "conditions": {
    "ref_name": {
      "include": ["refs/heads/main"],
      "exclude": []
    }
  },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    {
      "type": "pull_request",
      "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": true,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "automatic_copilot_code_review_enabled": false,
        "allowed_merge_methods": ["squash", "merge", "rebase"]
      }
    },
    {
      "type": "required_status_checks",
      "parameters": {
        "strict_required_status_checks_policy": true,
        "do_not_enforce_on_create": false,
        "required_status_checks": [
          { "context": "quality" },
          { "context": "secret-scan" },
          { "context": "sast" },
          { "context": "sca" },
          { "context": "container-scan" },
          { "context": "codeql" }
        ]
      }
    },
    {
      "type": "code_scanning",
      "parameters": {
        "code_scanning_tools": [
          {
            "tool": "CodeQL",
            "security_alerts_threshold": "high_or_higher",
            "alerts_threshold": "errors"
          },
          {
            "tool": "Semgrep",
            "security_alerts_threshold": "high_or_higher",
            "alerts_threshold": "errors"
          }
        ]
      }
    }
  ]
}
JSON
)

RULESET_PAYLOAD="${RULESET_PAYLOAD/RULESET_NAME_PLACEHOLDER/${RULESET_NAME}}"

EXISTING_ID=$(gh api "repos/${REPO}/rulesets" -q ".[] | select(.name == \"${RULESET_NAME}\") | .id" 2>/dev/null || true)

if [ -n "${EXISTING_ID}" ]; then
  echo "  พบ ruleset เดิม (id=${EXISTING_ID}) — อัปเดตทับ"
  echo "${RULESET_PAYLOAD}" | gh api --method PUT "repos/${REPO}/rulesets/${EXISTING_ID}" --input - >/dev/null
else
  echo "  สร้าง ruleset ใหม่"
  echo "${RULESET_PAYLOAD}" | gh api --method POST "repos/${REPO}/rulesets" --input - >/dev/null
fi

echo "เรียบร้อย ✅"
echo
echo "สิ่งที่ยังต้องกดเปิดเองในหน้าเว็บ (Settings → Code security):"
echo "  - Secret scanning + Push protection"
echo "  - Dependabot alerts + Dependabot security updates"
