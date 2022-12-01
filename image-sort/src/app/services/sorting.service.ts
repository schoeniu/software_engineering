import { Injectable } from '@angular/core';
import { kMaxLength } from 'buffer';
import { Keyword } from '../models/Keyword';
import { KeywordResponse } from '../models/KeywordResponse';
import { SortingEntry } from '../models/SortingEntry';

@Injectable({
  providedIn: 'root'
})
export class SortingService {
  

  constructor() { }

  threshold = 0.75;

  assignedKeywords:string[] = [];
  assignedCounter:number = 0;

  sort(files: File[],keywordResponses:KeywordResponse[],sliderValue:number):SortingEntry[]{
      this.threshold = sliderValue/100;
      const sortingEntries:SortingEntry[]=[];
      for (const i in files) {
        const entry = new SortingEntry(files[i], keywordResponses[i].keywords);
        sortingEntries.push(entry);
      }
      this.deepLog(sortingEntries);
      this.removeKeywordsBelowThreshold(sortingEntries);
      this.deepLog(sortingEntries);
      this.assignFolderToOnlyKeyword(sortingEntries);
      this.deepLog(sortingEntries);
      this.assignToExistingFolder(sortingEntries);
      this.deepLog(sortingEntries);
      
      let emergencyExit = 100;
      while(this.assignedCounter<sortingEntries.length && emergencyExit>0){
        console.log("Start loop")
        this.removeLowestKeyword(sortingEntries);
        console.log("After remove lowest")
        this.deepLog(sortingEntries);
        this.assignFolderToOnlyKeyword(sortingEntries);
        console.log("After assign only")
        this.deepLog(sortingEntries);
        
        this.assignToExistingFolder(sortingEntries);
        console.log("After assign existing")
        this.deepLog(sortingEntries);
        emergencyExit--;
      }


      return sortingEntries;
  }

  deepLog(obj:Object){
    console.log(JSON.parse(JSON.stringify(obj)));
  }

  assignFolderToOnlyKeyword(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.folder === undefined && e.keywords.length === 1){
        e.folder = e.keywords[0].keyword;
        this.assignedKeywords.push(e.folder);
        this.assignedCounter++;
      }
    }
  }

  removeKeywordsBelowThreshold(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.keywords.length > 1){
        const keysAboveThreshold:Keyword[] = [];
        e.keywords.forEach(k => {
          if(k.score>=this.threshold){
            keysAboveThreshold.push(k);
          }
        });
        if(keysAboveThreshold.length>0){
          e.keywords = keysAboveThreshold;
        }else{
          const scores = e.keywords.map(k => k.score);
          const highestScoreIndex = scores.indexOf(Math.max(...scores));
          e.keywords = Array.of<Keyword>(<Keyword>e.keywords.at(highestScoreIndex));
        }
      }
    }
  }

  assignToExistingFolder(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.folder === undefined){
        const matchingKeywords:Keyword[] = [];
        for (const k of e.keywords) {
          if(this.assignedKeywords.includes(k.keyword)){
            matchingKeywords.push(k);
          }
        }
        if(matchingKeywords.length > 0){
          const scores = matchingKeywords.map(k => k.score);
          const highestScoreIndex = scores.indexOf(Math.max(...scores));
          e.folder = matchingKeywords.at(highestScoreIndex)?.keyword;
          this.assignedCounter++;
        }
      }
    }
  }

  removeLowestKeyword(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.folder === undefined){
        const scores = e.keywords.map(k => k.score);
        const lowestScoreIndex = scores.indexOf(Math.min(...scores));
        e.keywords.splice(lowestScoreIndex,1);
      }  
    }
  }
  
}
