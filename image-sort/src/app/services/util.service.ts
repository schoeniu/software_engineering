import { Injectable } from '@angular/core';
import JSZip, { file } from 'jszip';
import { saveAs } from 'file-saver-es';
import { SortingEntry } from '../models/SortingEntry';
import { StateService } from './state.service';


@Injectable({
  providedIn: 'root'
})
export class UtilService {

  
  ID_LENGTH = 16;

  constructor(private stateService: StateService) { }

  encodeFileName(fileName:string):string {
    let id           = '';
    const characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for ( let i = 0; i < this.ID_LENGTH; i++ ) {
      id += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return id+encodeURIComponent(fileName);
  }

  decodeFileName(fileName:string):string{
    return decodeURIComponent(fileName.substring(this.ID_LENGTH));
  }

  zipImages(sortingEntries: SortingEntry[]){
    this.stateService.setState('Packaging images...')
    const zip = new JSZip();
    sortingEntries.forEach(s => {
      zip.file(s.folder+"/"+s.file.name,s.file);
    });
    
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'SortedImages.zip');
      this.stateService.setState('');
    });
  }
}
