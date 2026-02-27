// API 클라이언트 설정
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3012/backend/api/v1';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    user: {
      id: string;
      email: string;
      name: string;
      role: string;
      institutionId: string | null;
    };
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  institutionId: string | null;
}

export interface Institution {
  id: string;
  businessRegistrationNumber: string;
  name: string;
  address: string;
  contact: string;
  latitude: number;
  longitude: number;
  status?: string;
  institutionTypeId?: string;
  rejectionReason?: string;
  suspensionReason?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Vehicle {
  id: string;
  licensePlate: string;
  capacity: number;
  model: string;
}

export interface OptimizeRouteRequest {
  institutionId: string;
  vehicleId: string;
  routeDate: string;
  shuttleType: 'MORNING' | 'EVENING' | 'TEMPORARY';
  averageSpeed?: number;
}

export interface Waypoint {
  passengerId: string;
  sequence: number;
  coordinates: {
    lat: number;
    lng: number;
  };
  address: string;
  eta?: string;
}

export interface Route {
  id: string;
  institutionId: string;
  vehicleId: string;
  routeDate: string;
  shuttleType: string;
  optimizedSequence: Waypoint[];
  totalDistance: number;
  estimatedDuration: number;
  status: string;
  optimizationTime?: number;
  solverVersion?: string;
  passengerCount?: number;
  averageSpeed?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Plan {
  id: string;
  name: string;
  code: string;
  maxVehicles: number;
  maxPassengers: number;
  monthlyPrice: number;
  features: string[];
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreatePlanRequest {
  name: string;
  code: string;
  maxVehicles: number;
  maxPassengers: number;
  monthlyPrice: number;
  features: string[];
}

export interface UpdatePlanRequest {
  name?: string;
  maxVehicles?: number;
  maxPassengers?: number;
  monthlyPrice?: number;
  features?: string[];
}

export interface Subscription {
  id: string;
  institutionId: string;
  planId: string;
  status: string;
  startDate: string;
  endDate?: string;
  autoRenew: boolean;
  plan?: Plan;
  createdAt?: string;
  updatedAt?: string;
}

export interface DashboardStats {
  institutions: {
    total: number;
    active: number;
    pending: number;
    byStatus: Array<{ status: string; count: number }>;
  };
  vehicles: {
    total: number;
    active: number;
  };
  passengers: {
    total: number;
  };
  trips: {
    total: number;
    completed: number;
    inProgress: number;
    completionRate: number;
    period: string;
  };
  checkIns: {
    total: number;
    boarding: number;
    alighting: number;
    period: string;
  };
  routes: {
    total: number;
    optimized: number;
  };
}

export interface InstitutionStat {
  id: string;
  name: string;
  businessRegistrationNumber: string;
  vehicleCount: number;
  passengerCount: number;
  totalTrips: number;
  completedTrips: number;
  completionRate: number;
}

export interface RecentActivity {
  trips: Array<{
    id: string;
    institutionName: string;
    vehiclePlate: string;
    status: string;
    shuttleType: string;
    scheduledStartTime: string;
    createdAt: string;
  }>;
  checkIns: Array<{
    id: string;
    passengerName: string;
    institutionName: string;
    checkType: string;
    createdAt: string;
  }>;
}

export class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private getAuthHeader(): HeadersInit {
    const token = localStorage.getItem('accessToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async login(credentials: LoginRequest): Promise<LoginResponse> {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // 토큰 저장
    if (data.data.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
      localStorage.setItem('refreshToken', data.data.refreshToken);
    }

    return data;
  }

  async getCurrentUser(): Promise<User> {
    const response = await fetch(`${this.baseURL}/auth/me`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user');
    }

    const data = await response.json();
    return data.data;
  }

  async updateUser(userId: string, updates: { email?: string; name?: string; password?: string }): Promise<User> {
    const response = await fetch(`${this.baseURL}/users/${userId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Update failed');
    }

    const data = await response.json();
    return data.data;
  }

  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  // Route Optimization APIs
  async optimizeRoute(request: OptimizeRouteRequest): Promise<{ success: boolean; data: Route; message: string }> {
    const response = await fetch(`${this.baseURL}/admin/routes/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Route optimization failed');
    }

    return await response.json();
  }

  async getRoute(routeId: string): Promise<Route> {
    const response = await fetch(`${this.baseURL}/admin/routes/${routeId}`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch route');
    }

    const data = await response.json();
    return data.data;
  }

  async getRoutesByInstitution(institutionId: string): Promise<Route[]> {
    const response = await fetch(`${this.baseURL}/admin/routes/institution/${institutionId}`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch routes');
    }

    const data = await response.json();
    return data.data;
  }

  async getInstitutions(): Promise<Institution[]> {
    const response = await fetch(`${this.baseURL}/admin/institutions`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch institutions');
    }

    const data = await response.json();
    return data.data;
  }

  async getVehiclesByInstitution(institutionId: string): Promise<Vehicle[]> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}/vehicles`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch vehicles');
    }

    const data = await response.json();
    return data.data;
  }

  // Institution Admin APIs
  async getPendingInstitutions(): Promise<Institution[]> {
    const response = await fetch(`${this.baseURL}/admin/institutions/pending`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch pending institutions');
    }

    const data = await response.json();
    return data.data;
  }

  async approveInstitution(institutionId: string): Promise<Institution> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}/approve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to approve institution');
    }

    const data = await response.json();
    return data.data;
  }

  async rejectInstitution(institutionId: string, reason: string): Promise<Institution> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}/reject`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reject institution');
    }

    const data = await response.json();
    return data.data;
  }

  async suspendInstitution(institutionId: string, reason: string): Promise<Institution> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}/suspend`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ reason }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to suspend institution');
    }

    const data = await response.json();
    return data.data;
  }

  async reactivateInstitution(institutionId: string): Promise<Institution> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}/reactivate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to reactivate institution');
    }

    const data = await response.json();
    return data.data;
  }

  async getInstitutionById(institutionId: string): Promise<Institution> {
    const response = await fetch(`${this.baseURL}/admin/institutions/${institutionId}`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch institution');
    }

    const data = await response.json();
    return data.data;
  }

  // Plan Admin APIs
  async getAllPlans(): Promise<Plan[]> {
    const response = await fetch(`${this.baseURL}/admin/plans`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch plans');
    }

    const data = await response.json();
    return data.data;
  }

  async createPlan(request: CreatePlanRequest): Promise<Plan> {
    const response = await fetch(`${this.baseURL}/admin/plans`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create plan');
    }

    const data = await response.json();
    return data.data;
  }

  async updatePlan(planId: string, request: UpdatePlanRequest): Promise<Plan> {
    const response = await fetch(`${this.baseURL}/admin/plans/${planId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to update plan');
    }

    const data = await response.json();
    return data.data;
  }

  async deletePlan(planId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/admin/plans/${planId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to delete plan');
    }
  }

  // Public Plan APIs
  async getActivePlans(): Promise<Plan[]> {
    const response = await fetch(`${this.baseURL}/plans`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch active plans');
    }

    const data = await response.json();
    return data.data;
  }

  // Statistics APIs
  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(`${this.baseURL}/admin/stats/dashboard`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch dashboard stats');
    }

    const data = await response.json();
    return data.data;
  }

  async getInstitutionStats(institutionId?: string): Promise<InstitutionStat[]> {
    const url = institutionId
      ? `${this.baseURL}/admin/stats/institutions?institutionId=${institutionId}`
      : `${this.baseURL}/admin/stats/institutions`;

    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch institution stats');
    }

    const data = await response.json();
    return data.data;
  }

  async getRecentActivity(limit?: number): Promise<RecentActivity> {
    const url = limit
      ? `${this.baseURL}/admin/stats/recent-activity?limit=${limit}`
      : `${this.baseURL}/admin/stats/recent-activity`;

    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch recent activity');
    }

    const data = await response.json();
    return data.data;
  }

  // Subscription Admin APIs
  async getAllSubscriptions(status?: string): Promise<Subscription[]> {
    const url = status
      ? `${this.baseURL}/admin/subscriptions?status=${status}`
      : `${this.baseURL}/admin/subscriptions`;

    const response = await fetch(url, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }

    const data = await response.json();
    return data.data;
  }

  async getInstitutionSubscription(institutionId: string): Promise<Subscription> {
    const response = await fetch(`${this.baseURL}/admin/subscriptions/institution/${institutionId}`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch institution subscription');
    }

    const data = await response.json();
    return data.data;
  }

  async createInstitutionSubscription(
    institutionId: string,
    planId: string,
    autoRenew: boolean = true
  ): Promise<Subscription> {
    const response = await fetch(`${this.baseURL}/admin/subscriptions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
      body: JSON.stringify({ institutionId, planId, autoRenew }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to create subscription');
    }

    const data = await response.json();
    return data.data;
  }

  async forceCancelSubscription(subscriptionId: string): Promise<Subscription> {
    const response = await fetch(`${this.baseURL}/admin/subscriptions/${subscriptionId}/force-cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to cancel subscription');
    }

    const data = await response.json();
    return data.data;
  }

  // Notification APIs
  async getNotifications(limit: number = 50): Promise<any[]> {
    const response = await fetch(`${this.baseURL}/notifications?limit=${limit}`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch notifications');
    }

    const data = await response.json();
    return data.data;
  }

  async getUnreadCount(): Promise<number> {
    const response = await fetch(`${this.baseURL}/notifications/unread-count`, {
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch unread count');
    }

    const data = await response.json();
    return data.data.count;
  }

  async markNotificationAsRead(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark notification as read');
    }
  }

  async markAllNotificationsAsRead(): Promise<void> {
    const response = await fetch(`${this.baseURL}/notifications/mark-all-read`, {
      method: 'POST',
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to mark all as read');
    }
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const response = await fetch(`${this.baseURL}/notifications/${notificationId}`, {
      method: 'DELETE',
      headers: {
        ...this.getAuthHeader(),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to delete notification');
    }
  }
}

export const apiClient = new ApiClient();
