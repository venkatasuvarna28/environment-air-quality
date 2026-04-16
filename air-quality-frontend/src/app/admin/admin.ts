import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { LimitsService } from '../limits.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './admin.html',
  styleUrls: ['./admin.css']
})
export class AdminComponent implements OnInit {
  limits = inject(LimitsService);

  pm25Input: number = 100;
  co2Input: number  = 500;
  saved = false;

  constructor(private router: Router) {}

  ngOnInit() {
    if (!localStorage.getItem('aq_admin')) {
      this.router.navigate(['/login']);
      return;
    }
    this.pm25Input = this.limits.pm25Limit();
    this.co2Input  = this.limits.co2Limit();
  }

  save() {
    this.limits.update(this.pm25Input, this.co2Input);
    this.saved = true;
    setTimeout(() => this.saved = false, 3000);
  }

  logout() {
    localStorage.removeItem('aq_admin');
    this.router.navigate(['/login']);
  }
}
