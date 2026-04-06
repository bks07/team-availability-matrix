"""Shared Jira Cloud REST API client used by all connector scripts."""

import os
import sys
from pathlib import Path

import requests
import yaml


def load_config() -> dict:
    config_path = Path(__file__).parent / "config.yml"
    with open(config_path, "r") as f:
        cfg = yaml.safe_load(f) or {}

    jira = cfg.get("jira", {})
    project = cfg.get("project", {})
    epic = cfg.get("epic", {})

    base_url = os.environ.get("JIRA_BASE_URL", jira.get("base_url", ""))
    user_email = os.environ.get("JIRA_USER_EMAIL", jira.get("user_email", ""))
    api_token = os.environ.get("JIRA_API_TOKEN", jira.get("api_token", ""))
    project_key = os.environ.get("JIRA_PROJECT_KEY", project.get("key", ""))

    if not base_url or not user_email or not api_token:
        print(
            "Error: JIRA_BASE_URL, JIRA_USER_EMAIL, and JIRA_API_TOKEN must be set "
            "(via environment variables or config.yml).",
            file=sys.stderr,
        )
        sys.exit(1)

    return {
        "base_url": base_url.rstrip("/"),
        "user_email": user_email,
        "api_token": api_token,
        "project_key": project_key,
        "ready_status": epic.get("ready_status", "Ready"),
        "in_progress_status": epic.get("in_progress_status", "In Progress"),
        "issue_type": epic.get("issue_type", "Epic"),
    }


def _session(cfg: dict) -> requests.Session:
    session = requests.Session()
    session.auth = (cfg["user_email"], cfg["api_token"])
    session.headers.update({"Accept": "application/json", "Content-Type": "application/json"})
    return session


def fetch_issue(cfg: dict, issue_key: str) -> dict:
    session = _session(cfg)
    url = f"{cfg['base_url']}/rest/api/3/issue/{issue_key}"
    resp = session.get(url)
    resp.raise_for_status()
    return resp.json()


def search_issues(cfg: dict, jql: str, fields: str = "summary,status,description,issuetype", max_results: int = 50) -> list[dict]:
    session = _session(cfg)
    url = f"{cfg['base_url']}/rest/api/3/search/jql"
    all_issues: list[dict] = []
    next_page_token: str | None = None

    while True:
        params: dict = {"jql": jql, "fields": fields, "maxResults": max_results}
        if next_page_token:
            params["nextPageToken"] = next_page_token
        resp = session.get(url, params=params)
        resp.raise_for_status()
        data = resp.json()
        issues = data.get("issues", [])
        all_issues.extend(issues)
        if data.get("isLast", True):
            break
        next_page_token = data.get("nextPageToken")
        if not next_page_token:
            break

    return all_issues


def add_comment(cfg: dict, issue_key: str, body: str) -> dict:
    session = _session(cfg)
    url = f"{cfg['base_url']}/rest/api/3/issue/{issue_key}/comment"
    payload = {
        "body": {
            "version": 1,
            "type": "doc",
            "content": [
                {
                    "type": "paragraph",
                    "content": [{"type": "text", "text": body}],
                }
            ],
        }
    }
    resp = session.post(url, json=payload)
    resp.raise_for_status()
    return resp.json()


def transition_issue(cfg: dict, issue_key: str, target_status: str) -> None:
    session = _session(cfg)
    url = f"{cfg['base_url']}/rest/api/3/issue/{issue_key}/transitions"

    resp = session.get(url)
    resp.raise_for_status()
    transitions = resp.json().get("transitions", [])

    match = next((t for t in transitions if t["name"].lower() == target_status.lower()), None)
    if not match:
        available = ", ".join(t["name"] for t in transitions)
        print(f"Error: No transition to '{target_status}'. Available: {available}", file=sys.stderr)
        sys.exit(1)

    resp = session.post(url, json={"transition": {"id": match["id"]}})
    resp.raise_for_status()


def extract_description_text(description: dict | None) -> str:
    if not description:
        return ""

    parts: list[str] = []

    def walk(node: dict) -> None:
        if node.get("type") == "text":
            parts.append(node.get("text", ""))
        for child in node.get("content", []):
            walk(child)

    walk(description)
    return "\n".join(parts)
