import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgxFileDropEntry, FileSystemFileEntry, FileSystemDirectoryEntry } from 'ngx-file-drop';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'image-sort';

  message : string = "";
  imagePath : any;
  url : any;
  images : any[] = [];

  public files: File[] = [];

  public dropped(inputFiles: NgxFileDropEntry[]) {
    if(!this.inputIsValid(inputFiles)){
      return;
    }
    this.files = [];
    this.images = [];
    for (const droppedFile of inputFiles) {
      const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
      fileEntry.file((file: File) => {
        this.files.push(file)
        const reader = new FileReader();
        reader.readAsDataURL(file); 
        reader.onload = (_event) => { 
            const a = reader.result;
            this.images.push(a);
        }

        // Here you can access the real file
        // console.log(droppedFile.relativePath, file);

        /**
        // You could upload it like this:
        const formData = new FormData()
        formData.append('logo', file, relativePath)

        // Headers
        const headers = new HttpHeaders({
          'security-token': 'mytoken'
        })

        this.http.post('https://mybackend.com/api/upload/sanitize-and-save-logo', formData, { headers: headers, responseType: 'blob' })
        .subscribe(data => {
          // Sanitized logo returned from backend
        })
        **/

      });
    }
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
    console.log(event);
  }

  public fileLeave(event: any){
    console.log(event);
  }
}
