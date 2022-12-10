import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import { saveAs } from 'file-saver-es';
import { SortingEntry } from '../models/SortingEntry';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
//service for utility methods
export class UtilService {

  ID_LENGTH = 16;

  constructor(private stateService: StateService) { }

  //method for creating an URL safe encoded file name with an id
  //the id exists to avoid naming conflicts in the S3 bucket
  encodeFileName(fileName:string):string {
    let id           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < this.ID_LENGTH; i++ ) {
      id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return id+encodeURIComponent(fileName);
  }

  //method for decoding an encoded file name
  decodeFileName(fileName:string):string{
    return decodeURIComponent(fileName.substring(this.ID_LENGTH));
  }

  //method for zipping and downloading images
  zipImages(sortingEntries: SortingEntry[]){
    this.stateService.setState('Packaging images...')
    //create zip
    const zip = new JSZip();
    sortingEntries.forEach(s => {
      zip.file(s.folder+"/"+s.file.name,s.file);
    });
    zip.generateAsync({ type: 'blob' }).then((content) => {
      //download zip
      saveAs(content, 'SortedImages.zip');
      this.stateService.showSuccess();
    });
  }
}
