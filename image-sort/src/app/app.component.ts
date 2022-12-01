import { Options } from '@angular-slider/ngx-slider/options';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { Observable,forkJoin } from 'rxjs';
import { KeywordResponse } from './models/KeywordResponse';
import { ApiService } from './services/api.service';
import { MockService } from './services/mock.service';

import { UtilService } from './services/util.service';
import { SortingService } from './services/sorting.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  IS_DEVELOPMENT_MODE = true;

  constructor(private apiService: ApiService, 
              private mockService: MockService, 
              private utilService:UtilService, 
              private sortingService:SortingService) { }

  title = 'image-sort';

  sliderValue: number = 75;
  options: Options = {
    floor: 50,
    ceil: 100
  };

  message : string = "";
  imagePath : any;
  url : any;
  images : any[] = [];

  public files: File[] = [];
  public fileNames: string[] = [];

  public dropped(inputFiles: NgxFileDropEntry[]) {
    console.log(this.sliderValue)
    if(!this.inputIsValid(inputFiles)){
      return;
    }
    this.fileNames = [];
    this.files = [];
    this.images = [];
    for (const droppedFile of inputFiles) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        this.fileNames.push(this.utilService.encodeFileName(file.name));
        this.files.push(file);
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event) => { 
            const a = reader.result;
            this.images.push(a);
        }
        if(inputFiles.length === this.fileNames.length){
          this.startRequests();
        }
      });
    }
  }

  startRequests() {
    if(this.IS_DEVELOPMENT_MODE){
      console.log("Mocking Keywordresponses");
      const sortedEntries = this.sortingService.sort(this.files,this.mockService.mockKeywordResponses(),this.sliderValue);
      this.utilService.zipImages(sortedEntries);
      return;
    }
    console.log('Starting requests with names: '+this.fileNames);
    const myObserver = {
      next: (s3PutURLs: string[]) => {
        console.log('Observer got a next value: ' + s3PutURLs);
        this.uploadImages(s3PutURLs);
      },
      error: (err: Error) => console.error('Observer got an error: ' + err)
    };

    this.apiService.getPresignedPutURLs(this.fileNames).subscribe(myObserver);  
  }
  
  uploadImages(s3PutURLs: string[]){
    const observables : Observable<any>[] = [];
    for (const idx in s3PutURLs) {
      observables.push(this.apiService.putImgToS3(this.files[idx],s3PutURLs[idx]));
    }

    const myObserver = {
      next: (x:any) => {
        console.log('Upload observer finished.');
        this.getKeywords();
      },
      error: (err: Error) => console.error('Upload observer got an error: ' + err)
    };
    forkJoin(observables).subscribe(myObserver);
  }

  getS3GetURLs(){
    const myObserver = {
      next: (s3GetURLs: string[]) => {
        console.log('getS3GetURLs Observer got a next value: ' + s3GetURLs);
        this.getKeywords();
      },
      error: (err: Error) => console.error('getS3GetURLs Observer got an error: ' + err)
    };
    this.apiService.getPresignedGetURLs(this.fileNames).subscribe(myObserver); 
  }

  getKeywords(){
    const myObserver = {
      next: (keywordResponses:KeywordResponse[]) => {
        console.log('Keyword observer finished.');
        console.log(keywordResponses);
        const sortedEntries = this.sortingService.sort(this.files,keywordResponses,this.sliderValue);
        this.utilService.zipImages(sortedEntries);
      },
      error: (err: Error) => console.error('Keyword observer got an error: ' + err)
    };
    this.apiService.getKeywordsForImages(this.fileNames).subscribe(myObserver); 
  }
  
  public inputIsValid(files: NgxFileDropEntry[]):boolean{
    if (files.length === 0)
        return false;
  
    for (const droppedFile of files) {
      if (!droppedFile.fileEntry.isFile){
        this.message = "Directories are not supported";
        return false;
      }
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      const fileName = fileEntry.name.toLowerCase();
      if(!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && !fileName.endsWith(".png")){
        this.message = "Only PNG and JPG images are supported.";
        return false;
      }      
    }
    this.message = "";
    return true;  
  }

  public fileOver(event: any){
    //console.log(event);
  }

  public fileLeave(event: any){
    //console.log(event);
  }




  
}
