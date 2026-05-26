# Redesign Doctor System Interface to Match Admin Interface

This plan outlines the steps to align the user interface of the Doctor's system components (`ManagePatient.js` and `ManageScheduleForDoctor.js`) with the modern, aesthetically pleasing design of the Admin's `ManageBooking.js` component.

## Goal Description
The objective is to refactor the UI of the doctor's dashboard. Currently, the doctor's patient and schedule management screens use a basic table layout. We will upgrade these components to use the premium styling, statistics cards, advanced filtering (search and status tabs), and enhanced table designs introduced in the Admin's `ManageBooking` screen.

## Proposed Changes

### 1. Doctor Patient Management (`ManagePatient.js` & `.scss`)

We will update `ManagePatient.js` to incorporate the following UI elements:
- **Header**: Include a FontAwesome icon (`fa-user-injured`) alongside the title.
- **Statistics Cards**: Display "Tổng cộng", "Chờ xác nhận", "Đã xác nhận", "Hoàn thành", "Đã hủy" cards just like in Admin view.
- **Filters Section**: 
  - Add a "Clear date" button.
  - Add a Search input to filter patients by name.
  - Add Status filter buttons (All, Pending, Confirmed, Completed, Cancelled).
- **Table Redesign**: Use the `.bookings-table-container` styling. Implement `getStatusBadge` and `getActionButtons` methods to render rich badges and buttons instead of plain text/buttons.

#### [MODIFY] [ManagePatient.js](file:///c:/Users/DNS/Downloads/Fullstack/Reactjs/src/containers/System/Doctor/ManagePatient.js)
#### [MODIFY] [ManagePatient.scss](file:///c:/Users/DNS/Downloads/Fullstack/Reactjs/src/containers/System/Doctor/ManagePatient.scss)

### 2. Doctor Schedule Management (`ManageScheduleForDoctor.js` & `.scss`)

We will update `ManageScheduleForDoctor.js` to mirror the premium styling:
- **Header**: Add a calendar icon and modern title.
- **Table Redesign**: Replace the default Bootstrap table classes with the custom, styled table from the admin theme.
- **Filter Section**: Make the date picker filter look cleaner and align with the `booking-filters` style.

#### [MODIFY] [ManageScheduleForDoctor.js](file:///c:/Users/DNS/Downloads/Fullstack/Reactjs/src/containers/System/Doctor/ManageScheduleForDoctor.js)
#### [MODIFY] [ManageScheduleForDoctor.scss](file:///c:/Users/DNS/Downloads/Fullstack/Reactjs/src/containers/System/Doctor/ManageScheduleForDoctor.scss)

## User Review Required

> [!IMPORTANT]
> The updated design will rely on the existing status workflow (S1 -> S2 -> S3/S4). Please confirm if you want the Doctor to be able to manually update all these statuses, or if the logic for "Confirm" (Khám xong) and "Cancel" (Hủy) should remain exactly as it is, just with updated visuals. 

## Verification Plan

### Automated Tests
- Build and run the React application locally using `npm start`.

### Manual Verification
- Log in as a Doctor.
- Navigate to "Quản lý lịch hẹn khám bệnh của doctor" (Manage Patient). Verify the new Stats cards, search filter, and status tabs work correctly.
- Navigate to "Quản lý kế hoạch khám bệnh của doctor" (Manage Schedule). Verify the styling is consistent with the admin interface.
