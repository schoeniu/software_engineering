import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders} from '@angular/common/http';
import { Observable } from 'rxjs';
import { KeywordResponse } from '../models/KeywordResponse';


@Injectable({
  providedIn: 'root'
})
//service for making requests to APIs/AWS
export class ApiService {

  API_KEY = '<not committed to git>';
  AWS_BASE_URL = "https://eq8w3wifal.execute-api.eu-central-1.amazonaws.com/prod";

  constructor(private http: HttpClient) { }

  //method for getting presigned S3 PUT URLs for image names
  getPresignedPutURLs(imgNames: string[]): Observable<string[]> {
    let params = new HttpParams();
    for(const idx in imgNames){
      params = params.set("key"+idx,imgNames[idx])
    }
    const headers = new HttpHeaders().set('x-api-key',this.API_KEY);
    return this.http.get<string[]>(this.AWS_BASE_URL + '/presignedPutURLs',{headers,params});
  }
  //method for uploading an image to S3 with the S3 PUT URL
  putImgToS3(img: File, url:string): Observable<any> {
    return this.http.put(url,img);
  }
  //method for getting keywords for images
  getKeywordsForImages(imgNames: string[]): Observable<KeywordResponse[]> {
    let params = new HttpParams();
    for( const idx in imgNames){
      params = params.set("key"+idx,imgNames[idx])
    }
    const headers = new HttpHeaders().set('x-api-key',this.API_KEY);
    return this.http.get<KeywordResponse[]>(this.AWS_BASE_URL + '/getkeywords',{headers,params});
  }
}
