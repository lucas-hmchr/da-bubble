import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddMemberPopup } from './add-member-popup';

describe('AddMemberPopup', () => {
  let component: AddMemberPopup;
  let fixture: ComponentFixture<AddMemberPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddMemberPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddMemberPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
