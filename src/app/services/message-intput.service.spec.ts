import { TestBed } from '@angular/core/testing';

import { MessageIntputService } from './message-intput.service';

describe('MessageIntputService', () => {
  let service: MessageIntputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageIntputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
