import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError} from 'rxjs/operators';
import { KeywordResponse } from '../models/KeywordResponse';


@Injectable({
  providedIn: 'root'
})
export class ApiService {

  AWS_BASE_URL = "https://jgvb3cwzkc.execute-api.eu-central-1.amazonaws.com/prod";

  constructor(private http: HttpClient) { }

  getPresignedPutURLs(imgNames: string[]): Observable<string[]> {
    let params = new HttpParams();
    for( const idx in imgNames){
      params = params.set("key"+idx,imgNames[idx])
    }
    return this.http.get<string[]>(this.AWS_BASE_URL + '/presignedPutURLs',{params});
  }

  getPresignedGetURLs(imgNames: string[]): Observable<string[]> {
    let params = new HttpParams();
    for( const idx in imgNames){
      params = params.set("key"+idx,imgNames[idx])
    }
    return this.http.get<string[]>(this.AWS_BASE_URL + '/presignedGetURLs',{params});
  }

  putImgToS3(img: File, url:string): Observable<any> {
    return this.http.put(url,img);
  }

  getKeywordsForImages(imgNames: string[]): Observable<KeywordResponse[]> {
    let params = new HttpParams();
    for( const idx in imgNames){
      params = params.set("key"+idx,imgNames[idx])
    }
    
    return this.http.get<KeywordResponse[]>(this.AWS_BASE_URL + '/getKeywords',{params});
  }

  preparePresignedURL(url:string){
    return url;
  }


}
