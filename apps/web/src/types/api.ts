// src/types/api.ts
// DTO-типи, що відповідають backend-відповідям (Module 01 Auth, Module 02 Clients).

/** Ролі користувачів (Prisma Role). */
export type Role = 'super_admin' | 'head_accountant' | 'accountant' | 'client';

export interface User {
  id: string;
  email: string;
  name: string;
  login: string | null;
  role: Role;
  isVerified: boolean;
}

/** Профіль з GET /auth/me. */
export interface Me extends User {
  phone: string | null;
  telegram_chat_id: string | null;
  reminder_days_before: number;
}

/** data з register/login/refresh. */
export interface AuthData {
  accessToken: string;
  user: User;
}

// ==================== Module 02 — Clients ====================

/** Значення enum client_type на backend (Prisma ClientType). */
export type ClientType =
  | 'fop_group_1'
  | 'fop_group_2'
  | 'fop_group_3'
  | 'fop_general'
  | 'tov'
  | 'tov_general'
  | 'pp'
  | 'self_employed'
  | 'public_organization'
  | 'charity_fund'
  | 'osbb';

/** Клієнт (GET /clients, POST /clients, PATCH /clients/:id). Поля — snake_case, як віддає API. */
export interface Client {
  id: string;
  name: string;
  edrpou_or_inn: string | null;
  client_type: ClientType;
  phone: string | null;
  email: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/** GET /clients/:id — клієнт + агрегат по зобовʼязаннях (Module 03). */
export interface ClientDetails extends Client {
  active_obligations_count: number;
  overdue_obligations_count: number;
}

/** GET /clients — сторінка списку. */
export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
}

/** Query-параметри GET /clients. */
export interface ClientsQuery {
  search?: string;
  type?: ClientType;
  is_active?: boolean;
  page?: number;
  limit?: number;
  sort?: 'name' | 'created_at';
}

// ==================== Module 03 — Obligations ====================

/** Статус зобов'язання (Prisma ObligationStatus). overdue — лише cron, не вручну. */
export type ObligationStatus = 'pending' | 'collected' | 'submitted' | 'overdue';

/** Статус, який можна виставити вручну (без overdue) — для StatusSelect. */
export type ManualObligationStatus = Exclude<ObligationStatus, 'overdue'>;

/** Рівень терміновості — backend-фільтр GET /obligations?urgency=. */
export type Urgency = 'overdue' | 'this_week' | 'this_month' | 'later';

/** Зобов'язання у списку (GET /obligations). client_name — з JOIN на беку. */
export interface Obligation {
  id: string;
  client_id: string;
  client_name: string;
  template_id: string | null;
  name: string;
  period_label: string;
  due_date: string;
  status: ObligationStatus;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/** Елемент чекліста документів (вкладений у деталі зобов'язання). */
export interface ChecklistItem {
  id: string;
  doc_name: string;
  is_collected: boolean;
  sort_order: number;
}

/** GET /obligations/:id — зобов'язання + вкладений чекліст. */
export interface ObligationDetails extends Obligation {
  checklist_items: ChecklistItem[];
}

/** GET /obligations — сторінка списку. */
export interface PaginatedObligations {
  items: Obligation[];
  total: number;
  page: number;
  limit: number;
}

/** Query-параметри GET /obligations. */
export interface ObligationsQuery {
  client_id?: string;
  status?: ObligationStatus;
  urgency?: Urgency;
  page?: number;
  limit?: number;
}

// ==================== Module 06 — Billing (частково) ====================

export type SubscriptionPlan = 'free' | 'pro' | 'unlimited';

/** GET /billing/plans — елемент переліку тарифів. */
export interface Plan {
  plan: SubscriptionPlan;
  clientLimit: number;
  pricePerMonthUah: number;
  title: string;
}

/** GET /billing/subscription — поточна підписка + використання ("X з Y"). */
export interface Subscription {
  plan: SubscriptionPlan;
  client_limit: number;
  status: string;
  used_clients: number;
  is_unlimited: boolean;
  current_period_end: string | null;
}

// ==================== Спільні обгортки ====================

/** Обгортка успішної відповіді backend. */
export interface ApiSuccess<T> {
  success: true;
  data: T;
}

/** Обгортка помилки backend. */
export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { path: string; message: string }[];
  };
}
