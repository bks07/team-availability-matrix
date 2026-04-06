#!/usr/bin/env python3
"""Fetch a single Jira issue by key and print its details as JSON.

Usage:
    python fetch-issue.py <ISSUE_KEY>

Example:
    python fetch-issue.py TAM-42
"""

import json
import sys

from jira_client import extract_description_text, fetch_issue, load_config


def main() -> None:
    if len(sys.argv) != 2:
        print("Usage: python fetch-issue.py <ISSUE_KEY>", file=sys.stderr)
        sys.exit(1)

    issue_key = sys.argv[1].strip().upper()
    cfg = load_config()
    issue = fetch_issue(cfg, issue_key)

    fields = issue.get("fields", {})
    result = {
        "key": issue.get("key"),
        "summary": fields.get("summary"),
        "status": fields.get("status", {}).get("name"),
        "issue_type": fields.get("issuetype", {}).get("name"),
        "description": extract_description_text(fields.get("description")),
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
