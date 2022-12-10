import { Keyword } from "./Keyword"

//class for sorting algorithm
export class SortingEntry {

    //actual image file
    file: File;
    //keywords given by API
    keywords: Keyword[];
    //folder/keyword the image is assigned to during sorting
    folder:string | undefined;

    constructor(file:File, keywords:Keyword[]) { 
        this.file = file;
        this.keywords = keywords;
    }
}