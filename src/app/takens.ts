import { InjectionToken } from '@angular/core';

export const INIT_COORDS = new InjectionToken<{ lat: number, long: number }>('INIT_COORDS');