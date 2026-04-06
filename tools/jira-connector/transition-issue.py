#!/usr/bin/env python3
"""Transition a Jira issue to a target status.

Usage:
    python transition-issue.py <ISSUE_KEY> <TARGET_STATUS>

Example:
    python transition-issue.py TAM-42 "In Progress"
"""

import json
import sys

from jira_client import load_config, transition_issue


def main() -> None:
    if len(sys.argv) < 3:
        print(
            "Usage: python transition-issue.py <ISSUE_KEY> <TARGET_STATUS>",
            file=sys.stderr,
        )
        sys.exit(1)

    issue_key = sys.argv[1].strip().upper()
    target_status = " ".join(sys.argv[2:])
    cfg = load_config()

    transition_issue(cfg, issue_key, target_status)
    print(
        json.dumps(
            {"issue_key": issue_key, "status": target_status, "result": "transitioned"},
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
