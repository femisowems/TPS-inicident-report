import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase';

export type AccountSection = 'profile' | 'email' | 'password' | 'danger';

@Component({
  selector: 'app-account',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './account.html',
  styleUrls: ['./account.css']
})
export class AccountComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private supaAuth = inject(SupabaseService);

  currentUser = this.supaAuth.currentUser;
  activeSection = signal<AccountSection>('profile');
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  showDeleteConfirm = signal(false);

  // --- Forms ---

  profileForm = this.fb.group({
    displayName: ['', [Validators.required, Validators.minLength(2)]]
  });

  emailForm = this.fb.group({
    newEmail: ['', [Validators.required, Validators.email]],
    confirmEmail: ['', [Validators.required, Validators.email]]
  }, { validators: this.emailMatchValidator });

  passwordForm = this.fb.group({
    newPassword: ['', [Validators.required, Validators.minLength(8)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  ngOnInit() {
    const user = this.currentUser();
    if (!user) {
      this.router.navigate(['/login']);
      return;
    }
    const displayName = user.user_metadata?.['display_name'] || user.user_metadata?.['full_name'] || '';
    this.profileForm.patchValue({ displayName });
    this.emailForm.patchValue({ newEmail: user.email || '', confirmEmail: user.email || '' });
  }

  setSection(section: AccountSection) {
    this.activeSection.set(section);
    this.clearMessages();
    this.showDeleteConfirm.set(false);
  }

  private clearMessages() {
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  private emailMatchValidator(control: AbstractControl): ValidationErrors | null {
    const email = control.get('newEmail');
    const confirm = control.get('confirmEmail');
    return email && confirm && email.value !== confirm.value ? { emailMismatch: true } : null;
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('newPassword');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  async onUpdateProfile() {
    if (this.profileForm.invalid) return;
    this.loading.set(true);
    this.clearMessages();

    const displayName = this.profileForm.get('displayName')?.value!;

    const { error } = await this.supaAuth.updateUserMetadata({ display_name: displayName });

    this.loading.set(false);
    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.successMessage.set('Display name updated successfully.');
    }
  }

  async onUpdateEmail() {
    if (this.emailForm.invalid) return;
    this.loading.set(true);
    this.clearMessages();

    const newEmail = this.emailForm.get('newEmail')?.value!;
    const { error } = await this.supaAuth.updateEmail(newEmail);

    this.loading.set(false);
    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.successMessage.set('Verification sent to your new email. Please confirm the change.');
    }
  }

  async onUpdatePassword() {
    if (this.passwordForm.invalid) return;
    this.loading.set(true);
    this.clearMessages();

    const newPassword = this.passwordForm.get('newPassword')?.value!;
    const { error } = await this.supaAuth.updatePassword(newPassword);

    this.loading.set(false);
    if (error) {
      this.errorMessage.set(error.message);
    } else {
      this.successMessage.set('Password updated. Use your new credentials next time you log in.');
      this.passwordForm.reset();
    }
  }

  async onSignOut() {
    await this.supaAuth.signOut();
    this.router.navigate(['/login']);
  }

  async onDeleteAccount() {
    // Supabase requires an admin API call to delete users; for now we sign them out
    // and surface a message. In production, route to a server-side endpoint.
    this.loading.set(true);
    this.clearMessages();
    await this.supaAuth.signOut();
    this.loading.set(false);
    this.router.navigate(['/login']);
  }

  getRoleBadge(): string {
    const email = this.currentUser()?.email || '';
    if (email.includes('admin')) return 'Admin';
    if (email.includes('officer')) return 'Officer';
    return 'Citizen';
  }

  getRoleBadgeClass(): string {
    const role = this.getRoleBadge();
    if (role === 'Admin') return 'bg-blue-100 text-blue-700';
    if (role === 'Officer') return 'bg-emerald-100 text-emerald-700';
    return 'bg-slate-100 text-slate-600';
  }
}
