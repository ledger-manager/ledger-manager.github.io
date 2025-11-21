import { Component, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { TableModule } from 'primeng/table';
import { SelectButtonModule } from 'primeng/selectbutton';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { MemberData } from '../model/member-data.model';
import { MEMBERS } from '../model/member-data.model';
import { CustomerService } from '../../../services/customer.service';

@Component({
  selector: 'app-customer-view',
  standalone: true,
  imports: [CommonModule, TableModule, SelectButtonModule, ButtonModule, FormsModule, ToastModule, DialogModule],
  providers: [MessageService],
  templateUrl: './customer-view.html',
  styleUrls: ['./customer-view.scss']
})
export class CustomerView implements OnInit {
  customers = signal<MemberData[]>([]);
  loading = signal(false);
  saving = signal(false);
  showDialog = false;
  isEditMode = false;
  editingCustomerIndex = -1;

  newCustomer: MemberData = {
    custNo: 0,
    name_tel: '',
    name_en: '',
    village: '',
    mobileNo: '',
    isActive: true
  };

  nameDisplayOptions: any[] = [
    { label: 'en', value: 'en' },
    { label: 'tel', value: 'tel' }
  ];
  selectedNameDisplay = 'en';

  constructor(
    private customerService: CustomerService,
    private messageService: MessageService,
    private authService: AuthService,
    private router: Router
  ) {}
  /**
   * Navigate to home page based on role
   * Admin: main home page (/)
   * Member: mcm home page (/mcm)
   */
  goToHome(): void {
    if (this.authService.isAdmin()) {
      this.router.navigate(['/']);
    } else {
      this.router.navigate(['/mcm']);
    }
  }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);

    this.customerService.getCustomers().subscribe({
      next: (customers) => {
        this.loading.set(false);
        this.customers.set(customers);
        if (customers.length === 0) {
          this.messageService.add({
            severity: 'info',
            summary: 'No Data',
            detail: 'No customers found in database.',
            life: 3000
          });
        }
      },
      error: (error) => {
        this.loading.set(false);
        this.customers.set([]);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load customers',
          life: 3000
        });
      }
    });
  }

  saveCustomers(): void {
    this.saving.set(true);
    
    this.customerService.saveCustomers(this.customers()).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customers saved successfully',
          life: 3000
        });
      },
      error: (error) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.reason || 'Failed to save customers',
          life: 3000
        });
      }
    });
  }

  openAddCustomerDialog(): void {
    // Calculate next customer number
    const maxCustNo = this.customers().reduce((max, customer) => 
      Math.max(max, customer.custNo), 0);
    
    this.isEditMode = false;
    this.editingCustomerIndex = -1;
    this.newCustomer = {
      custNo: maxCustNo + 1,
      name_tel: '',
      name_en: '',
      village: '',
      mobileNo: '',
      isActive: true
    };
    
    this.showDialog = true;
  }

  openEditCustomerDialog(customer: MemberData): void {
    this.isEditMode = true;
    this.editingCustomerIndex = this.customers().findIndex(c => c.custNo === customer.custNo);
    this.newCustomer = { ...customer };
    this.showDialog = true;
  }

  closeDialog(): void {
    this.showDialog = false;
    this.isEditMode = false;
    this.editingCustomerIndex = -1;
  }

  saveCustomer(): void {
    if (this.isEditMode) {
      this.updateCustomer();
    } else {
      this.addCustomer();
    }
  }

  addCustomer(): void {
    // Validate required fields
    if (!this.newCustomer.name_en.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter customer name',
        life: 3000
      });
      return;
    }

    if (!this.newCustomer.village.trim()) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Validation Error',
        detail: 'Please enter village',
        life: 3000
      });
      return;
    }

    // Add to customers list
    const currentCustomers = this.customers();
    const updatedCustomers = [...currentCustomers, { ...this.newCustomer }];
    this.customers.set(updatedCustomers);
    
    // Save to CouchDB
    this.saving.set(true);
    this.customerService.saveCustomers(updatedCustomers).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer added and saved successfully',
          life: 3000
        });
        this.closeDialog();
      },
      error: (error) => {
        this.saving.set(false);
        // Revert the local change if save fails
        this.customers.set(currentCustomers);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.reason || 'Failed to save customer',
          life: 3000
        });
      }
    });
  }

  updateCustomer(): void {
    if (this.editingCustomerIndex === -1) return;

    const currentCustomers = this.customers();
    const updatedCustomers = [...currentCustomers];
    updatedCustomers[this.editingCustomerIndex] = { ...this.newCustomer };
    this.customers.set(updatedCustomers);
    
    // Save to CouchDB
    this.saving.set(true);
    this.customerService.saveCustomers(updatedCustomers).subscribe({
      next: (response) => {
        this.saving.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'Customer updated successfully',
          life: 3000
        });
        this.closeDialog();
      },
      error: (error) => {
        this.saving.set(false);
        // Revert the local change if save fails
        this.customers.set(currentCustomers);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error.error?.reason || 'Failed to update customer',
          life: 3000
        });
      }
    });
  }
}