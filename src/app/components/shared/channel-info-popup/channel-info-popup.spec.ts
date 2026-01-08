import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChannelInfoPopup } from './channel-info-popup';

describe('ChannelInfoPopup', () => {
  let component: ChannelInfoPopup;
  let fixture: ComponentFixture<ChannelInfoPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChannelInfoPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ChannelInfoPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
