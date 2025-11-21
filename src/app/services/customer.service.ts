import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Customer } from '../components/mcm/model/customer.model';
import { MemberData } from '../components/mcm/model/member-data.model';
import { CouchdbService, CouchDBPutResponse } from './couchdb.service';

export interface CustomersDocument {
  _id?: string;
  _rev?: string;
  customers: MemberData[];
  updatedAt: string;
}

@Injectable({
  providedIn: 'root',
})
export class CustomerService {
  static readonly CUSTOMERS_DOC_ID = 'MCM_CUSTOMERS';

  private customersDocument: CustomersDocument | null = null;

  constructor(private couchdbService: CouchdbService) {}

  /**
   * Get customers data from CouchDB
   * @returns Observable of MemberData array
   */
  getCustomers(): Observable<MemberData[]> {
    return this.couchdbService.getDocument<CustomersDocument>(CustomerService.CUSTOMERS_DOC_ID).pipe(
      map(document => {
        this.customersDocument = document;
        // Set isActive to true by default if not present
        const customers = (document.customers || []).map(customer => ({
          ...customer,
          isActive: customer.isActive !== undefined ? customer.isActive : true
        }));
        return customers;
      }),
      catchError(error => {
        // If document doesn't exist (404), return empty array
        if (error.status === 404) {
          // ...existing code...
          return of([]);
        }
        throw error;
      })
    );
  }

  /**
   * Save customers data to CouchDB
   * @param customers Array of MemberData to save
   * @returns Observable of the put response
   */
  saveCustomers(customers: MemberData[]): Observable<CouchDBPutResponse> {
    const document: CustomersDocument = {
      customers: customers,
      updatedAt: new Date().toISOString()
    };

    // Include _rev if we have it (for updates)
    if (this.customersDocument?._rev) {
      document._rev = this.customersDocument._rev;
    }

    return this.couchdbService.putDocument(CustomerService.CUSTOMERS_DOC_ID, document).pipe(
      map(response => {
        // Update stored document revision for next save
        if (!this.customersDocument) {
          this.customersDocument = {
            _id: CustomerService.CUSTOMERS_DOC_ID,
            customers: customers,
            updatedAt: document.updatedAt
          };
        }
        this.customersDocument._rev = response.rev;
        return response;
      })
    );
  }
}