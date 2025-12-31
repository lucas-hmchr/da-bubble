import { TestBed } from '@angular/core/testing';

import { MessageInputService } from './message-intput.service';

describe('MessageIntputService', () => {
  let service: MessageInputService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MessageInputService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
