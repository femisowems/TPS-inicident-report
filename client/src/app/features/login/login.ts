import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

export type AuthMode = 'login' | 'signup' | 'forgot' | 'magic';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  
  loading = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  viewMode = signal<AuthMode>('login');

  // --- Forms ---
  
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  signupForm = this.fb.group({
    name: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', Validators.required]
  }, { validators: this.passwordMatchValidator });

  forgotForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  magicLinkForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]]
  });

  // --- Handlers ---

  setMode(mode: AuthMode) {
    this.viewMode.set(mode);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirmPassword');
    return password && confirm && password.value !== confirm.value ? { passwordMismatch: true } : null;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      this.executeAuthAction(() => {
        const email = this.loginForm.get('email')?.value;
        if (email?.includes('admin') || email?.includes('officer')) {
          this.router.navigate(['/dashboard']);
        } else {
          this.router.navigate(['/status']);
        }
      }, 'Authenticating...');
    }
  }

  async onSignup() {
    if (this.signupForm.valid) {
      this.executeAuthAction(() => {
        this.successMessage.set('Account created! You can now sign in.');
        this.viewMode.set('login');
      }, 'Creating Account...');
    }
  }

  async onForgotPassword() {
    if (this.forgotForm.valid) {
      this.executeAuthAction(() => {
        this.successMessage.set('Recovery instructions sent to your email.');
      }, 'Sending Recovery Email...');
    }
  }

  async onMagicLink() {
    if (this.magicLinkForm.valid) {
      this.executeAuthAction(() => {
        this.successMessage.set('Magic link sent! Check your inbox to login.');
      }, 'Generating Magic Link...');
    }
  }

  private executeAuthAction(action: () => void, loadingText: string) {
    this.loading.set(true);
    this.errorMessage.set('');
    setTimeout(() => {
      action();
      this.loading.set(false);
    }, 1500);
  }
}
