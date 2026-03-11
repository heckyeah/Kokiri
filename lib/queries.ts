/** Latest active alert only (by createdAt desc) – users see and respond to this one */
export const ACTIVE_ALERT_QUERY = `*[_type == "alert" && status == "active"] | order(createdAt desc)[0]{
  _id,
  title,
  subtitle,
  createdAt,
  "createdBy": createdBy->{ _id, fullName }
}`;

export const MEMBER_BY_EMAIL_QUERY = `*[_type == "member" && email == $email][0]{
  _id,
  fullName,
  email,
  phone,
  address,
  medicalConditions,
  passwordHash,
  role,
  lastKnownLat,
  lastKnownLng
}`;

export const MEMBER_BY_ID_QUERY = `*[_type == "member" && _id == $id][0]{
  _id,
  fullName,
  email,
  phone,
  address,
  medicalConditions,
  role,
  lastKnownLat,
  lastKnownLng
}`;

export const MEMBER_BY_ID_NO_PASSWORD_QUERY = `*[_type == "member" && _id == $id][0]{
  _id,
  fullName,
  email,
  phone,
  address,
  medicalConditions,
  role,
  lastKnownLat,
  lastKnownLng
}`;

export const NEED_HELP_RESPONSES_QUERY = `*[_type == "alertResponse" && alert->status == "active" && status == "need_help" && defined(lat) && defined(lng)]{
  _id,
  lat,
  lng,
  "member": member->{ _id, fullName, phone, address, medicalConditions }
}`;

export const NEED_HELP_RESPONSES_FOR_ALERT_QUERY = `*[_type == "alertResponse" && (alert._ref == $alertId || alert._ref == ("drafts." + $alertId)) && status == "need_help"]{
  _id,
  lat,
  lng,
  "member": member->{ _id, fullName, phone, address, medicalConditions }
}`;

export const ALERT_BY_ID_QUERY = `*[_type == "alert" && (_id == $alertId || _id == ("drafts." + $alertId))][0]{
  _id,
  title,
  subtitle,
  createdAt
}`;

export const LATEST_ALERT_QUERY = `*[_type == "alert"] | order(createdAt desc)[0]{
  _id,
  title,
  subtitle,
  status,
  createdAt
}`;

export const ALL_ALERTS_QUERY = `*[_type == "alert"] | order(createdAt desc){
  _id,
  title,
  subtitle,
  status,
  createdAt
}`;

/** All alerts with response counts for dashboard */
export const ALL_ALERTS_WITH_COUNTS_QUERY = `*[_type == "alert" && !(string::startsWith(_id, "drafts."))] | order(createdAt desc){
  _id,
  title,
  subtitle,
  status,
  createdAt,
  "needHelpCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "need_help"]),
  "safeCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "safe"]),
  "unconfirmedCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && (status == "unconfirmed" || !defined(status))])
}`;

/** Active (non-archived) alerts only */
export const ACTIVE_ALERTS_WITH_COUNTS_QUERY = `*[_type == "alert" && !(string::startsWith(_id, "drafts.")) && status != "closed"] | order(createdAt desc){
  _id,
  title,
  subtitle,
  status,
  createdAt,
  "needHelpCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "need_help"]),
  "safeCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "safe"]),
  "unconfirmedCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && (status == "unconfirmed" || !defined(status))])
}`;

/** Archived (closed) alerts only */
export const ARCHIVED_ALERTS_WITH_COUNTS_QUERY = `*[_type == "alert" && !(string::startsWith(_id, "drafts.")) && status == "closed"] | order(createdAt desc){
  _id,
  title,
  subtitle,
  status,
  createdAt,
  "needHelpCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "need_help"]),
  "safeCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "safe"]),
  "unconfirmedCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && (status == "unconfirmed" || !defined(status))])
}`;

/** Total members (excluding drafts) */
export const MEMBERS_COUNT_QUERY = `count(*[_type == "member" && !(string::startsWith(_id, "drafts."))])`;

/** For the latest active alert: counts by status. Returns single doc or null. */
export const ACTIVE_ALERT_STATS_QUERY = `*[_type == "alert" && status == "active"] | order(createdAt desc)[0]{
  _id,
  title,
  "needHelpCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "need_help"]),
  "safeCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && status == "safe"]),
  "unconfirmedCount": count(*[_type == "alertResponse" && (alert._ref == ^._id || alert._ref == ("drafts." + ^._id)) && (status == "unconfirmed" || !defined(status))])
}`;

export const ALL_MEMBERS_WITH_ALL_RESPONSES_QUERY = `*[_type == "member" && !(string::startsWith(_id, "drafts."))] | order(fullName asc){
  _id,
  fullName,
  email,
  phone,
  address,
  medicalConditions,
  lastKnownLat,
  lastKnownLng,
  "responses": *[_type == "alertResponse" && (member._ref == ^._id || member._ref == ("drafts." + ^._id))]{
    _id,
    status,
    adminMarkedSafe,
    "markedSafeBy": markedSafeBy->fullName,
    respondedAt,
    "memberRef": member._ref,
    "alertId": alert._ref,
    "alert": alert->{ _id, title, createdAt },
    "statusChanges": *[_type == "statusChange" && member._ref == ^.memberRef && (alert._ref == ^.alertId || alert._ref == ("drafts." + ^.alertId))] | order(changedAt desc){
      status,
      changedAt,
      "changedBy": changedBy->fullName
    }
  }
}`;

export const ALL_MEMBERS_WITH_LATEST_RESPONSE_QUERY = `*[_type == "member" && !(string::startsWith(_id, "drafts."))] | order(fullName asc){
  _id,
  fullName,
  email,
  phone,
  address,
  medicalConditions,
  lastKnownLat,
  lastKnownLng,
  "latestResponse": *[_type == "alertResponse" && member._ref == ^._id] | order(respondedAt desc)[0]{
    _id,
    status,
    adminMarkedSafe,
    respondedAt,
    "alert": alert->{ _id, title, createdAt }
  }
}`;

export const MEMBER_RESPONSE_FOR_ALERT_QUERY = `*[_type == "alertResponse" && member._ref == $memberId && alert._ref == $alertId][0]{
  _id,
  status,
  adminMarkedSafe,
  respondedAt
}`;
