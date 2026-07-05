import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { CouchdbService } from './couchdb.service';

describe('CouchdbService', () => {
  let service: CouchdbService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient()]
    });
    service = TestBed.inject(CouchdbService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
