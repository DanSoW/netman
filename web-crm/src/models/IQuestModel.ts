export interface IQuestModel {
  id: number;
  location: string;
  lat: number;
  lng: number;
  task: string;
  action: string;
  radius: number;
  hint: string;
  marks_id: number;
}

export interface IQuestDataModel {
  task: string;
  action: string;
  radius: number;
  hint: string;
}
