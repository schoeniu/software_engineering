import { Injectable } from '@angular/core';
import JSZip, { file } from 'jszip';
import FileSaver from 'file-saver';
import { SortingEntry } from '../models/SortingEntry';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  
  ID_LENGTH = 16;

  constructor() { }

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
    const zip = new JSZip();
    sortingEntries.forEach(s => {
      zip.file(s.folder+"/"+s.file.name,s.file);
    });
    
    zip.generateAsync({ type: 'blob' }).then(function (content) {
      FileSaver.saveAs(content, 'SortedImages.zip');
    });
  }
}
