import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddPeopleDialog } from './add-people-dialog';

describe('AddPeopleDialog', () => {
  let component: AddPeopleDialog;
  let fixture: ComponentFixture<AddPeopleDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddPeopleDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddPeopleDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
