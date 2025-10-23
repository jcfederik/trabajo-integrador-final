import { 
ApplicationConfig, 
provideBrowserGlobalErrorListeners, 
provideZoneChangeDetection, 
} from '@angular/core'; 
import { provideRouter } from '@angular/router'; 
import { provideHttpClient, withInterceptors } from 
'@angular/common/http'; 
import { routes } from './app.routes'; 
import { authInterceptor } from './services/auth-interceptor'; 
import { errorInterceptor } from './services/error.interceptor'; 
export const appConfig: ApplicationConfig = { 
providers: [ 
provideBrowserGlobalErrorListeners(), 
provideZoneChangeDetection({ eventCoalescing: true }), 
provideRouter(routes), 
// Provide HttpClient with functional interceptors 
provideHttpClient(withInterceptors([authInterceptor, 
errorInterceptor])), 
], 
}; 