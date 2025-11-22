
import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { AppHomeComponent } from './components/home/home.component'; 
import { LoginComponent } from './components/login/login.component';


export const routes: Routes = [
  {
    path: '',
    component: AppHomeComponent,
    canActivate: [authGuard]
  },
  {
    path: 'login',
    component: LoginComponent
  },
  {
    path: 'mcm',
    canActivate: [authGuard],
    loadChildren: () => import('./components/mcm/mcm.module').then(m => m.McmModule)
  },
  {
    path: 'wsm',
    canActivate: [authGuard],
    loadChildren: () => import('./components/wsm/wsm.module').then(m => m.WsmModule)
  }
];
