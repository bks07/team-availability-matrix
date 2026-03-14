import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from './services/auth.service';
import { MatrixService } from './services/matrix.service';
import { AuthResponse, AvailabilityStatus, User } from './models/api.models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <main class="page-shell">
      <section class="hero-card">
        <div>
          <p class="eyebrow">Team planning</p>
          <h1>Availability Matrix</h1>
          <p class="hero-copy">
            Track who is working, on vacation, or absent for each day.
          </p>
        </div>
        <div class="legend" *ngIf="currentUser">
          <span class="legend-item status-w">W · Working</span>
          <span class="legend-item status-v">V · Vacation</span>
          <span class="legend-item status-a">A · Absence</span>
        </div>
      </section>

      <section class="auth-card" *ngIf="!currentUser">
        <div class="auth-tabs">
          <button type="button" [class.active]="authMode === 'login'" (click)="authMode = 'login'">
            Log in
          </button>
          <button type="button" [class.active]="authMode === 'register'" (click)="authMode = 'register'">
            Register
          </button>
        </div>

        <form class="auth-form" (ngSubmit)="submitAuth()">
          <label *ngIf="authMode === 'register'">
            <span>Name</span>
            <input
              name="displayName"
              [(ngModel)]="authForm.displayName"
              required
              minlength="2"
              maxlength="80"
              placeholder="Jane Doe"
            />
          </label>
          <label>
            <span>Email</span>
            <input
              name="email"
              [(ngModel)]="authForm.email"
              required
              type="email"
              placeholder="jane@example.com"
            />
          </label>
          <label>
            <span>Password</span>
            <input
              name="password"
              [(ngModel)]="authForm.password"
              required
              type="password"
              minlength="8"
              placeholder="At least 8 characters"
            />
          </label>
          <button type="submit" class="primary-button" [disabled]="authSubmitting">
            {{ authSubmitting ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account' }}
          </button>
        </form>
      </section>

      <section class="toolbar-card" *ngIf="currentUser">
        <div>
          <p class="toolbar-title">Signed in as {{ currentUser.displayName }}</p>
          <p class="toolbar-subtitle">You can edit only your own column. Hover your column to change a status.</p>
        </div>
        <div class="toolbar-actions">
          <label class="period-label">
            From
            <input type="date" [(ngModel)]="periodStart" (change)="applyPeriod()" name="periodStart" />
          </label>
          <label class="period-label">
            To
            <input type="date" [(ngModel)]="periodEnd" (change)="applyPeriod()" name="periodEnd" />
          </label>
          <button type="button" (click)="refreshMatrix()" [disabled]="matrixLoading">Refresh</button>
          <button type="button" (click)="logout()">Log out</button>
        </div>
      </section>

      <p class="message error" *ngIf="errorMessage">{{ errorMessage }}</p>
      <p class="message success" *ngIf="successMessage">{{ successMessage }}</p>
      <p class="message" *ngIf="currentUser && matrixLoading">Loading matrix...</p>

      <section class="matrix-card" *ngIf="filteredDays.length && employees.length">
        <div class="matrix-wrapper">
          <table>
            <thead>
              <tr>
                <th class="sticky-column sticky-header">Date</th>
                <th class="sticky-header" *ngFor="let employee of employees; trackBy: trackEmployee">
                  <div class="employee-name">{{ employee.displayName }}</div>
                  <div class="employee-email">{{ employee.email }}</div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let day of filteredDays; trackBy: trackDay">
                <th class="sticky-column date-cell">{{ formatDay(day) }}</th>
                <td *ngFor="let employee of employees; trackBy: trackEmployee">
                  <div
                    class="cell-wrapper"
                    [class.editable]="canEdit(employee.id)"
                    (mouseenter)="onCellEnter(employee.id, day)"
                    (mouseleave)="hoveredKey = null"
                  >
                    <span
                      class="status-pill"
                      [class.status-w]="statusFor(employee.id, day) === 'W'"
                      [class.status-v]="statusFor(employee.id, day) === 'V'"
                      [class.status-a]="statusFor(employee.id, day) === 'A'"
                    >
                      {{ pendingKey === cellKey(employee.id, day) ? '…' : statusFor(employee.id, day) }}
                    </span>

                    <div
                      class="status-overlay"
                      *ngIf="canEdit(employee.id) && hoveredKey === cellKey(employee.id, day)"
                    >
                      <button class="overlay-btn status-w" (click)="setOwnStatus(day, 'W')">W</button>
                      <button class="overlay-btn status-v" (click)="setOwnStatus(day, 'V')">V</button>
                      <button class="overlay-btn status-a" (click)="setOwnStatus(day, 'A')">A</button>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </main>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .page-shell {
        display: grid;
        gap: 1.5rem;
        padding: 2rem;
      }

      .hero-card,
      .auth-card,
      .toolbar-card,
      .matrix-card {
        background: #ffffff;
        border-radius: 18px;
        box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
        padding: 1.5rem;
      }

      .hero-card,
      .toolbar-card {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .eyebrow {
        margin: 0 0 0.4rem;
        color: #4f46e5;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        font-size: 0.78rem;
      }

      h1 {
        margin: 0;
        font-size: clamp(2rem, 4vw, 3rem);
      }

      .hero-copy,
      .toolbar-subtitle,
      .employee-email {
        margin: 0.4rem 0 0;
        color: #64748b;
      }

      .legend {
        display: flex;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .legend-item {
        border-radius: 999px;
        padding: 0.45rem 0.8rem;
        font-weight: 700;
        border: none;
      }

      .auth-tabs {
        display: inline-flex;
        gap: 0.5rem;
        margin-bottom: 1rem;
      }

      .auth-tabs button,
      .toolbar-actions button {
        border: 1px solid #dbe1ea;
        background: #f8fafc;
        color: #0f172a;
        border-radius: 10px;
        padding: 0.7rem 1rem;
        cursor: pointer;
      }

      .auth-tabs button.active,
      .primary-button {
        background: #4f46e5;
        color: #ffffff;
        border-color: #4f46e5;
      }

      .auth-form {
        display: grid;
        gap: 1rem;
        max-width: 420px;
      }

      label {
        display: grid;
        gap: 0.45rem;
        color: #1f2937;
        font-weight: 600;
      }

      input {
        border-radius: 10px;
        border: 1px solid #dbe1ea;
        padding: 0.8rem 0.9rem;
      }

      .primary-button {
        cursor: pointer;
        padding: 0.9rem 1rem;
      }

      .toolbar-title {
        margin: 0;
        font-weight: 700;
      }

      .toolbar-actions {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        flex-wrap: wrap;
      }

      .period-label {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        font-weight: 600;
        font-size: 0.9rem;
      }

      .period-label input {
        padding: 0.55rem 0.75rem;
      }

      .message {
        margin: 0;
        font-weight: 600;
      }

      .message.error {
        color: #b91c1c;
      }

      .message.success {
        color: #047857;
      }

      .matrix-wrapper {
        overflow: auto;
        max-height: 75vh;
      }

      table {
        width: max-content;
        min-width: 100%;
        border-collapse: separate;
        border-spacing: 0;
      }

      th,
      td {
        border-bottom: 1px solid #e2e8f0;
        border-right: 1px solid #e2e8f0;
        padding: 0.55rem;
        text-align: center;
        background: #ffffff;
      }

      thead th {
        position: sticky;
        top: 0;
        z-index: 2;
        background: #eff6ff;
      }

      .sticky-column {
        position: sticky;
        left: 0;
        z-index: 1;
        background: #f8fafc;
        text-align: left;
      }

      .sticky-header.sticky-column {
        z-index: 3;
      }

      .date-cell {
        white-space: nowrap;
        min-width: 164px;
        font-size: 0.88rem;
        font-weight: 600;
      }

      .employee-name {
        font-weight: 700;
      }

      .cell-wrapper {
        position: relative;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 2rem;
      }

      .status-pill {
        border-radius: 999px;
        padding: 0.35rem 0.75rem;
        font-weight: 700;
        font-size: 0.85rem;
        user-select: none;
      }

      .editable .status-pill {
        cursor: pointer;
      }

      .status-overlay {
        position: absolute;
        top: calc(100% + 4px);
        left: 50%;
        transform: translateX(-50%);
        z-index: 20;
        display: flex;
        gap: 0.25rem;
        background: #ffffff;
        border: 1px solid #dbe1ea;
        border-radius: 10px;
        padding: 0.3rem;
        box-shadow: 0 6px 20px rgba(15, 23, 42, 0.15);
      }

      .overlay-btn {
        border-radius: 999px;
        padding: 0.35rem 0.65rem;
        font-weight: 700;
        border: none;
        cursor: pointer;
        font-size: 0.85rem;
        transition: filter 0.1s;
      }

      .overlay-btn:hover {
        filter: brightness(0.92);
      }

      .status-w {
        background: #dcfce7;
        color: #166534;
      }

      .status-v {
        background: #fef3c7;
        color: #92400e;
      }

      .status-a {
        background: #fee2e2;
        color: #991b1b;
      }

      @media (max-width: 900px) {
        .page-shell {
          padding: 1rem;
        }
      }
    `
  ]
})
export class AppComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly matrixService = inject(MatrixService);

  authMode: 'login' | 'register' = 'login';
  authSubmitting = false;
  matrixLoading = false;
  errorMessage = '';
  successMessage = '';

  periodStart = '';
  periodEnd = '';
  filteredDays: string[] = [];
  employees: User[] = [];

  currentUser: User | null = null;
  hoveredKey: string | null = null;
  pendingKey: string | null = null;
  private entryMap = new Map<string, AvailabilityStatus>();

  authForm = { displayName: '', email: '', password: '' };

  async ngOnInit(): Promise<void> {
    const { start, end } = this.defaultPeriod();
    this.periodStart = start;
    this.periodEnd = end;

    const session = this.authService.loadSession();
    if (!session) {
      return;
    }

    try {
      this.currentUser = await this.authService.me();
      this.authService.saveSession({ ...session, user: this.currentUser });
      await this.refreshMatrix();
    } catch (error) {
      this.handleError(error, 'Your session expired. Please log in again.');
      this.logout();
    }
  }

  formatDay(dateStr: string): string {
    const date = new Date(dateStr + 'T00:00:00');
    const dow = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
    return `${dow} ${dateStr}`;
  }

  async applyPeriod(): Promise<void> {
    if (!this.periodStart || !this.periodEnd) {
      return;
    }
    if (this.periodStart > this.periodEnd) {
      this.errorMessage = 'Start date must be before end date.';
      return;
    }
    await this.refreshMatrix();
  }

  async submitAuth(): Promise<void> {
    this.clearMessages();
    this.authSubmitting = true;

    try {
      const session: AuthResponse =
        this.authMode === 'login'
          ? await this.authService.login({ email: this.authForm.email, password: this.authForm.password })
          : await this.authService.register({
              displayName: this.authForm.displayName,
              email: this.authForm.email,
              password: this.authForm.password
            });

      this.authService.saveSession(session);
      this.currentUser = session.user;
      this.authForm.password = '';
      this.successMessage = this.authMode === 'login' ? 'Welcome back.' : 'Account created successfully.';
      await this.refreshMatrix();
    } catch (error) {
      this.handleError(error, 'Authentication failed.');
    } finally {
      this.authSubmitting = false;
    }
  }

  async refreshMatrix(): Promise<void> {
    if (!this.currentUser || !this.periodStart || !this.periodEnd) {
      return;
    }

    this.clearMessages();
    this.matrixLoading = true;

    try {
      const startYear = +this.periodStart.slice(0, 4);
      const endYear = +this.periodEnd.slice(0, 4);
      const years = startYear === endYear ? [startYear] : [startYear, endYear];

      const results = await Promise.all(years.map(y => this.matrixService.getMatrix(y)));

      this.employees = results[0].employees;
      this.filteredDays = results
        .flatMap(r => r.days)
        .filter(d => d >= this.periodStart && d <= this.periodEnd);
      this.entryMap = new Map(
        results.flatMap(r => r.entries).map(e => [this.cellKey(e.userId, e.date), e.status])
      );
    } catch (error) {
      this.handleError(error, 'Failed to load the availability matrix.');
    } finally {
      this.matrixLoading = false;
    }
  }

  onCellEnter(employeeId: number, date: string): void {
    const key = this.cellKey(employeeId, date);
    if (this.canEdit(employeeId) && this.pendingKey !== key) {
      this.hoveredKey = key;
    }
  }

  async setOwnStatus(date: string, status: AvailabilityStatus): Promise<void> {
    if (!this.currentUser) {
      return;
    }

    const key = this.cellKey(this.currentUser.id, date);
    this.hoveredKey = null;
    this.pendingKey = key;
    this.clearMessages();

    try {
      const saved = await this.matrixService.setOwnStatus(date, status);
      const nextMap = new Map(this.entryMap);
      nextMap.set(this.cellKey(saved.userId, saved.date), saved.status);
      this.entryMap = nextMap;
      this.successMessage = `Saved ${status} for ${date}.`;
    } catch (error) {
      this.handleError(error, 'Failed to save the status change.');
    } finally {
      this.pendingKey = null;
    }
  }

  canEdit(employeeId: number): boolean {
    return this.currentUser?.id === employeeId;
  }

  statusFor(employeeId: number, date: string): AvailabilityStatus {
    return this.entryMap.get(this.cellKey(employeeId, date)) ?? 'W';
  }

  cellKey(employeeId: number, date: string): string {
    return `${employeeId}:${date}`;
  }

  trackEmployee(_index: number, employee: User): number {
    return employee.id;
  }

  trackDay(_index: number, day: string): string {
    return day;
  }

  logout(): void {
    this.authService.clearSession();
    this.currentUser = null;
    this.filteredDays = [];
    this.employees = [];
    this.entryMap = new Map();
    this.hoveredKey = null;
    this.pendingKey = null;
    this.clearMessages();
    this.authForm = { displayName: '', email: '', password: '' };
  }

  private defaultPeriod(): { start: string; end: string } {
    const today = new Date();
    const dow = today.getDay();
    const toMonday = dow === 0 ? -6 : 1 - dow;

    const thisMonday = new Date(today);
    thisMonday.setDate(today.getDate() + toMonday);

    // Start: Monday of the previous week
    const start = new Date(thisMonday);
    start.setDate(thisMonday.getDate() - 7);

    // End: Sunday of the week 2 weeks ahead (4 weeks total)
    const end = new Date(thisMonday);
    end.setDate(thisMonday.getDate() + 20);

    return { start: this.toIsoDate(start), end: this.toIsoDate(end) };
  }

  private toIsoDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private handleError(error: unknown, fallbackMessage: string): void {
    if (error instanceof HttpErrorResponse) {
      if (typeof error.error === 'object' && error.error !== null && 'error' in error.error) {
        const message = error.error.error;
        if (typeof message === 'string' && message.trim()) {
          this.errorMessage = message;
          return;
        }
      }
      if (typeof error.error === 'string' && error.error.trim()) {
        this.errorMessage = error.error;
        return;
      }
    }
    this.errorMessage = fallbackMessage;
  }
}
