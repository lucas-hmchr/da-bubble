import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PasswordForgot } from './password-forgot';

describe('PasswordForgot', () => {
  let component: PasswordForgot;
  let fixture: ComponentFixture<PasswordForgot>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PasswordForgot]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PasswordForgot);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
