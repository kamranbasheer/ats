# ATS Tracker

A private, browser-based application tracking system for job hunters. Track every application, stage, rejection reason, CV version, and hiring funnel performance in one place.

## Features

* **Application Management**: Add, edit, and delete job applications with full details (company, position, date, salary range, notes)
* **Status Tracking**: Monitor applications through multiple statuses (Applied, In Progress, Offer, Rejected, Withdrawn)
* **Interview Stage Tracking**: Record which stage each application is at (screening, HR interview, hiring manager, case study, final interview)
* **CV Performance**: Track which CV version was used for each application to identify which works best
* **Rejection Analysis**: Log rejection stage and reason to understand where you're losing opportunities
* **Analytics Dashboard**: View KPIs including total applications, active pipeline, response rate, offer rate, and rejection breakdown
* **Monthly Trends**: Visualize application volume over the last 6 months
* **Search & Filter**: Find applications by company/role, filter by status or CV version
* **Data Security**: Password-protected access with browser-based authentication
* **Data Portability**: Export your data as JSON or import from a previous backup

## Getting Started

1. Open `index.html` in a web browser
2. On first visit, create a login with email and password
3. Load sample data or start adding your own applications
4. Use the form at the top to add a new application
5. View analytics and search through your applications table

## Data Storage

All data is stored locally in your browser's localStorage. No data is sent to any server. Your login credentials are hashed using SHA-256 before storage.

To back up your data, use the "Export JSON" button to download a JSON file. Keep this file safe. You can restore from a backup using the "Import JSON" button.

To clear all data permanently, click "Clear All Data" in the applications table.

## How to Use

**Add an Application**
1. Fill in the company name and position
2. Enter the application date
3. Select current status and interview stage
4. Choose which CV version you used
5. Add source (LinkedIn, referral, etc) and optional salary range
6. Add any notes about the role or your interview experience
7. If rejected, fill in rejection stage and reason
8. Click "Save Application"

**Edit an Application**
1. Click "Edit" on any application row
2. The form pre-fills with existing data
3. Make changes and click "Save Application"

**Filter and Search**
1. Use the search bar to find by company or role name
2. Filter by status using the Status dropdown
3. Filter by CV version using the CV dropdown

**View Analytics**
1. See KPI cards with totals and key metrics
2. View rejections by stage to identify bottlenecks
3. See which CV version gets the most usage
4. Check the 6-month trend to track your application pace

## Browser Compatibility

Works on all modern browsers that support:
* localStorage (data persistence)
* crypto.subtle.digest (password hashing)
* ES6+ JavaScript

## Files

* `index.html` - Main application structure
* `app.js` - Application logic, state management, and rendering
* `styles.css` - Layout, components, and responsive design

## Notes

This is a personal productivity tool designed to be self-hosted in your browser. All data remains on your device. To share data between devices, export JSON and import on the other device.
