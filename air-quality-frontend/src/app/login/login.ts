import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ApiService } from '../api';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  showPassword = false;
  loading = false;

  constructor(private router: Router, private api: ApiService) {}

  login() {
    this.error = '';
    this.loading = true;
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          localStorage.setItem('aq_admin', 'true');
          this.router.navigate(['/admin']);
        } else {
          this.error = res.message;
        }
      },
      error: () => {
        this.loading = false;
        this.error = 'Invalid username or password.';
      }
    });
  }
}
