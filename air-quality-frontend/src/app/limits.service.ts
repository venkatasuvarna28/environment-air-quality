import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LimitsService {
  pm25Limit = signal<number>(100);
  co2Limit  = signal<number>(500);

  update(pm25: number, co2: number) {
    this.pm25Limit.set(pm25);
    this.co2Limit.set(co2);
  }
}
