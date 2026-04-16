import { Routes } from '@angular/router';
import { ReadingsComponent } from './readings/readings';
import { LoginComponent } from './login/login';
import { AdminComponent } from './admin/admin';

export const routes: Routes = [
  { path: '', component: ReadingsComponent },
  { path: 'login', component: LoginComponent },
  { path: 'admin', component: AdminComponent },
  { path: '**', redirectTo: '' }
];
