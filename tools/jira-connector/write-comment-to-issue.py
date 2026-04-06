#!/usr/bin/env python3
"""Add a comment to a Jira issue.

Usage:
    python write-comment-to-issue.py <ISSUE_KEY> <COMMENT_TEXT>

Example:
    python write-comment-to-issue.py TAM-42 "Spec work started for this epic."
"""

import json
import sys

from jira_client import add_comment, load_config


def main() -> None:
    if len(sys.argv) < 3:
        print("Usage: python write-comment-to-issue.py <ISSUE_KEY> <COMMENT_TEXT>", file=sys.stderr)
        sys.exit(1)

    issue_key = sys.argv[1].strip().upper()
    comment_text = " ".join(sys.argv[2:])
    cfg = load_config()

    result = add_comment(cfg, issue_key, comment_text)
    print(json.dumps({"id": result.get("id"), "issue_key": issue_key, "status": "created"}, indent=2))


if __name__ == "__main__":
    main()
