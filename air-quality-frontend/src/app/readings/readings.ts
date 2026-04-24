import { Component, OnInit, OnDestroy, ChangeDetectorRef, inject, effect } from '@angular/core';
import { ApiService } from '../api';
import { CommonModule, } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LimitsService } from '../limits.service';
import { 

  Chart, 

  LineController, 

  LineElement, 

  PointElement, 

  LinearScale, 

  CategoryScale, 

  Legend, 

  Tooltip, 

  BarController, 

  BarElement 

} from 'chart.js'; 

Chart.register( 

  LineController, 

  LineElement, 

  PointElement, 

  LinearScale, 

  CategoryScale, 

  Legend, 

  Tooltip, 

  BarController, 

  BarElement 

); 

@Component({
  selector: 'app-readings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './readings.html',
  styleUrls: ['./readings.css']
})
export class ReadingsComponent implements OnInit, OnDestroy {
  limits = inject(LimitsService);

  chartPM: any;   // PM2.5 live chart
  chartCO2: any;  // CO₂ live chart
  chart2: any;    // exceed bar chart

  readings: any[] = []; 

  filteredReadings: any[] = []; 

  selectedCity = "All"; 

  selectedChartCity = "All";

  exceed: any[] = [];
  exceedPageSize: string = '10';

  stations: any[] = []; 
  dailyExceed:any[] = [];
  worstHour:any[] = [];

  // ── Live timeline simulation ──────────────────────────────────
  allTimestamps: string[] = [];
  revealedUpToIndex = -1;
  speedIndex = 1;
  readonly speedOptions = [
    { label: '0.5×', ms: 20000 },
    { label: '1×',   ms: 10000 },
    { label: '1.5×', ms:  6000 },
    { label: '2×',   ms:  3000 },
  ];
  private liveTimer: any = null;
  private readonly REAL_INTERVAL_MS = 10 * 60 * 1000;
  rowAnimKey = 0;

  // ── Chart live state ─────────────────────────────────────────
  private allHourGroups: { hourKey: string; label: string; readings: any[] }[] = [];
  private blinkRPM = 5;  private blinkGrowingPM = true;  private blinkRafPM: any = null;
  private blinkRCO2 = 5; private blinkGrowingCO2 = true; private blinkRafCO2: any = null;


   

totalStations = 0; 

totalReadings = 0;


 
constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {
    effect(() => {
      const pm25 = this.limits.pm25Limit();
      const co2  = this.limits.co2Limit();
      if (this.chartPM?.data?.labels?.length) {
        const len = this.chartPM.data.labels.length;
        (this.chartPM.data.datasets as any[]).forEach((d: any) => { if (d.label === 'PM2.5 Limit') d.data = new Array(len).fill(pm25); });
        this.chartPM.update();
      }
      if (this.chartCO2?.data?.labels?.length) {
        const len = this.chartCO2.data.labels.length;
        (this.chartCO2.data.datasets as any[]).forEach((d: any) => { if (d.label === 'CO₂ Limit') d.data = new Array(len).fill(co2); });
        this.chartCO2.update();
      }
    });
  }

 
ngOnInit() { 
console.log("Loading data..."); 

    this.loadAllData(); 

 } 

loadAllData() { 

 // Load stations first 

    this.api.getStations().subscribe((s:any[]) => { 

    console.log("Stations:", s); 

      this.stations = s; 

      this.totalStations = s.length; 

    // Load readings 

      this.api.getReadings().subscribe((r:any[]) => { 

      console.log("Readings:", r); 

        this.readings = r; 

        this.filteredReadings = r; 

        this.totalReadings = r.length; 

        // Build sorted unique timestamp list
        this.allTimestamps = [...new Set(r.map((x: any) => x.timestamp as string))]
          .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
        // Reveal first timestamp immediately, then tick every 10 min
        this.revealNext();
        this.startLiveTimer();

        // Load exceed readings 

        this.api.getExceed().subscribe((e:any[]) => { 

          console.log("Exceed:", e); 

          this.exceed = e; 
          this.api.getDailyExceed().subscribe((d:any[])=>{
            console.log("Daily Exceed:",d);
            this.dailyExceed=d;
            this.cdr.detectChanges();
          });
           this.api.getWorstHour().subscribe((w:any[])=>{
            console.log("Worst Hour:",w);
            this.worstHour = w;
            this.cdr.detectChanges();
          });


          this.createChart();
          this.createExceedChart();

          this.totalStations = this.stations.length;
          this.totalReadings = this.readings.length;

          // FORCE UI refresh (this fixes disappearing issue) 

          this.cdr.detectChanges(); 

        }); 

      }); 

    }); 

  } 

 getStationName(id:number) { 

    const station = this.stations.find( 

      s => s.id === id 

    ); 

   return station ? station.name : id; 

  } 

  getExceedStationName(key: any): string {
    // key may be a numeric id or already a station name string
    const byId = this.stations.find(s => s.id === key || s.id === +key);
    if (byId) return byId.name;
    const byName = this.stations.find(s => s.name === key);
    if (byName) return byName.name;
    return key;
  }

  formatWorstHour(): string {
    const h = this.worstHour[0];
    if (h == null) return '';
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const ampm = h < 12 ? 'AM' : 'PM';
    return `${hour12}:00 ${ampm}`;
  }

  getWorstHourCity(): string {
    const h = this.worstHour[0];
    if (h == null || !this.readings.length) return '';
    const atHour = this.readings.filter(r => new Date(r.timestamp).getHours() === h);
    const cityAvg = new Map<number, { sum: number; count: number }>();
    for (const r of atHour) {
      if (!cityAvg.has(r.stationId)) cityAvg.set(r.stationId, { sum: 0, count: 0 });
      const entry = cityAvg.get(r.stationId)!;
      entry.sum += r.value;
      entry.count++;
    }
    let worstId = -1, worstAvg = -1;
    cityAvg.forEach((v, id) => {
      const avg = v.sum / v.count;
      if (avg > worstAvg) { worstAvg = avg; worstId = id; }
    });
    return this.getStationName(worstId);
  }

  getWorstHourAvgs(): { pm25: number | null; co2: number | null } {
    const h = this.worstHour[0];
    if (h == null || !this.readings.length) return { pm25: null, co2: null };
    const atHour = this.readings.filter(r => new Date(r.timestamp).getHours() === +h);
    const pm25Rows = atHour.filter(r => r.pollutantId === 1);
    const co2Rows  = atHour.filter(r => r.pollutantId === 2);
    const pm25 = pm25Rows.length ? pm25Rows.reduce((s, r) => s + r.value, 0) / pm25Rows.length : null;
    const co2  = co2Rows.length  ? co2Rows.reduce((s, r) => s + r.value, 0)  / co2Rows.length  : null;
    return { pm25, co2 };
  }

  getExceedByStation() {
    const pm25Limit = this.limits.pm25Limit();
    const co2Limit  = this.limits.co2Limit();
    const revealedTs = this.revealedUpToIndex >= 0
      ? new Set(this.allTimestamps.slice(0, this.revealedUpToIndex + 1))
      : new Set<string>();

    const map = new Map<number, { pm25: number; co2: number }>();
    for (const r of this.readings) {
      if (!revealedTs.has(r.timestamp)) continue;
      if (this.selectedCity !== 'All' && this.getStationName(r.stationId) !== this.selectedCity) continue;
      const exceeds =
        (r.pollutantId === 1 && r.value > pm25Limit) ||
        (r.pollutantId === 2 && r.value > co2Limit);
      if (!exceeds) continue;
      if (!map.has(r.stationId)) map.set(r.stationId, { pm25: 0, co2: 0 });
      const entry = map.get(r.stationId)!;
      if (r.pollutantId === 1) entry.pm25++;
      if (r.pollutantId === 2) entry.co2++;
    }
    return Array.from(map.entries()).map(([stationId, counts]) => ({
      station: this.getStationName(stationId),
      pm25: counts.pm25,
      co2: counts.co2,
      total: counts.pm25 + counts.co2
    }));
  }


  getStatusColor(r:any) {
  if (r.pollutantId == 1) {
   return r.value > this.limits.pm25Limit() ? 'red' : 'green';
  }
  if (r.pollutantId == 2) {
    return r.value > this.limits.co2Limit() ? 'red' : 'green';
  }
  return 'black';
} 

getPollutantName(id:number) { 

 if (id == 1) 

    return 'PM2.5 (µg/m³)'; 

 if (id == 2) 

    return 'CO2 (ppm)'; 

 return id; 

} 

createChart() {
  this.allHourGroups = this.groupByHour(this.readings);
  this.buildPM25Chart();
  this.buildCO2Chart();
}

/** Groups readings by hour, returns { hourKey, label, readings[] }[] sorted chronologically */
private groupByHour(data: any[]): { hourKey: string; label: string; readings: any[] }[] {
  const map = new Map<string, any[]>();
  for (const r of data) {
    const d = new Date(r.timestamp);
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}-${d.getHours()}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(r);
  }
  return [...map.entries()]
    .sort((a, b) => {
      const [ay, am, ad, ah] = a[0].split('-').map(Number);
      const [by, bm, bd, bh] = b[0].split('-').map(Number);
      return new Date(ay, am, ad, ah).getTime() - new Date(by, bm, bd, bh).getTime();
    })
    .map(([key, rows]) => {
      const [y, mo, d, h] = key.split('-').map(Number);
      const hour12 = h % 12 === 0 ? 12 : h % 12;
      const ampm = h < 12 ? 'AM' : 'PM';
      return { hourKey: key, label: `${hour12}:00 ${ampm}`, readings: rows };
    });
}

/** Averages pollutant values within a group of readings */
private avgValue(rows: any[], stationId: number | null, pollutantId: number): number | null {
  const filtered = stationId != null
    ? rows.filter(r => r.stationId === stationId && r.pollutantId === pollutantId)
    : rows.filter(r => r.pollutantId === pollutantId);
  if (!filtered.length) return null;
  return filtered.reduce((s, r) => s + r.value, 0) / filtered.length;
}

/** Builds a single-pollutant live line chart */
private buildSingleChart(
  canvasId: string,
  pollutantId: 1 | 2,
  palette: string[],
  limitValue: () => number,
  limitLabel: string,
  yLabel: string,
  yColor: string,
  unit: string,
  blinkRRef: { v: number },
  blinkGrowRef: { v: boolean },
  existingChart: any,
  blinkRafRef: { id: any }
): any {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return existingChart;
  const ctx = (canvas as HTMLCanvasElement).getContext('2d');
  if (!ctx) return existingChart;

  if (existingChart) existingChart.destroy();
  if (blinkRafRef.id) { cancelAnimationFrame(blinkRafRef.id); blinkRafRef.id = null; }

  const hourLabels = this.allHourGroups.map(g => g.label);
  const n = this.allHourGroups.length;
  const stationIds = [...new Set(this.readings.map((r: any) => r.stationId as number))];
  const isAllCities = this.selectedChartCity === 'All';
  const nullArr = () => new Array(n).fill(null);
  const datasets: any[] = [];

  if (isAllCities) {
    stationIds.forEach((stationId, idx) => {
      const color = palette[idx % palette.length];
      datasets.push({
        label: this.getStationName(stationId), data: nullArr(),
        borderColor: color, backgroundColor: color + '22',
        pointBackgroundColor: color, pointBorderColor: '#fff', pointBorderWidth: 2,
        fill: false, tension: 0.4, pointRadius: 5, pointHoverRadius: 10,
        borderWidth: 2.5, spanGaps: false
      });
    });
  } else {
    datasets.push({
      label: this.selectedChartCity, data: nullArr(),
      borderColor: palette[0], backgroundColor: palette[0] + '22',
      pointBackgroundColor: palette[0], pointBorderColor: '#fff', pointBorderWidth: 2,
      fill: true, tension: 0.4, pointRadius: 5, pointHoverRadius: 10,
      borderWidth: 3, spanGaps: false
    });
  }
  datasets.push({
    label: limitLabel, data: new Array(n).fill(limitValue()),
    borderColor: 'rgba(231,76,60,0.75)', borderDash: [8, 4], borderWidth: 2,
    fill: false, pointRadius: 0, tension: 0
  });

  const blinkPlugin = {
    id: `liveBlink_${canvasId}`,
    afterDraw(chart: any) {
      const lastIdx: number = chart._liveIdx ?? -1;
      if (lastIdx < 0) return;
      chart.data.datasets.forEach((ds: any, dsIdx: number) => {
        if ((ds.pointRadius ?? 0) === 0) return;
        const meta = chart.getDatasetMeta(dsIdx);
        const pt = meta.data[lastIdx];
        if (!pt || ds.data[lastIdx] == null) return;
        const c = chart.ctx;
        const alpha = Math.max(0, 1 - (blinkRRef.v - 5) / 14);
        c.save();
        c.beginPath();
        c.arc(pt.x, pt.y, blinkRRef.v, 0, Math.PI * 2);
        c.strokeStyle = ds.borderColor;
        c.lineWidth = 2.5;
        c.globalAlpha = alpha;
        c.stroke();
        c.restore();
      });
    }
  };

  const chart = new Chart(ctx, {
    type: 'line',
    data: { labels: hourLabels, datasets },
    plugins: [blinkPlugin],
    options: {
      responsive: true,
      interaction: { mode: 'index', intersect: false },
      animation: { duration: 500, easing: 'easeInOutQuart' },
      plugins: {
        legend: { position: 'top', labels: { usePointStyle: true, pointStyleWidth: 10, padding: 18, font: { size: 12, weight: 'bold' as const } } },
        tooltip: {
          backgroundColor: 'rgba(15,30,55,0.93)',
          titleColor: '#90caf9', titleFont: { size: 13, weight: 'bold' as const },
          bodyColor: '#e0e0e0', bodyFont: { size: 12 },
          padding: 14, cornerRadius: 10, borderColor: 'rgba(100,150,255,0.3)', borderWidth: 1,
          filter: (item: any) => item.parsed.y != null,
          callbacks: {
            label: (item: any) => {
              const v = item.parsed.y;
              if (v == null) return '';
              return `  ${item.dataset.label}: ${Number(v).toFixed(1)} ${unit}`;
            }
          }
        }
      },
      scales: {
        x: { grid: { color: 'rgba(100,120,180,0.1)', drawTicks: false }, ticks: { color: '#5a6a80', font: { size: 12, weight: 'bold' as const }, padding: 8 }, border: { dash: [4, 4] } },
        y: {
          beginAtZero: pollutantId === 1,
          title: { display: true, text: yLabel, color: yColor, font: { size: 12, weight: 'bold' as const } },
          grid: { color: yColor + '18' },
          ticks: { color: yColor, font: { size: 11 } }
        }
      }
    }
  });

  const animateBlink = () => {
    if (!chart) return;
    if (blinkGrowRef.v) { blinkRRef.v += 0.35; if (blinkRRef.v >= 19) blinkGrowRef.v = false; }
    else { blinkRRef.v -= 0.35; if (blinkRRef.v <= 5) { blinkRRef.v = 5; blinkGrowRef.v = true; } }
    chart.update('none');
    blinkRafRef.id = requestAnimationFrame(animateBlink);
  };
  blinkRafRef.id = requestAnimationFrame(animateBlink);
  return chart;
}

private buildPM25Chart() {
  const rafRef = { id: this.blinkRafPM };
  const rRef = { v: this.blinkRPM }, gRef = { v: this.blinkGrowingPM };
  this.chartPM = this.buildSingleChart(
    'pm25Chart', 1,
    ['#3498db','#9b59b6','#2980b9','#f39c12','#e74c3c','#e67e22'],
    () => this.limits.pm25Limit(), 'PM2.5 Limit',
    'PM2.5 (µg/m³)', '#3498db', 'µg/m³',
    rRef, gRef, this.chartPM, rafRef
  );
  this.blinkRafPM = rafRef.id;
  this.patchChartData();
}

private buildCO2Chart() {
  const rafRef = { id: this.blinkRafCO2 };
  const rRef = { v: this.blinkRCO2 }, gRef = { v: this.blinkGrowingCO2 };
  this.chartCO2 = this.buildSingleChart(
    'co2Chart', 2,
    ['#27ae60','#1abc9c','#16a085','#2ecc71','#00897b','#26a69a'],
    () => this.limits.co2Limit(), 'CO₂ Limit',
    'CO₂ (ppm)', '#27ae60', 'ppm',
    rRef, gRef, this.chartCO2, rafRef
  );
  this.blinkRafCO2 = rafRef.id;
  this.patchChartData();
}

/** Patches both charts in-place — no destroy/recreate */
private patchChartData() {
  const revealedTs = this.revealedUpToIndex >= 0
    ? new Set(this.allTimestamps.slice(0, this.revealedUpToIndex + 1))
    : new Set<string>();
  const stationIds = [...new Set(this.readings.map((r: any) => r.stationId as number))];
  const isAllCities = this.selectedChartCity === 'All';
  let lastRevIdx = -1;

  this.allHourGroups.forEach((g, hIdx) => {
    const revRows = g.readings.filter((r: any) => revealedTs.has(r.timestamp));
    if (revRows.length > 0) lastRevIdx = hIdx;
    const cityRows = !isAllCities
      ? revRows.filter((r: any) => this.getStationName(r.stationId) === this.selectedChartCity)
      : revRows;

    if (this.chartPM) {
      if (isAllCities) {
        stationIds.forEach((sid, i) => {
          (this.chartPM.data.datasets[i] as any).data[hIdx] = revRows.length ? this.avgValue(revRows, sid, 1) : null;
        });
      } else {
        (this.chartPM.data.datasets[0] as any).data[hIdx] = cityRows.length ? this.avgValue(cityRows, null, 1) : null;
      }
    }
    if (this.chartCO2) {
      if (isAllCities) {
        stationIds.forEach((sid, i) => {
          (this.chartCO2.data.datasets[i] as any).data[hIdx] = revRows.length ? this.avgValue(revRows, sid, 2) : null;
        });
      } else {
        (this.chartCO2.data.datasets[0] as any).data[hIdx] = cityRows.length ? this.avgValue(cityRows, null, 2) : null;
      }
    }
  });

  if (this.chartPM)  { (this.chartPM  as any)._liveIdx = lastRevIdx; this.chartPM.update('active'); }
  if (this.chartCO2) { (this.chartCO2 as any)._liveIdx = lastRevIdx; this.chartCO2.update('active'); }
}

createExceedChart() {
  const canvas = document.getElementById('exceedChart');
  if (!canvas) return;
  const ctx = (canvas as HTMLCanvasElement).getContext('2d');
  if (!ctx) return;

  const data = this.getExceedByStation();
  const labels = data.map(d => d.station);
  const pm25Data = data.map(d => d.pm25);
  const co2Data = data.map(d => d.co2);

  if (this.chart2) this.chart2.destroy();

  this.chart2 = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: 'PM2.5 Exceeds',
          data: pm25Data,
          backgroundColor: 'rgba(231,76,60,0.75)',
          borderColor: 'rgba(231,76,60,1)',
          borderWidth: 2,
          borderRadius: 6
        },
        {
          label: 'CO2 Exceeds',
          data: co2Data,
          backgroundColor: 'rgba(52,152,219,0.75)',
          borderColor: 'rgba(52,152,219,1)',
          borderWidth: 2,
          borderRadius: 6
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { position: 'top' },
        tooltip: { mode: 'nearest', intersect: true }
      },
      scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1 } }
      }
    }
  });
}



patchExceedChart() {
    if (!this.chart2) return;
    const data = this.getExceedByStation();
    this.chart2.data.labels = data.map(d => d.station);
    this.chart2.data.datasets[0].data = data.map(d => d.pm25);
    this.chart2.data.datasets[1].data = data.map(d => d.co2);
    this.chart2.update();
  }

filterByCity() { 

  if (this.selectedCity === 'All') { 

    this.filteredReadings = 

      this.readings; 

  } 

else { 

  this.filteredReadings = 

      this.readings.filter(r => 

        this.getStationName(r.stationId) 

        === this.selectedCity 

      ); 

  }
  this.patchExceedChart();
} 

filterChartByCity() {
  if (this.revealedUpToIndex >= 0) {
    this.patchChartData();
    return;
  }
  setTimeout(() => { this.buildPM25Chart(); this.buildCO2Chart(); }, 100);
}

// ── Live timeline simulation ──────────────────────────────────
get currentTimestamp(): string {
  return this.allTimestamps[this.revealedUpToIndex] ?? '';
}

/** All rows for all revealed timestamps, newest first */
getAccumulatedTableData() {
  const cityFilter = this.selectedCity;
  const result: any[] = [];
  for (let i = this.revealedUpToIndex; i >= 0; i--) {
    const ts = this.allTimestamps[i];
    const rows = this.readings.filter(r =>
      r.timestamp === ts &&
      (cityFilter === 'All' || this.getStationName(r.stationId) === cityFilter)
    );
    const map = new Map<number, any>();
    for (const r of rows) {
      if (!map.has(r.stationId))
        map.set(r.stationId, { city: this.getStationName(r.stationId), pm25: null, co2: null, time: ts, isLatest: i === this.revealedUpToIndex });
      const e = map.get(r.stationId);
      if (r.pollutantId === 1) e.pm25 = r.value;
      if (r.pollutantId === 2) e.co2 = r.value;
    }
    map.forEach(v => result.push(v));
  }
  return result;
}

revealNext() {
  if (this.revealedUpToIndex < this.allTimestamps.length - 1) {
    this.revealedUpToIndex++;
    this.rowAnimKey = Date.now();
    this.updateChartToLatest();
    this.cdr.detectChanges();
  } else {
    this.stopLiveTimer();
  }
}

updateChartToLatest() {
  if (this.revealedUpToIndex < 0) return;
  this.patchChartData();
  this.patchExceedChart();
}

startLiveTimer() {
  this.stopLiveTimer();
  const isFastForward = this.speedIndex !== 1;
  const interval = isFastForward
    ? this.speedOptions[this.speedIndex].ms
    : this.REAL_INTERVAL_MS;
  this.liveTimer = setInterval(() => this.revealNext(), interval);
}

stopLiveTimer() {
  if (this.liveTimer) { clearInterval(this.liveTimer); this.liveTimer = null; }
}

cycleSpeed() {
  this.speedIndex = (this.speedIndex + 1) % this.speedOptions.length;
  this.startLiveTimer();
}

  get currentSpeedLabel(): string {
    return this.speedOptions[this.speedIndex].label;
  }

  get filteredUnsafeCount(): number {
    return this.getAccumulatedTableData()
      .filter(r => r.pm25 > this.limits.pm25Limit() || r.co2 > this.limits.co2Limit()).length;
  }

  get filteredSafeCount(): number {
    return this.getAccumulatedTableData()
      .filter(r => r.pm25 <= this.limits.pm25Limit() && r.co2 <= this.limits.co2Limit()).length;
  }

  get accumulatedTotalReadings(): number {
    return this.getAccumulatedTableData().length;
  }

  get pagedExceed(): any[] {
    if (this.exceedPageSize === 'all') return this.exceed;
    return this.exceed.slice(0, Number(this.exceedPageSize));
  }

  getStationMapData() {
    // Use current revealed timestamp snapshot, fallback to latest in readings
    const currentTs = this.revealedUpToIndex >= 0
      ? this.allTimestamps[this.revealedUpToIndex]
      : null;
    return this.stations.map(station => {
      const snapshot = currentTs
        ? this.readings.filter(r => r.stationId === station.id && r.timestamp === currentTs)
        : this.readings.filter(r => r.stationId === station.id).slice(-2);

      const pm25 = snapshot.find((r: any) => r.pollutantId === 1)?.value ?? null;
      const co2  = snapshot.find((r: any) => r.pollutantId === 2)?.value ?? null;

      // Status logic using admin-configured limits:
      // Danger  : CO2 > limit*1.2 OR PM2.5 > limit*0.75
      // Moderate: CO2 > limit     OR PM2.5 > limit*0.5
      // Safe    : everything below
      const pm25Lim = this.limits.pm25Limit();
      const co2Lim  = this.limits.co2Limit();
      let status = 'Safe';
      if ((co2 !== null && co2 > co2Lim * 1.2) || (pm25 !== null && pm25 > pm25Lim * 0.75)) {
        status = 'Danger';
      } else if ((co2 !== null && co2 > co2Lim) || (pm25 !== null && pm25 > pm25Lim * 0.5)) {
        status = 'Moderate';
      }

      return { name: station.name, location: station.location, pm25, co2, status };
    });
  }get isFastForward(): boolean {
  return this.speedIndex !== 1;
}

formatDateTime(timestamp: string) {
  if (!timestamp) return '';
  const stored = new Date(timestamp);
  const now = new Date();
  // Keep the time from the stored timestamp but use today's real date
  const display = new Date(
    now.getFullYear(), now.getMonth(), now.getDate(),
    stored.getHours(), stored.getMinutes(), 0
  );
  return display.toLocaleString('en-IN', {
    day: '2-digit', month: 'short',
    hour: '2-digit', minute: '2-digit', hour12: true
  });
}



getCityTableData() { 

  const cities = 

    [...new Set( 

      this.filteredReadings.map(r => 

        this.getStationName(r.stationId) 

      ) 

    )]; 

  return cities.map(city => { 

    const pm = 

      this.filteredReadings.find(r => 

        this.getStationName(r.stationId) === city 

        && r.pollutantId === 1 

      ); 

    const co = 

      this.filteredReadings.find(r => 

        this.getStationName(r.stationId) === city 

        && r.pollutantId === 2 

      ); 

 return { 

      id: pm ? pm.stationId : co?.stationId, 

      city: city, 

      pm25: pm ? pm.value : 0, 

      co2: co ? co.value : 0, 

      time: pm 

        ? pm.timestamp 

        : co?.timestamp 

   }; 

  }); 

} 

formatTime(timestamp: string) { 

if (!timestamp) return ''; 

  const date = new Date(timestamp); 

  return date.toLocaleTimeString(); 

}

ngOnDestroy() {
  this.stopLiveTimer();
  if (this.blinkRafPM)  { cancelAnimationFrame(this.blinkRafPM);  this.blinkRafPM  = null; }
  if (this.blinkRafCO2) { cancelAnimationFrame(this.blinkRafCO2); this.blinkRafCO2 = null; }
  if (this.chartPM)  { this.chartPM.destroy();  this.chartPM  = null; }
  if (this.chartCO2) { this.chartCO2.destroy(); this.chartCO2 = null; }
  if (this.chart2)   { this.chart2.destroy();   this.chart2   = null; }
}

}

 
 
 
 
 
 
 
 
 
 
 
 
 
