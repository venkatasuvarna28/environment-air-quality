import { Injectable, signal } from '@angular/core';
import { ApiService } from './api';

@Injectable({ providedIn: 'root' })
export class LimitsService {
  pm25Limit = signal<number>(100);
  co2Limit  = signal<number>(500);

  constructor(private api: ApiService) {
    this.loadFromDb();
  }

  loadFromDb() {
    this.api.getLimits().subscribe({
      next: (rows: any[]) => {
        const pm25Row = rows.find(r => r.pollutantId === 1);
        const co2Row  = rows.find(r => r.pollutantId === 2);
        if (pm25Row) this.pm25Limit.set(pm25Row.safeLimit);
        if (co2Row)  this.co2Limit.set(co2Row.safeLimit);
      },
      error: () => console.warn('Could not load limits from DB, using defaults')
    });
  }

  update(pm25: number, co2: number) {
    this.pm25Limit.set(pm25);
    this.co2Limit.set(co2);
  }
}
