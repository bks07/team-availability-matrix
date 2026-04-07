use axum::http::StatusCode;
use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use sqlx::FromRow;

use crate::error::ApiError;

#[derive(Debug, Deserialize, Serialize, Clone, Copy, PartialEq, Eq)]
pub(crate) enum StatusValue {
    #[serde(rename = "W")]
    Working,
    #[serde(rename = "V")]
    Vacation,
    #[serde(rename = "A")]
    Absence,
}

impl StatusValue {
    pub(crate) fn as_db_value(self) -> &'static str {
        match self {
            Self::Working => "W",
            Self::Vacation => "V",
            Self::Absence => "A",
        }
    }

    pub(crate) fn from_db_value(value: &str) -> Result<Self, ApiError> {
        match value {
            "W" => Ok(Self::Working),
            "V" => Ok(Self::Vacation),
            "A" => Ok(Self::Absence),
            _ => Err(ApiError::new(
                StatusCode::INTERNAL_SERVER_ERROR,
                "Stored availability status is invalid",
            )),
        }
    }
}

#[derive(Debug, FromRow)]
pub(crate) struct UserRecord {
    pub(crate) id: i64,
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) title: String,
    pub(crate) first_name: String,
    pub(crate) middle_name: String,
    pub(crate) last_name: String,
    pub(crate) default_team_id: Option<i64>,
    pub(crate) location_id: Option<i64>,
    pub(crate) photo_url: Option<String>,
    pub(crate) password_hash: String,
}

#[derive(Debug, FromRow)]
pub(crate) struct EmployeeRow {
    pub(crate) id: i64,
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) title: String,
    pub(crate) first_name: String,
    pub(crate) middle_name: String,
    pub(crate) last_name: String,
    pub(crate) default_team_id: Option<i64>,
    pub(crate) location_id: Option<i64>,
    pub(crate) location_name: Option<String>,
    pub(crate) photo_url: Option<String>,
}

#[derive(Debug, FromRow)]
pub(crate) struct SystemSettingRow {
    pub(crate) key: String,
    pub(crate) value: String,
}

#[derive(Debug, FromRow)]
pub(crate) struct StatusRow {
    pub(crate) user_id: i64,
    pub(crate) status_date: NaiveDate,
    pub(crate) status: String,
}

#[derive(Debug, FromRow)]
pub(crate) struct LocationRow {
    pub(crate) id: i64,
    pub(crate) name: String,
}

#[derive(Debug, FromRow)]
pub(crate) struct LocationRowWithCount {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) user_count: i64,
}

#[derive(Debug, FromRow)]
pub(crate) struct PublicHolidayRow {
    pub(crate) id: i64,
    pub(crate) holiday_date: NaiveDate,
    pub(crate) name: String,
    pub(crate) location_id: i64,
}

#[derive(Debug, FromRow)]
pub(crate) struct WorkScheduleRow {
    pub(crate) user_id: i64,
    pub(crate) monday: bool,
    pub(crate) tuesday: bool,
    pub(crate) wednesday: bool,
    pub(crate) thursday: bool,
    pub(crate) friday: bool,
    pub(crate) saturday: bool,
    pub(crate) sunday: bool,
    pub(crate) hours_per_week: Option<f64>,
    pub(crate) ignore_weekends: bool,
    pub(crate) ignore_public_holidays: bool,
}

#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub(crate) struct TeamRow {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) created_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub(crate) struct TeamMemberRow {
    pub(crate) id: i64,
    pub(crate) team_id: i64,
    pub(crate) user_id: i64,
    pub(crate) role: String,
    pub(crate) joined_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub(crate) struct TeamInvitationRow {
    pub(crate) id: i64,
    pub(crate) team_id: i64,
    pub(crate) inviter_id: i64,
    pub(crate) invitee_id: i64,
    pub(crate) status: String,
    pub(crate) created_at: chrono::DateTime<chrono::Utc>,
    pub(crate) updated_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
#[derive(Debug, FromRow)]
pub(crate) struct PermissionProfileRow {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) is_built_in: bool,
    pub(crate) created_at: chrono::DateTime<chrono::Utc>,
    pub(crate) updated_at: chrono::DateTime<chrono::Utc>,
}
