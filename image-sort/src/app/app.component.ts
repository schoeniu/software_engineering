import { Options } from '@angular-slider/ngx-slider/options';
import { Component } from '@angular/core';
import { NgxFileDropEntry, FileSystemFileEntry} from 'ngx-file-drop';
import { Observable,forkJoin } from 'rxjs';
import { KeywordResponse } from './models/KeywordResponse';
import imageCompression  from 'browser-image-compression';

import { ApiService } from './services/api.service';
import { MockService } from './services/mock.service';
import { SortingService } from './services/sorting.service';
import { StateService } from './services/state.service';
import { UtilService } from './services/util.service';


@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
//main component with main workflow
export class AppComponent {

  //toggle for enabling API mocks during development
  IS_DEVELOPMENT_MODE = false;
  //may number of files allowed to upload
  MAX_NUMBER_OF_FILES = 15;
  //may size per file in bytes
  MAX_FILE_SIZE = 10485760; //10MB in binary

  constructor(private apiService: ApiService, 
              private mockService: MockService, 
              private utilService:UtilService, 
              private sortingService:SortingService,
              private stateService: StateService) { }

  //accuracy slider settings            
  sliderValue: number = 75;
  options: Options = {
    floor: 50,
    ceil: 100
  };
  //image compression settings   
  compressOptions = {
    maxSizeMB: 0.5,
    maxWidthOrHeight: 1920,
    useWebWorker: true
  }
  //array fpr displaying images
  images : any[] = [];
  //temporaray images array which is assigned to the images array above once ready
  tmpImages : any[] = [];
  //image files
  files: File[] = [];
  //compressed image files for upload
  compressedFiles: File[] = [];
  //image file encoded names
  fileNames: string[] = [];

  //method exectued when the user uploads images
  imagesAdded(inputFiles: NgxFileDropEntry[]) {
    //reset variables from previous uploads
    this.clearFiles();
    //validate input
    if(!this.inputIsValid(inputFiles)){
      //exit if not valid
      return;
    }
    this.stateService.setState('Processing images...');
    //unmarshal files from NgxFileDropEntry objects
    for (const droppedFile of inputFiles) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file(async (file: File) => {
        //validate file size
        if(file.size>this.MAX_FILE_SIZE){
          this.clearFiles();
          this.stateService.handleError("Max file size is 10MB");
          return;
        }
        //populates fileNames and files array
        this.fileNames.push(this.utilService.encodeFileName(file.name));
        this.files.push(file);
        //convert file to displayable image format
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event) => this.tmpImages.push(reader.result);
        //compress image for faster upload
        this.compressedFiles.push(await imageCompression(file,this.compressOptions));
        
        //when last file is unmarshaled, display images and start API calls for upload and analyzing
        if(inputFiles.length === this.compressedFiles.length){
          this.images = this.tmpImages;
          this.compressedFiles = this.sortingService.restoreCompressedImageOrder(this.compressedFiles,this.fileNames);
          this.getPresignedPutURLs();
        }
      });
    }
  }

  //method for resetting global variables
  private clearFiles(){
    this.fileNames = [];
    this.files = [];
    this.images = [];
    this.tmpImages = [];
    this.compressedFiles = [];
  }

  //method for getting presigned S3 PUT URLs
  private getPresignedPutURLs() {
    //set state to show overlay and prevent user interaction
    this.stateService.setState('Uploading images...');
    //use development mode with mock if active
    if(this.IS_DEVELOPMENT_MODE){
      this.executeDevMode();
      return;
    }
    const myObserver = {
      //upload images when S3 PUT URLs are available
      next: (s3PutURLs: string[]) => this.uploadImages(s3PutURLs),
      error: (err: Error) => this.stateService.handleError("Uploading images was unsuccessful.")
    };
    //call AWS API for getting presigned S3 PUT URLs
    this.apiService.getPresignedPutURLs(this.fileNames).subscribe(myObserver);  
  }

  //method for uploading images to S3
  private uploadImages(s3PutURLs: string[]){
    //prepare obervables with upload of images to S3
    const observables : Observable<any>[] = [];
    for (const idx in s3PutURLs) {
      observables.push(this.apiService.putImgToS3(this.compressedFiles[idx],s3PutURLs[idx]));
    }

    const myObserver = {
      //get keywords for images once images are uploaded
      next: (x:any) => this.getKeywords(),
      error: (err: Error) => this.stateService.handleError("Uploading images was unsuccessful.")
    };
    //upload all images
    forkJoin(observables).subscribe(myObserver);
  }

  //method for getting keywords for uploaded images
  private getKeywords(){
    //update state to show the user the progress
    this.stateService.setState('Analyzing images...');
    const myObserver = {
      next: (keywordResponses:KeywordResponse[]) => {
        //validate there were no errors (like running out of daily request quota)
        for(const response of keywordResponses){
          if(response.status === 'error'){
            this.stateService.handleError("Analyzing images was unsuccessful.");
            return;
          }
        }
        //sort images once their keywords are available
        let sortedEntries;
        try {
          sortedEntries = this.sortingService.sort(this.files,keywordResponses,this.sliderValue);
        } catch (error) {
          this.stateService.handleError("Something went wrong when sorting.");
          return;
        }
        //put images to zip according to previous sorting
        this.utilService.zipImages(sortedEntries);
      },
      error: (err: Error) => this.stateService.handleError("Analyzing images was unsuccessful.")
    };
    //call AWS keywords endpoint
    this.apiService.getKeywordsForImages(this.fileNames).subscribe(myObserver); 
  }
  
  //method for validating uploaded files
  private inputIsValid(files: NgxFileDropEntry[]):boolean{
    this.stateService.setState('Validating images...');
    if (files.length === 0){
      return false;
    }
    //validate max number of files is not reached    
    if (files.length > this.MAX_NUMBER_OF_FILES){
      this.stateService.handleError("Max number of files is "+this.MAX_NUMBER_OF_FILES+".");
      return false; 
    }    
  
    for (const droppedFile of files) {
      //validate no directories are uploaded
      if (!droppedFile.fileEntry.isFile){
        this.stateService.handleError("Uploading directories is not supported.");
        return false;
      }
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      const fileName = fileEntry.name.toLowerCase();
      //validate files are jpg or png images
      if(!fileName.endsWith(".jpg") && !fileName.endsWith(".jpeg") && !fileName.endsWith(".png")){
        this.stateService.handleError("Only PNG or JPG images are supported.");
        return false;
      }      
    }
    return true;  
  }

  //getter for current state, used from HTML file
  get getState(): string {
    return this.stateService.state;
  }

  //method for mokcing API calls during development
  private executeDevMode(){
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
  }
}
