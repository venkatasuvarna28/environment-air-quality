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

} 
