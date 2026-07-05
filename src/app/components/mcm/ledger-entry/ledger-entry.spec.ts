import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { LedgerEntry } from './ledger-entry';

describe('LedgerEntry', () => {
  let component: LedgerEntry;
  let fixture: ComponentFixture<LedgerEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerEntry],
      providers: [provideHttpClient(), provideRouter([])]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerEntry);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
