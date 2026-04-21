use serde::Deserialize;

use crate::models::StatusValue;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RegisterRequest {
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) email: String,
    pub(crate) password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct LoginRequest {
    pub(crate) email: String,
    pub(crate) password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateStatusRequest {
    pub(crate) status: StatusValue,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BulkStatusRequest {
    pub(crate) dates: Vec<String>,
    pub(crate) status: Option<StatusValue>,
    pub(crate) skip_weekends: bool,
    pub(crate) skip_public_holidays: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreateLocationRequest {
    pub(crate) name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateLocationRequest {
    pub(crate) name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreatePublicHolidayRequest {
    pub(crate) holiday_date: String,
    pub(crate) name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdatePublicHolidayRequest {
    pub(crate) holiday_date: String,
    pub(crate) name: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AddLocationToHolidayRequest {
    pub(crate) location_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct ChangePasswordRequest {
    pub(crate) current_password: String,
    pub(crate) new_password: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateProfileRequest {
    pub(crate) email: String,
    pub(crate) title: String,
    pub(crate) first_name: String,
    pub(crate) middle_name: String,
    pub(crate) last_name: String,
    pub(crate) location_id: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) default_team_id: Option<Option<i64>>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminCreateUserRequest {
    pub(crate) email: String,
    pub(crate) first_name: String,
    pub(crate) last_name: String,
    pub(crate) password: String,
    pub(crate) location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminUpdateUserRequest {
    pub(crate) email: String,
    pub(crate) title: Option<String>,
    pub(crate) first_name: String,
    pub(crate) middle_name: Option<String>,
    pub(crate) last_name: String,
    pub(crate) location_id: Option<i64>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub(crate) default_team_id: Option<Option<i64>>,
    pub(crate) password: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct BulkAssignLocationRequest {
    pub(crate) user_ids: Vec<i64>,
    pub(crate) location_id: i64,
}

#[derive(Debug, Deserialize)]
pub(crate) struct PublicHolidayQuery {
    pub(crate) location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
pub(crate) struct YearQuery {
    pub(crate) year: Option<i32>,
    pub(crate) team_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateSelfRegistrationRequest {
    pub(crate) enabled: bool,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateWorkScheduleRequest {
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
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreateTeamRequest {
    pub(crate) name: String,
    pub(crate) description: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateTeamRequest {
    pub(crate) name: String,
    pub(crate) description: Option<String>,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct InviteToTeamRequest {
    pub(crate) user_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminAssignUserRequest {
    pub(crate) user_id: i64,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdateMemberRoleRequest {
    pub(crate) role: String,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct TransferOwnershipRequest {
    pub(crate) new_owner_id: i64,
}

#[allow(dead_code)]
#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UserSearchQuery {
    pub(crate) q: Option<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct CreatePermissionProfileRequest {
    pub(crate) name: String,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdatePermissionProfileRequest {
    pub(crate) name: String,
    pub(crate) permissions: Vec<String>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AssignProfileRequest {
    pub(crate) profile_id: Option<i64>,
}
