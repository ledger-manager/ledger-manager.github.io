import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimations } from '@angular/platform-browser/animations';

import { RateCardView } from './rate-card-view';

describe('RateCardEdit', () => {
  let component: RateCardView;
  let fixture: ComponentFixture<RateCardView>;
  
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RateCardView],
      // Provide dependencies for standalone component
      providers: [provideAnimations()],
    })
    .compileComponents();

    fixture = TestBed.createComponent(RateCardView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
