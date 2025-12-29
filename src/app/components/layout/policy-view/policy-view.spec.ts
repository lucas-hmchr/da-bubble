import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolicyView } from './policy-view';

describe('PolicyView', () => {
  let component: PolicyView;
  let fixture: ComponentFixture<PolicyView>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolicyView]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolicyView);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
