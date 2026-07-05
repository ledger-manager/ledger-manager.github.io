import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { CustomerView } from './customer-view';

describe('CustomerView', () => {
  let component: CustomerView;
  let fixture: ComponentFixture<CustomerView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomerView],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomerView);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
