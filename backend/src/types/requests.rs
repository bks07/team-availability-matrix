use serde::Deserialize;

use crate::models::StatusValue;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct RegisterRequest {
    pub(crate) display_name: String,
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
    pub(crate) location_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdatePublicHolidayRequest {
    pub(crate) holiday_date: String,
    pub(crate) name: String,
    pub(crate) location_id: i64,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct UpdatePermissionsRequest {
    pub(crate) permissions: Vec<String>,
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
    pub(crate) display_name: String,
    pub(crate) location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminCreateUserRequest {
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) password: String,
    pub(crate) location_id: Option<i64>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub(crate) struct AdminUpdateUserRequest {
    pub(crate) email: String,
    pub(crate) display_name: String,
    pub(crate) location_id: Option<i64>,
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
