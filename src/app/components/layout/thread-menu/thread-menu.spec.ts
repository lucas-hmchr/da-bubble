import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ThreadMenu } from './thread-menu';

describe('ThreadMenu', () => {
  let component: ThreadMenu;
  let fixture: ComponentFixture<ThreadMenu>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThreadMenu]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ThreadMenu);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
