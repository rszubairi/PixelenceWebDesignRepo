# Pixelence MRI System - System Design Document

## 1. System Overview

The Pixelence MRI System is a comprehensive web-based application designed for healthcare facilities to manage MRI imaging workflows. Built using Next.js 14 with React 18, TypeScript, and Tailwind CSS, the system provides role-based access control for different healthcare professionals involved in MRI procedures.

### 1.1 Architecture
- **Frontend Framework**: Next.js 14 (React-based)
- **Styling**: Tailwind CSS with Headless UI components
- **State Management**: React hooks (useState, useEffect)
- **Routing**: Next.js file-based routing
- **Authentication**: Mock implementation using localStorage (production would use secure cookies)
- **Data Storage**: Currently mock data (production would use database APIs)

### 1.2 Technology Stack
- **Runtime**: Node.js
- **Package Manager**: npm
- **Build Tool**: Next.js
- **UI Library**: Headless UI
- **Icons**: Heroicons (SVG-based)
- **Deployment**: Static export or server deployment

## 2. User Roles and Access Control

The system implements role-based access with five distinct user roles:

### 2.1 IT Administrator
- **Dashboard**: System health monitoring, user statistics, system status
- **Permissions**: User management, system settings, license management
- **Navigation**: Dashboard, Appointments, Reports, User Management, System Settings

### 2.2 Radiologist
- **Dashboard**: Analysis queue, completed reports, urgent cases, turnaround times
- **Permissions**: Image review, report generation, analysis approval
- **Navigation**: Dashboard, Appointments, Reports, Review Queue

### 2.3 Radiographer
- **Dashboard**: Active jobs, completed jobs, system health
- **Permissions**: DICOM image upload, appointment management
- **Navigation**: Dashboard, Appointments, Reports, Image Upload

### 2.4 Finance User
- **Dashboard**: Billing metrics, license management
- **Permissions**: Billing management, license oversight
- **Navigation**: Dashboard, Appointments, Reports, Billing, License Management

### 2.5 Doctor
- **Dashboard**: Patient appointments, reports
- **Permissions**: View appointments, access reports
- **Navigation**: Dashboard, Appointments, Reports, My Appointments

## 3. Application Views and Pages

### 3.1 Authentication
- **Login Page** (`/`): Email/password authentication with remember me option
- **Dashboard Redirect** (`/dashboard`): Automatic role-based redirection

### 3.2 Dashboard Pages
Each role has a customized dashboard displaying relevant metrics and recent activities:

#### IT Admin Dashboard
- System statistics (users, jobs, health)
- Recent jobs table
- Weekly job volume chart
- System component status (AI engine, database, file storage, notification service)

#### Radiologist Dashboard
- Analysis metrics (pending, completed, urgent cases, turnaround time)
- Recent jobs table
- Weekly analysis volume chart
- Recent reports feed

#### Radiographer Dashboard
- Job statistics (active, completed)
- Recent jobs table
- Weekly job volume chart

#### Finance User Dashboard
- Billing and license metrics
- Recent transactions/activities

#### Doctor Dashboard
- Appointment and patient metrics
- Recent appointments

### 3.3 Core Functional Pages

#### Appointments Management (`/appointments`)
- **List View**: Table of all patient appointments with filtering and search
- **Create Modal**: Form for scheduling new appointments
- **Details**: Patient information, complaint, referral details, scheduled time
- **Actions**: View details, upload DICOM files
- **Status Workflow**: Scheduled → DICOM Uploaded → Processing → Enhanced → Analysis Complete → Under Review → Approved → Completed

#### Reports Management (`/reports`)
- **List View**: Table of all medical reports with filtering
- **Report Details**: Analysis results, approval status, priority levels
- **Actions**: View report, view associated images
- **Status States**: Analysis Complete, Under Review, Approved

#### DICOM Image Upload (`/images/upload`)
- **Job Selection**: Link from appointment or manual entry
- **File Upload**: Multiple DICOM file selection (.dcm, .dicom)
- **Progress Tracking**: Real-time upload progress bar
- **Validation**: File type and size verification
- **Post-Upload**: Automatic processing initiation

#### Image Viewer (`/images/[jobId]`)
- **DICOM Viewer**: Multi-mode viewing (single, compare, grid)
- **Navigation**: Thumbnail strip, previous/next controls
- **Zoom/Pan**: Standard medical imaging controls
- **Annotation**: Basic markup tools

#### Report Viewer (`/reports/[id]`)
- **Structured Display**: Patient demographics, findings, conclusions
- **Image Integration**: Linked DICOM images
- **Approval Workflow**: Review and approval controls

### 3.4 Administrative Pages

#### User Management (`/settings/users`)
- User CRUD operations
- Role assignment
- Account status management

#### System Settings (`/settings/system`)
- System configuration
- Integration settings
- Performance monitoring

#### License Management (`/settings/license`)
- License key management
- Usage tracking
- Renewal workflows

#### Billing Management (`/billing`)
- Invoice generation
- Payment tracking
- Financial reporting

## 4. Component Architecture

### 4.1 Layout Components

#### Layout (`components/layout/Layout.js`)
- Main application shell
- Sidebar + Header + Main content structure
- Responsive design with mobile considerations

#### Sidebar (`components/layout/Sidebar.js`)
- Role-based navigation menu
- Active state highlighting
- Icon-based navigation items

#### Header (`components/layout/Header.js`)
- User profile display
- Logout functionality
- Global notifications

### 4.2 Dashboard Components

#### StatsCard (`components/dashboard/StatsCard.js`)
- Metric display with icons
- Color-coded variants (purple, blue, green, yellow)
- Responsive grid layout

#### RecentJobs (`components/dashboard/RecentJobs.js`)
- Job status table
- Quick action buttons
- Status badges

#### Chart (`components/dashboard/Chart.js`)
- Weekly activity visualization
- Bar chart implementation
- Customizable data input

### 4.3 Imaging Components

#### DicomViewer (`components/imaging/DicomViewer.js`)
- Multi-view modes (single, compare, grid)
- Thumbnail navigation
- Image controls (zoom, pan, windowing)

#### ReportViewer (`components/imaging/ReportViewer.js`)
- Structured report display
- Image-report integration
- Annotation support

### 4.4 UI Components

#### Button (`components/ui/Button.js`)
- Multiple variants (primary, secondary, danger)
- Size options (sm, md, lg)
- Disabled state handling

#### Table (`components/ui/Table.js`)
- Sortable columns
- Custom cell rendering
- Pagination support

#### Modal (`components/ui/Modal.js`)
- Overlay dialogs
- Form integration
- Close handlers

#### Form (`components/ui/Form.js`)
- Dynamic field generation
- Validation states
- Submit handling

#### Card (`components/ui/Card.js`)
- Content containers
- Shadow variants
- Flexible layouts

#### Notification (`components/ui/Notification.js`)
- Toast notifications
- Status-based styling
- Auto-dismiss functionality

## 5. Data Flow and State Management

### 5.1 Authentication Flow
1. User submits credentials on login page
2. Mock validation (production: API call)
3. User data stored in localStorage with role information
4. Automatic redirect to role-specific dashboard
5. Layout components receive user context for role-based rendering

### 5.2 Appointment Workflow
1. **Creation**: Doctor/Radiographer creates appointment with patient details
2. **Scheduling**: Date/time assignment
3. **DICOM Upload**: Radiographer uploads imaging files
4. **Processing**: System processes images (mock in current implementation)
5. **Analysis**: Radiologist reviews and analyzes images
6. **Report Generation**: Automated or manual report creation
7. **Review/Approval**: Multi-level approval workflow
8. **Completion**: Final status update

### 5.3 Image Processing Pipeline
1. **Upload**: Multiple DICOM files accepted
2. **Validation**: File type and integrity checks
3. **Storage**: Secure file storage (mock implementation)
4. **Processing**: AI enhancement algorithms (referenced but not implemented)
5. **Analysis Ready**: Images prepared for radiologist review

## 6. UI/UX Design Patterns

### 6.1 Color Scheme
- **Primary**: Purple (#7C3AED) for actions and branding
- **Secondary**: Gray variations for backgrounds and text
- **Status Colors**: Green (success), Yellow (warning), Red (danger), Blue (info)

### 6.2 Layout Patterns
- **Sidebar Navigation**: Fixed left sidebar with collapsible mobile menu
- **Card-based Layout**: White cards with shadows for content sections
- **Grid Systems**: Responsive grids (1-4 columns based on screen size)
- **Spacing**: Consistent 4px/8px/16px/24px spacing scale

### 6.3 Component Patterns
- **Icon + Text**: Consistent icon-text combinations for buttons and navigation
- **Status Badges**: Colored badges for workflow states
- **Action Buttons**: Primary/secondary button variants for different actions
- **Form Fields**: Consistent input styling with focus states

### 6.4 Responsive Design
- **Mobile First**: Designed for mobile, enhanced for desktop
- **Breakpoint System**: sm/md/lg breakpoints for responsive adjustments
- **Flexible Grids**: Auto-adjusting column layouts
- **Touch Friendly**: Adequate button sizes and spacing for touch interfaces

## 7. Security and Compliance

### 7.1 Authentication
- Email/password login (mock implementation)
- Role-based access control
- Session management via localStorage (production: secure HTTP-only cookies)

### 7.2 Data Privacy
- Patient information handling (HIPAA considerations)
- Secure file upload and storage
- Audit logging for sensitive operations

### 7.3 Access Control
- Role-based navigation and feature access
- Data filtering based on user permissions
- Secure API endpoints (planned for production)

## 8. Future Enhancements

### 8.1 Technical Improvements
- Real API integration
- Database implementation
- Real-time notifications
- Advanced DICOM processing
- AI-powered analysis tools

### 8.2 Feature Additions
- Advanced reporting and analytics
- Integration with PACS systems
- Mobile application
- Multi-facility support
- Advanced user management

### 8.3 Performance Optimizations
- Image lazy loading
- Caching strategies
- CDN integration
- Database query optimization

This system design document provides a comprehensive overview of the Pixelence MRI System's architecture, functionality, and design patterns. The current implementation serves as a functional prototype with mock data, ready for backend integration and production deployment.
