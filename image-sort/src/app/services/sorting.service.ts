import { Injectable } from '@angular/core';
import { Keyword } from '../models/Keyword';
import { KeywordResponse } from '../models/KeywordResponse';
import { SortingEntry } from '../models/SortingEntry';
import { StateService } from './state.service';

@Injectable({
  providedIn: 'root'
})
//service for sorting the images to folders based on keywords
export class SortingService {
  
  constructor(private stateService: StateService) { }

  //tracking already used keywords to be able to sort other images to them
  private assignedKeywords:string[] = [];
  //counter for tracking if all images are assigned to a keyword
  private assignedCounter:number = 0;

  //main sorting method
  sort(files: File[],keywordResponses:KeywordResponse[],sliderValue:number):SortingEntry[]{
      this.stateService.setState('Sorting images...')
      //convert arguments to SortingEntry array for easier sorting
      const sortingEntries:SortingEntry[]=[];
      for (const i in files) {
        sortingEntries.push(new SortingEntry(files[i], keywordResponses[i].keywords));
      }
      //remove keywords below threshold (if there is no keyword above threshold, leave the top one)
      this.removeKeywordsBelowThreshold(sortingEntries,sliderValue/100);
      //assign image to keyword if there is only one
      this.assignFolderToOnlyKeyword(sortingEntries);
      //assign image to keyword if there are already other images assigned to the same keyword
      this.assignToExistingFolder(sortingEntries);
      
      let emergencyExit = 1000;
      //keep assigning images until all are assigned
      //emergencyExit is to prevent inite loops through an unexpected bug. Should ideally never be needed.
      while(this.assignedCounter<sortingEntries.length && emergencyExit>0){
        this.removeLowestKeyword(sortingEntries);
        this.assignFolderToOnlyKeyword(sortingEntries);
        this.assignToExistingFolder(sortingEntries);
        emergencyExit--;
      }
      //throw error if we exit through emergencyExit
      if(emergencyExit<=0){
        throw Error("Emergency exit");
      }
      //return assigned images
      return sortingEntries;
  }

  //method for removing keywords below threshold (if there is no keyword above threshold, the top one is left)
  removeKeywordsBelowThreshold(sortingEntries:SortingEntry[],threshold:number){
    for (const e of sortingEntries) {
      if(e.keywords.length > 1){
        const keysAboveThreshold:Keyword[] = [];
        //get keywords above threshold
        e.keywords.forEach(k => {
          if(k.score>=threshold){
            keysAboveThreshold.push(k);
          }
        });
        if(keysAboveThreshold.length>0){
          //set keywords above threshold to SortingEntry
          e.keywords = keysAboveThreshold;
        }else{
          //if there are no keywords above threshold, take the one with top score
          const scores = e.keywords.map(k => k.score);
          const highestScoreIndex = scores.indexOf(Math.max(...scores));
          e.keywords = Array.of<Keyword>(<Keyword>e.keywords.at(highestScoreIndex));
        }
      }
    }
  }

  //method for assigning unassigned images to the only keyword they have
  assignFolderToOnlyKeyword(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.folder === undefined && e.keywords.length === 1){
        e.folder = e.keywords[0].keyword;
        this.assignedKeywords.push(e.folder);
        this.assignedCounter++;
      }
    }
  }

  
  //method for assigning unassigned images to keywords which other images are already assigned to
  assignToExistingFolder(sortingEntries:SortingEntry[]){
    for (const e of sortingEntries) {
      if(e.folder === undefined){
        const matchingKeywords:Keyword[] = [];
        //find keywords which other images are already assigned to
        for (const k of e.keywords) {
          if(this.assignedKeywords.includes(k.keyword)){
            matchingKeywords.push(k);
          }
        }
        //if at least one exists, assigned to the best fitting one
        if(matchingKeywords.length > 0){
          const scores = matchingKeywords.map(k => k.score);
          const highestScoreIndex = scores.indexOf(Math.max(...scores));
          e.folder = matchingKeywords.at(highestScoreIndex)?.keyword;
          this.assignedCounter++;
        }
      }
    }
  }

  //method for removing the lowest score keyword from sortingEntries
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
