import { IQuestGameModel } from "./IQuestModel";

export interface IGameId {
  info_games_id: number;
}

export interface IGameModel {
  title: string;
  location: string;
}

export interface ICreateGameModel extends IGameModel {
  quests: IQuestGameModel[];
}
