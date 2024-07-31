import { IQuestGameModel } from "./IQuestModel";

export interface IGameModel {
  title: string;
  location: string;
}

export interface ICreateGameModel extends IGameModel {
  quests: IQuestGameModel[];
}
