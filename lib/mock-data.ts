export type IssueCategory =
  | "pothole"
  | "streetlight"
  | "sanitation"
  | "water"
  | "traffic"
  | "vandalism"
  | "other"

export type IssueStatus = "submitted" | "in-review" | "dispatched" | "resolved"

export type IssuePriority = "low" | "medium" | "high" | "critical"

export type StaffStatus = "available" | "busy" | "off-duty" | "on-leave"

export type LeaveRequestStatus = "pending" | "approved" | "rejected"

export interface LeaveRequest {
  id: string
  staffId: string
  staffName: string
  employeeId: string
  startDate: string
  endDate: string
  reason: string
  status: LeaveRequestStatus
  createdAt: string
  reviewedAt?: string
}

export interface IssueUpdate {
  id: string
  issueId: string
  staffId: string
  staffName: string
  message: string
  imageUrl?: string
  createdAt: string
}

export interface Staff {
  id: string
  name: string
  phone: string
  employeeId: string
  department: string
  status: StaffStatus
  activeIssues: number
  resolvedCount: number
  avatarInitials: string
}

export interface Issue {
  id: string
  title: string
  description: string
  category: IssueCategory
  status: IssueStatus
  priority: IssuePriority
  location: string
  lat: number
  lng: number
  reportedBy: string
  reportedAt: string
  updatedAt: string
  department: string
  imageUrl?: string
  upvotes: number
  assignedStaff?: Staff
  resolvedImageUrl?: string
}

export const categoryLabels: Record<IssueCategory, string> = {
  pothole: "Pothole",
  streetlight: "Streetlight",
  sanitation: "Sanitation",
  water: "Water & Drainage",
  traffic: "Traffic Signal",
  vandalism: "Vandalism",
  other: "Other",
}

export const statusLabels: Record<IssueStatus, string> = {
  submitted: "Submitted",
  "in-review": "In Review",
  dispatched: "Dispatched",
  resolved: "Resolved",
}

export const priorityLabels: Record<IssuePriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
}

export const departmentMap: Record<IssueCategory, string> = {
  pothole: "Roads & Infrastructure",
  streetlight: "Electrical Department",
  sanitation: "Sanitation & Waste",
  water: "Water & Drainage",
  traffic: "Traffic Management",
  vandalism: "Public Safety",
  other: "General Services",
}

export const departments = [
  "Roads & Infrastructure",
  "Electrical Department",
  "Sanitation & Waste",
  "Water & Drainage",
  "Traffic Management",
  "Public Safety",
  "General Services",
]

export const staffStatusLabels: Record<StaffStatus, string> = {
  available: "Available",
  busy: "Busy",
  "off-duty": "Off Duty",
  "on-leave": "On Leave",
}

export const mockStaff: Staff[] = [
  {
    id: "STF-001",
    name: "Rajesh Kumar",
    phone: "+91 98765 43210",
    employeeId: "EMP-1001",
    department: "Roads & Infrastructure",
    status: "busy",
    activeIssues: 2,
    resolvedCount: 45,
    avatarInitials: "RK",
  },
  {
    id: "STF-002",
    name: "Priya Sharma",
    phone: "+91 98765 43211",
    employeeId: "EMP-1002",
    department: "Sanitation & Waste",
    status: "available",
    activeIssues: 0,
    resolvedCount: 62,
    avatarInitials: "PS",
  },
  {
    id: "STF-003",
    name: "Ankit Verma",
    phone: "+91 98765 43212",
    employeeId: "EMP-1003",
    department: "Electrical Department",
    status: "busy",
    activeIssues: 1,
    resolvedCount: 33,
    avatarInitials: "AV",
  },
  {
    id: "STF-004",
    name: "Deepa Nair",
    phone: "+91 98765 43213",
    employeeId: "EMP-1004",
    department: "Water & Drainage",
    status: "available",
    activeIssues: 0,
    resolvedCount: 28,
    avatarInitials: "DN",
  },
  {
    id: "STF-005",
    name: "Suresh Patel",
    phone: "+91 98765 43214",
    employeeId: "EMP-1005",
    department: "Traffic Management",
    status: "off-duty",
    activeIssues: 0,
    resolvedCount: 51,
    avatarInitials: "SP",
  },
  {
    id: "STF-006",
    name: "Meera Reddy",
    phone: "+91 98765 43215",
    employeeId: "EMP-1006",
    department: "Sanitation & Waste",
    status: "busy",
    activeIssues: 3,
    resolvedCount: 70,
    avatarInitials: "MR",
  },
  {
    id: "STF-007",
    name: "Vikram Singh",
    phone: "+91 98765 43216",
    employeeId: "EMP-1007",
    department: "Public Safety",
    status: "available",
    activeIssues: 0,
    resolvedCount: 19,
    avatarInitials: "VS",
  },
  {
    id: "STF-008",
    name: "Kavitha Iyer",
    phone: "+91 98765 43217",
    employeeId: "EMP-1008",
    department: "Roads & Infrastructure",
    status: "available",
    activeIssues: 0,
    resolvedCount: 37,
    avatarInitials: "KI",
  },
]

export const mockIssues: Issue[] = [
  {
    id: "ISS-001",
    title: "Large pothole on Main Street",
    description: "A large pothole has formed near the intersection of Main St and 3rd Ave. It's causing damage to vehicles passing through.",
    category: "pothole",
    status: "dispatched",
    priority: "high",
    location: "Main St & 3rd Ave",
    lat: 40.7128,
    lng: -74.006,
    reportedBy: "Sarah Chen",
    reportedAt: "2026-02-28T10:30:00Z",
    updatedAt: "2026-03-02T14:20:00Z",
    department: "Roads & Infrastructure",
    upvotes: 24,
    assignedStaff: {
      id: "STF-001",
      name: "Rajesh Kumar",
      phone: "+91 98765 43210",
      employeeId: "EMP-1001",
      department: "Roads & Infrastructure",
      status: "busy",
      activeIssues: 2,
      resolvedCount: 45,
      avatarInitials: "RK",
    },
  },
  {
    id: "ISS-002",
    title: "Broken streetlight on Oak Avenue",
    description: "The streetlight at 145 Oak Avenue has been flickering for a week and has now stopped working completely. The area is very dark at night.",
    category: "streetlight",
    status: "in-review",
    priority: "medium",
    location: "145 Oak Avenue",
    lat: 40.7148,
    lng: -74.008,
    reportedBy: "Marcus Johnson",
    reportedAt: "2026-03-01T08:15:00Z",
    updatedAt: "2026-03-02T09:00:00Z",
    department: "Electrical Department",
    upvotes: 12,
  },
  {
    id: "ISS-003",
    title: "Overflowing garbage bin at Central Park",
    description: "The public garbage bin near the Central Park entrance on Elm Street has been overflowing for three days. Trash is scattered on the ground.",
    category: "sanitation",
    status: "resolved",
    priority: "medium",
    location: "Central Park, Elm St Entrance",
    lat: 40.7168,
    lng: -74.004,
    reportedBy: "Aisha Patel",
    reportedAt: "2026-02-25T16:45:00Z",
    updatedAt: "2026-02-27T11:30:00Z",
    department: "Sanitation & Waste",
    upvotes: 38,
    assignedStaff: {
      id: "STF-002",
      name: "Priya Sharma",
      phone: "+91 98765 43211",
      employeeId: "EMP-1002",
      department: "Sanitation & Waste",
      status: "available",
      activeIssues: 0,
      resolvedCount: 62,
      avatarInitials: "PS",
    },
    resolvedImageUrl: "/placeholder-resolved.jpg",
  },
  {
    id: "ISS-004",
    title: "Water main leak on Riverside Drive",
    description: "Water is leaking from a pipe under the road on Riverside Drive near house number 78. The water is pooling on the street.",
    category: "water",
    status: "dispatched",
    priority: "critical",
    location: "78 Riverside Drive",
    lat: 40.7188,
    lng: -74.002,
    reportedBy: "David Kim",
    reportedAt: "2026-03-02T07:00:00Z",
    updatedAt: "2026-03-02T08:30:00Z",
    department: "Water & Drainage",
    upvotes: 45,
    assignedStaff: {
      id: "STF-004",
      name: "Deepa Nair",
      phone: "+91 98765 43213",
      employeeId: "EMP-1004",
      department: "Water & Drainage",
      status: "busy",
      activeIssues: 1,
      resolvedCount: 28,
      avatarInitials: "DN",
    },
  },
  {
    id: "ISS-005",
    title: "Damaged traffic signal at Broadway",
    description: "The traffic signal at the Broadway and Pine intersection is stuck on red in all directions, causing traffic jams during rush hour.",
    category: "traffic",
    status: "submitted",
    priority: "high",
    location: "Broadway & Pine St",
    lat: 40.7108,
    lng: -74.01,
    reportedBy: "Emily Rodriguez",
    reportedAt: "2026-03-03T06:30:00Z",
    updatedAt: "2026-03-03T06:30:00Z",
    department: "Traffic Management",
    upvotes: 67,
  },
  {
    id: "ISS-006",
    title: "Graffiti on public library wall",
    description: "Extensive graffiti has been sprayed on the south wall of the public library on Cedar Street.",
    category: "vandalism",
    status: "in-review",
    priority: "low",
    location: "Cedar St Public Library",
    lat: 40.7138,
    lng: -74.0055,
    reportedBy: "Thomas Wright",
    reportedAt: "2026-03-01T14:00:00Z",
    updatedAt: "2026-03-02T10:00:00Z",
    department: "Public Safety",
    upvotes: 8,
  },
  {
    id: "ISS-007",
    title: "Collapsed sidewalk near school zone",
    description: "A section of the sidewalk near Jefferson Elementary School has collapsed, creating a dangerous drop-off for pedestrians, especially children.",
    category: "pothole",
    status: "dispatched",
    priority: "critical",
    location: "Jefferson Elementary, Park Rd",
    lat: 40.7158,
    lng: -74.0075,
    reportedBy: "Linda Park",
    reportedAt: "2026-02-27T09:00:00Z",
    updatedAt: "2026-03-01T16:00:00Z",
    department: "Roads & Infrastructure",
    upvotes: 89,
    assignedStaff: {
      id: "STF-008",
      name: "Kavitha Iyer",
      phone: "+91 98765 43217",
      employeeId: "EMP-1008",
      department: "Roads & Infrastructure",
      status: "busy",
      activeIssues: 1,
      resolvedCount: 37,
      avatarInitials: "KI",
    },
  },
  {
    id: "ISS-008",
    title: "Blocked storm drain on Hill Street",
    description: "The storm drain on Hill Street is blocked with debris, causing flooding every time it rains.",
    category: "water",
    status: "submitted",
    priority: "high",
    location: "Hill Street, Block 4",
    lat: 40.7118,
    lng: -74.009,
    reportedBy: "James Okafor",
    reportedAt: "2026-03-02T18:00:00Z",
    updatedAt: "2026-03-02T18:00:00Z",
    department: "Water & Drainage",
    upvotes: 15,
  },
]

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "LR-001",
    staffId: "STF-005",
    staffName: "Suresh Patel",
    employeeId: "EMP-1005",
    startDate: "2026-03-10",
    endDate: "2026-03-12",
    reason: "Family function - brother's wedding in hometown",
    status: "pending",
    createdAt: "2026-03-02T10:00:00Z",
  },
  {
    id: "LR-002",
    staffId: "STF-002",
    staffName: "Priya Sharma",
    employeeId: "EMP-1002",
    startDate: "2026-02-20",
    endDate: "2026-02-21",
    reason: "Medical appointment and follow-up",
    status: "approved",
    createdAt: "2026-02-18T09:00:00Z",
    reviewedAt: "2026-02-18T14:00:00Z",
  },
  {
    id: "LR-003",
    staffId: "STF-003",
    staffName: "Ankit Verma",
    employeeId: "EMP-1003",
    startDate: "2026-03-15",
    endDate: "2026-03-20",
    reason: "Annual vacation - planned trip",
    status: "pending",
    createdAt: "2026-03-01T11:30:00Z",
  },
  {
    id: "LR-004",
    staffId: "STF-006",
    staffName: "Meera Reddy",
    employeeId: "EMP-1006",
    startDate: "2026-02-10",
    endDate: "2026-02-10",
    reason: "Personal errand",
    status: "rejected",
    createdAt: "2026-02-08T16:00:00Z",
    reviewedAt: "2026-02-09T09:00:00Z",
  },
]

export const mockIssueUpdates: IssueUpdate[] = [
  {
    id: "UPD-001",
    issueId: "ISS-001",
    staffId: "STF-001",
    staffName: "Rajesh Kumar",
    message: "Reached the site. Pothole is approximately 2ft wide. Starting repair work.",
    createdAt: "2026-03-02T15:00:00Z",
  },
  {
    id: "UPD-002",
    issueId: "ISS-004",
    staffId: "STF-004",
    staffName: "Deepa Nair",
    message: "Water main isolated. Repair crew arriving with replacement pipe section.",
    createdAt: "2026-03-02T09:30:00Z",
  },
  {
    id: "UPD-003",
    issueId: "ISS-007",
    staffId: "STF-008",
    staffName: "Kavitha Iyer",
    message: "Area has been cordoned off for safety. Waiting for concrete mix delivery.",
    createdAt: "2026-03-01T17:00:00Z",
  },
]

export const mockNotifications = [
  {
    id: "n1",
    issueId: "ISS-001",
    message: "Staff member Rajesh Kumar has been dispatched to fix the pothole on Main Street.",
    type: "dispatched" as const,
    read: false,
    createdAt: "2026-03-02T14:20:00Z",
  },
  {
    id: "n2",
    issueId: "ISS-003",
    message: "The overflowing garbage bin at Central Park has been resolved by Priya Sharma.",
    type: "resolved" as const,
    read: false,
    createdAt: "2026-02-27T11:30:00Z",
  },
  {
    id: "n3",
    issueId: "ISS-002",
    message: "Your report about the broken streetlight is now under review.",
    type: "in-review" as const,
    read: true,
    createdAt: "2026-03-02T09:00:00Z",
  },
  {
    id: "n4",
    issueId: "ISS-004",
    message: "Staff member Deepa Nair has been assigned to the water main leak on Riverside Drive.",
    type: "dispatched" as const,
    read: false,
    createdAt: "2026-03-02T08:30:00Z",
  },
]
