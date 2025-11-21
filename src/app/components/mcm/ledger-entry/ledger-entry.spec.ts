import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LedgerEntry } from './ledger-entry';

describe('LedgerEntry', () => {
  let component: LedgerEntry;
  let fixture: ComponentFixture<LedgerEntry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LedgerEntry]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LedgerEntry);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
