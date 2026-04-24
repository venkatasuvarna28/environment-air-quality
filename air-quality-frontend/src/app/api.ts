import { Injectable } from '@angular/core'; 

import { HttpClient } from '@angular/common/http'; 

 
 

@Injectable({ 

  providedIn: 'root' 

}) 

 
 

export class ApiService { 

  baseUrl = "http://localhost:8081/api"; 

  constructor(private http: HttpClient) {} 

 getReadings() { 

    return this.http.get<any[]>( 

      this.baseUrl + "/readings" 

    ); 

  } 

 getExceed() { 

    return this.http.get<any[]>( 

      this.baseUrl + "/readings/exceed" 

    ); 

  } 

 getStations() { 

    return this.http.get<any[]>( 

      this.baseUrl + "/stations" 

    ); 

  } 
  getDailyExceed(){
    return this.http.get<any[]>(
      this.baseUrl + "/readings/exceed/daily"
    );
  }
  getWorstHour(){
    return this.http.get<any[]>(
      this.baseUrl + "/readings/worst-hour"
    );
  }

  getLimits() {
    return this.http.get<any[]>(this.baseUrl + '/auth/limits');
  }

  saveLimits(pm25: number, co2: number) {
    return this.http.put<any>(
      this.baseUrl + '/auth/limits',
      [
        { pollutantId: 1, safeLimit: pm25 },
        { pollutantId: 2, safeLimit: co2 }
      ]
    );
  }

  login(username: string, password: string) {
    return this.http.post<{ success: boolean; message: string }>(
      this.baseUrl + '/auth/login',
      { username, password }
    );
  }

} 
