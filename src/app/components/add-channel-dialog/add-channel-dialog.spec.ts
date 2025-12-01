import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddChannelDialog } from './add-channel-dialog';

describe('AddChannelDialog', () => {
  let component: AddChannelDialog;
  let fixture: ComponentFixture<AddChannelDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddChannelDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddChannelDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
