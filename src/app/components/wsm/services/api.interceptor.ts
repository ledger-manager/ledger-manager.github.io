import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {

  constructor() {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    if (request.url.startsWith(environment.JSON_BIN_API_URL)) {
      request = request.clone({
        setHeaders: {
          'X-Master-Key': environment.X_Master_Key,
          'X-Access-Key': environment.X_Access_Key
        }
      });
    }
    return next.handle(request);
  }
}
