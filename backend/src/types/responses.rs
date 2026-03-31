use serde::{Deserialize, Serialize};

use crate::models::StatusValue;

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AuthResponse {
    pub(crate) token: String,
    pub(crate) user: PublicUser,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PublicUser {
    pub(crate) id: i64,
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) title: String,
    pub(crate) first_name: String,
    pub(crate) middle_name: String,
    pub(crate) last_name: String,
    pub(crate) location_id: Option<i64>,
    pub(crate) location_name: Option<String>,
    pub(crate) photo_url: Option<String>,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AvailabilityEntry {
    pub(crate) user_id: i64,
    pub(crate) date: String,
    pub(crate) status: StatusValue,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct MatrixResponse {
    pub(crate) year: i32,
    pub(crate) days: Vec<String>,
    pub(crate) employees: Vec<PublicUser>,
    pub(crate) entries: Vec<AvailabilityEntry>,
    pub(crate) public_holidays: Vec<PublicHolidayResponse>,
    pub(crate) work_schedules: Vec<WorkScheduleResponse>,
}

#[derive(Debug, Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub(crate) struct WorkScheduleResponse {
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

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LocationResponse {
    pub(crate) id: i64,
    pub(crate) name: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct PublicHolidayResponse {
    pub(crate) id: i64,
    pub(crate) holiday_date: String,
    pub(crate) name: String,
    pub(crate) location_id: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserPermissionsResponse {
    pub(crate) user_id: i64,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminUserResponse {
    pub(crate) id: i64,
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) title: String,
    pub(crate) first_name: String,
    pub(crate) middle_name: String,
    pub(crate) last_name: String,
    pub(crate) location_id: Option<i64>,
    pub(crate) location_name: Option<String>,
    pub(crate) photo_url: Option<String>,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BulkAssignLocationResponse {
    pub(crate) updated_count: i64,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BulkStatusResponse {
    pub(crate) updated_count: i64,
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct SelfRegistrationSettingResponse {
    pub(crate) enabled: bool,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TeamResponse {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) member_count: i64,
    pub(crate) my_role: String,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TeamDetailResponse {
    pub(crate) id: i64,
    pub(crate) name: String,
    pub(crate) description: String,
    pub(crate) members: Vec<TeamMemberResponse>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TeamMemberResponse {
    pub(crate) user_id: i64,
    pub(crate) display_name: String,
    pub(crate) email: String,
    pub(crate) photo_url: Option<String>,
    pub(crate) role: String,
    pub(crate) joined_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TeamInvitationResponse {
    pub(crate) id: i64,
    pub(crate) team_id: i64,
    pub(crate) team_name: String,
    pub(crate) inviter_name: String,
    pub(crate) status: String,
    pub(crate) created_at: chrono::DateTime<chrono::Utc>,
}

#[allow(dead_code)]
#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserSearchResult {
    pub(crate) id: i64,
    pub(crate) display_name: String,
    pub(crate) email: String,
    pub(crate) photo_url: Option<String>,
}
