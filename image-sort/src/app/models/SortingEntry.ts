import { Keyword } from "./Keyword"

export class SortingEntry {

    file: File;
    keywords: Keyword[];
    folder:string | undefined;

    constructor(file:File, keywords:Keyword[]) { 
        this.file = file;
        this.keywords = keywords;
    }
}