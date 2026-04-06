#!/usr/bin/env python3
"""Fetch the single highest-ranked epic in 'Ready' status.

Returns one JSON object with the epic's key, summary, status, and
description text extracted from the Jira Atlassian Document Format.
If no epic is in the ready status, exits with code 0 and prints null.

Usage:
    python fetch-epics.py

Example output:
    {
      "key": "TAM-12",
      "summary": "Calendar virtual values",
      "status": "Ready",
      "description": "As an employee I want ..."
    }
"""

import json

from jira_client import extract_description_text, load_config, search_issues


def main() -> None:
    cfg = load_config()
    project_key = cfg["project_key"]
    issue_type = cfg["issue_type"]
    ready_status = cfg["ready_status"]

    jql = (
        f'project = "{project_key}" AND issuetype = "{issue_type}" '
        f'AND status = "{ready_status}" ORDER BY Rank ASC'
    )

    issues = search_issues(cfg, jql, max_results=1)

    if not issues:
        print(json.dumps(None))
        return

    issue = issues[0]
    fields = issue.get("fields", {})
    result = {
        "key": issue.get("key"),
        "summary": fields.get("summary"),
        "status": fields.get("status", {}).get("name"),
        "description": extract_description_text(fields.get("description")),
    }

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
