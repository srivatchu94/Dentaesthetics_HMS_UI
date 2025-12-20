# Analytics API Integration Summary

## Overview
The Analytics dashboard has been integrated with the Dentaesthetics API to fetch real revenue, clinic performance, and user statistics data.

## API Endpoints Added

### 1. Revenue Analytics
**Endpoint**: `/analytics/revenue`
**Method**: GET
**Parameters**:
- `enterpriseId` (required): Enterprise ID
- `clinicId` (optional): Clinic ID (null if not selected)
- `periodLabel` (optional): Time period (daily, weekly, monthly, quarterly, yearly, custom)
- `startDate` (optional): Start date for custom range (YYYY-MM-DD)
- `endDate` (optional): End date for custom range (YYYY-MM-DD)

**Response**: `RevenueAnalyticsModel[]`

### 2. Clinic Performance
**Endpoint**: `/analytics/clinic-performance`
**Method**: GET
**Parameters**:
- `enterpriseId` (required): Enterprise ID
- `clinicId` (optional): Clinic ID (null if not selected)
- `periodLabel` (optional): Time period
- `startDate` (optional): Start date for custom range
- `endDate` (optional): End date for custom range

**Response**: `ClinicPerformanceModel[]`

### 3. User Statistics
**Endpoint**: `/analytics/users`
**Method**: GET
**Parameters**:
- `clinicId` (optional): Clinic ID (can be null)
- `periodLabel` (optional): Time period
- `startDate` (optional): Start date for custom range
- `endDate` (optional): End date for custom range

**Response**: `UserStatisticsModel[]`

## Implementation Details

### AnalyticsDashboard Component
- **Mandatory Fields**: Enterprise ID
- **Optional Fields**: Clinic ID
- **Displays**: 
  - Total Patients (from totalAppointments)
  - Total Appointments (from totalAppointments)
  - Revenue (from totalRevenue)
  - Satisfaction (fixed at 94%)
- **Chart**: Vibrant bar chart with real revenue data per period
- **Patient Flow**: Innovative animated visualization

### ClinicPerformance Component
- **Mandatory Fields**: Enterprise ID
- **Optional Fields**: Clinic ID
- **Displays**:
  - Individual clinic performance cards
  - Performance score (calculated from averageRevenuePerAppointment)
  - Revenue, Patients, and Satisfaction metrics
  - Comparative analysis chart

### UserStatistics Component
- **Mandatory Fields**: None (but recommends Clinic ID or Enterprise ID)
- **Optional Fields**: Clinic ID
- **Displays**:
  - New Users vs Returning Users
  - Retention Rate
  - Donut chart showing user distribution
  - Time series chart of user growth

## Parameter Passing

### From Analytics Main Page
```javascript
const params = {
  enterpriseId,           // User selected value
  clinicId: clinicId || null,  // null if not selected
  periodLabel,            // "daily", "weekly", "monthly", "quarterly", "yearly", "custom"
  startDate,             // Included only if custom range with start date
  endDate,               // Included only if custom range with end date
};
```

### Date Validation
- End date cannot be before start date
- Validation occurs in real-time as user selects dates
- Error message displays if invalid
- Users are prevented from proceeding with invalid date ranges

## Error Handling
- API errors are caught and displayed to the user
- Fallback to mock data for demonstration if API fails
- Error messages shown in red alert boxes
- Loading states displayed while fetching data
- Empty state messages when no data is available

## Features
✅ Enterprise selection (mandatory)
✅ Clinic selection (optional - sends null if not selected)
✅ Multiple time period options (daily, weekly, monthly, quarterly, yearly)
✅ Custom date range with validation
✅ Real-time API integration
✅ Error handling and fallback
✅ Responsive UI with animations
✅ Data-driven visualizations

## Usage
1. Select an **Enterprise** from the dropdown
2. (Optional) Select a **Clinic**
3. Select a **Time Period**
   - If "Custom Range" is selected, provide start and end dates
   - Validation ensures end date ≥ start date
4. View analytics across three tabs:
   - **Analytics Dashboard**: Revenue and patient flow
   - **Clinic Performance**: Clinic-wise performance metrics
   - **User Statistics**: New vs returning users and retention rates
