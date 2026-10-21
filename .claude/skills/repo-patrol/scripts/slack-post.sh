#!/usr/bin/env bash
# 巡回の結果を Slack に 1 回投稿する。
# usage: slack-post.sh <本文ファイル>
#
# - 宛先は、リポジトリの .claude/repo-patrol.md の「## Slack チャンネル」に書いたチャンネル ID か #チャンネル名だけ
#   （巡回は .claude を書き換えられないので、宛先を変えられない）。トークンは cloud environment の network secret（host slack.com）が付ける
# - 本文の & < > はすべてエスケープする（Issue のタイトルなどに含まれる <!channel> やリンク記法を無効にする）
# - メンションは、本文の先頭にある {{mention}} を @channel に置き換えたものだけ。
#   先頭以外の {{mention}}（Issue のタイトルに書かれたものなど）はそのまま文字として送る
# - REPO_PATROL=1 でなければ投稿せず、宛先と送る本文を表示する
# - 一時的なエラー（HTTP 429・5xx・通信の失敗・ratelimited など）だけ Retry-After を守って 3 回まで試し、だめなら exit 1
set -euo pipefail

file=$1
mention="<!channel>"

render() {
  jq -Rrs --arg mention "$mention" '
    gsub("&"; "&amp;") | gsub("<"; "&lt;") | gsub(">"; "&gt;")
    | if startswith("{{mention}}") then $mention + .[11:] else . end
  ' "$file"
}

config="$(git rev-parse --show-toplevel)/.claude/repo-patrol.md"
channel=$(awk '
  /^## / { in_section = ($0 ~ /^## Slack チャンネル[[:space:]]*$/); next }
  in_section && NF { gsub(/[`[:space:]]/, ""); print; exit }
' "$config" 2>/dev/null || true)
if ! [[ $channel =~ ^([CG][A-Z0-9]{6,}|#[a-z0-9][a-z0-9._-]{0,79})$ ]]; then
  echo "$config の「## Slack チャンネル」にチャンネル ID か #チャンネル名がない: '$channel'" >&2
  exit 1
fi

if [ "${REPO_PATROL:-}" != 1 ]; then
  echo "（REPO_PATROL=1 ではないので投稿しない。宛先: ${channel}。送る本文:）"
  render
  exit 0
fi

payload=$(jq -n --arg channel "$channel" --arg text "$(render)" \
  '{ channel: $channel, text: $text, unfurl_links: false, unfurl_media: false }')

headers=$(mktemp)
body=$(mktemp)
trap 'rm -f "$headers" "$body"' EXIT

error=unknown
for attempt in 1 2 3; do
  code=$(curl -sS -D "$headers" -o "$body" -w '%{http_code}' -X POST https://slack.com/api/chat.postMessage \
    -H 'Content-Type: application/json; charset=utf-8' \
    --data-binary "$payload") || code=000
  if [ "$(jq -r '.ok // false' "$body" 2>/dev/null || echo false)" = true ]; then
    echo "投稿した（ts=$(jq -r .ts "$body")）"
    exit 0
  fi
  error=$(jq -r '.error // empty' "$body" 2>/dev/null || true)
  error="${error:-http_$code}"
  transient=0
  case $code in
  000 | 429 | 5??) transient=1 ;;
  esac
  case $error in
  ratelimited | internal_error | fatal_error | service_unavailable | request_timeout) transient=1 ;;
  esac
  if [ "$transient" -eq 0 ]; then
    echo "Slack への投稿に失敗した: $error" >&2
    exit 1
  fi
  [ "$attempt" -lt 3 ] || break
  wait=$(awk 'tolower($1) == "retry-after:" { print $2 + 0 }' "$headers")
  sleep "${wait:-5}"
done
echo "Slack への投稿に失敗した: ${error}（3 回試した）" >&2
exit 1
