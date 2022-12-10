import { Options } from '@angular-slider/ngx-slider/options';
import { Component, OnInit } from '@angular/core';
import { FormControl, FormsModule } from '@angular/forms';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';
import { Observable,forkJoin } from 'rxjs';
import { KeywordResponse } from './models/KeywordResponse';
import { ApiService } from './services/api.service';
import { MockService } from './services/mock.service';

import { UtilService } from './services/util.service';
import { SortingService } from './services/sorting.service';
import { NgxSpinnerService } from "ngx-spinner";
import { StateService } from './services/state.service';



@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {

  IS_DEVELOPMENT_MODE = false;
  MAX_NUMBER_OF_FILES = 15;
  MAX_FILE_SIZE = 10485760; //10MB in binary

  constructor(private apiService: ApiService, 
              private mockService: MockService, 
              private utilService:UtilService, 
              private sortingService:SortingService,
              private spinner: NgxSpinnerService,
              private stateService: StateService) { }


  title = 'image-sort';

  sliderValue: number = 75;
  options: Options = {
    floor: 50,
    ceil: 100
  };

  imagePath : any;
  url : any;
  images : any[] = [];
  tmpImages : any[] = [];

  public files: File[] = [];
  public fileNames: string[] = [];

  public dropped(inputFiles: NgxFileDropEntry[]) {
    console.log(this.sliderValue)
    this.clearFiles();
    if(!this.inputIsValid(inputFiles)){
      return;
    }
    for (const droppedFile of inputFiles) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      this.stateService.setState('');
      fileEntry.file((file: File) => {
        if(file.size>this.MAX_FILE_SIZE){
          this.clearFiles();
          this.stateService.handleError("Max file size is 10MB");
          return;
        }
        this.fileNames.push(this.utilService.encodeFileName(file.name));
        this.files.push(file);
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event) => { 
            const a = reader.result;
            this.tmpImages.push(a);
        }
        if(inputFiles.length === this.fileNames.length){
          this.images = this.tmpImages;
          this.startRequests();
        }
      });
    }
  }

  clearFiles(){
    this.fileNames = [];
    this.files = [];
    this.images = [];
    this.tmpImages = [];
  }

  startRequests() {
    this.stateService.setState('Uploading images...');
    if(this.IS_DEVELOPMENT_MODE){
      console.log("Mocking Keywordresponses");
      let sortedEntries;
      try {
        sortedEntries = this.sortingService.sort(this.files,this.mockService.mockKeywordResponses(),this.sliderValue);
      } catch (error) {
        this.stateService.handleError("Something went wrong when sorting.");
        return;
      }
      //this.utilService.zipImages(sortedEntries);
      this.stateService.setState('');
      return;
    }
    console.log('Starting requests with names: '+this.fileNames);
    const myObserver = {
      next: (s3PutURLs: string[]) => {
        console.log('Observer got a next value: ' + s3PutURLs);
        this.uploadImages(s3PutURLs);
      },
      error: (err: Error) => {
        console.error('Observer got an error: ' + err);
        this.stateService.handleError("Uploading images was unsuccessful.");
      }
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
      error: (err: Error) => {
        console.error('Uploading observer got an error: ' + err);
        this.stateService.handleError("Uploading images was unsuccessful.");
      }
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
    this.stateService.setState('Analyzing images...');
    const myObserver = {
      next: (keywordResponses:KeywordResponse[]) => {
        console.log('Keyword observer finished.');
        console.log(keywordResponses);
        let sortedEntries;
        try {
          sortedEntries = this.sortingService.sort(this.files,keywordResponses,this.sliderValue);
        } catch (error) {
          console.log('error')
          this.stateService.handleError("Something went wrong when sorting.");
          return;
        }
        this.utilService.zipImages(sortedEntries);
      },
      error: (err: Error) => {
        console.error('Keyword observer got an error: ' + err);
        this.stateService.handleError("Analyzing images was unsuccessful.");
      }
    };
    this.apiService.getKeywordsForImages(this.fileNames).subscribe(myObserver); 
  }
  
  public inputIsValid(files: NgxFileDropEntry[]):boolean{
    if (files.length === 0){
      return false;
    }
        
    if (files.length > this.MAX_NUMBER_OF_FILES){
      this.stateService.handleError("Max number of files is "+this.MAX_NUMBER_OF_FILES+".");
      return false; 
    }    
  
    for (const droppedFile of files) {
      if (!droppedFile.fileEntry.isFile){
        this.stateService.handleError("Uploading directories is not supported.");
        return false;
      }
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      const fileName = fileEntry.name.toLowerCase();
      if(!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && !fileName.endsWith(".png")){
        this.stateService.handleError("Only PNG or JPG images are supported.");
        return false;
      }      
    }
    return true;  
  }

  get getState(): string {
    return this.stateService.state;
  }
}
